##################################################################
# this uses byte objects
# good values: 90 150
##################################################################
import sys
import argparse
import pyaudio
import numpy as np
import wave
import statistics 
import json
import talkey
from signal import signal, SIGINT
from pyfiglet import Figlet

CHUNK = 512
sample_format = pyaudio.paInt16  # 16 bits per sample
channels = 1
#RATE = 16000
RATE = 32000

##################################################################
# set up command-line arguments
##################################################################
parser = argparse.ArgumentParser(prog=sys.argv[0], description='Record, trim, save audio', allow_abbrev=False)
#parser.add_argument('-p', '--phrase', type=str, required=True, dest='phrase')
parser.add_argument('-s', '--max-bg-start', type=int, dest='maxBackgroundStart')
parser.add_argument('-e', '--max-bg-end', type=int, dest='maxBackgroundEnd')
parser.add_argument('-l', '--length', type=int, dest='seconds')
parser.add_argument('-j', '--json-file', type=str, required=True, dest='jsonFile')
parser.add_argument('-t', '--strict-match', dest='strictMatch', action='store_true')
parser.set_defaults(maxBackgroundStart=80, maxBackgroundEnd=1, seconds=5, strictMatch=False)

args = parser.parse_args()




##################################################################
#init program global variables
##################################################################
phrase=''
maxBackgroundStart=args.maxBackgroundStart
maxBackgroundEnd=args.maxBackgroundEnd
seconds=args.seconds
jsonFile=args.jsonFile
strictMatch=args.strictMatch

frames = []
numActualRecordedFrames = 0
maxFramesBeforeTrim = 0

textToSpeech = talkey.Talkey(preferred_language=['en'])

p = pyaudio.PyAudio()  # Create an interface to PortAudio
f = Figlet()

phrasesArray = []

quitProgram = False

##################################################################
def listPhrasesTrained():

    listedPhrases = []
    for phrase in phrasesArray:
        #print(listedPhrases)
        if not phrase['phrase'] in listedPhrases:
            listedPhrases.append(phrase['phrase'])
            print(phrase['phrase'])


##################################################################
def signalHandler(signalReceived, frame):
    print('Got CTRL-C...')


    # Terminate the PortAudio interface
    global p
    p.terminate()

    print('Done.')

    sys.exit(0)


##################################################################
def recordAudio():

    stream = p.open(format=sample_format,
                channels=channels,
                rate=RATE,
                frames_per_buffer=CHUNK,
                input=True)

    global frames
    frames = []  # Initialize array to store frames

    print('recording...')

    isFirstValidSound = False
    lastSoundWasInvalid = False
    numConsecutiveInvalidSounds = 0
    global maxFramesBeforeTrim 
    #maxFramesBeforeTrim = len(frames)
    maxFramesBeforeTrim = int(RATE / CHUNK * seconds)
    for i in range(0, int(RATE / CHUNK * seconds)):
        data = stream.read(CHUNK)
        if not isFirstValidSound:
            if isValidStartingSound(data, maxBackgroundStart):
                print('.......capturing.....')
                print('.......capturing.....')
                print('.......capturing.....')
                isFirstValidSound = True
        if isFirstValidSound:
            isValid = isValidSound(data, maxBackgroundEnd)
            if lastSoundWasInvalid and not isValid:
                numConsecutiveInvalidSounds += 1
            elif not isValid:
                numConsecutiveInvalidSounds = 1
                lastSoundWasInvalid = True
            else:
                lastSoundWasInvalid = False

            if numConsecutiveInvalidSounds > 4:
                print('...Aborting capture.....')
                print('...Aborting capture.....')
                print('...Aborting capture.....')
                break

        if isFirstValidSound:
            frames.append(data)

    global numActualRecordedFrames
    numActualRecordedFrames = len(frames)

    # Stop and close the stream 
    stream.stop_stream()
    stream.close()


##################################################################
def compareTwoPhraseMetaData(phrase1, phrase2):

    numFrames = phrase1['numRecFrames']

    crossingsDiff = 0
    peakDiff = 0
    for i in range(numFrames):
            data1 = phrase1['frameData'][i]
            data2 = phrase2['frameData'][i]
            crDiff = abs(data1['crossings'] - data2['crossings'])
            pkDiff = abs(data1['peak'] - data2['peak'])
            crossingsDiff += crDiff
            peakDiff += pkDiff

    numFramesDiff = abs(phrase1['numRecFrames'] - phrase2['numRecFrames'])
    return crossingsDiff, peakDiff, numFramesDiff

##################################################################
def findBestMatch(latestPhrase, phrasesArray):

    numPhrases = len(phrasesArray)

    leastDiff = sys.maxsize
    bestMatchIndex = -1
    previousPhrase = ''
    numMatches = 0
    #print('numPhrases to compare against: ', numPhrases)
    for i in range(numPhrases):
        phrase = phrasesArray[i]
        #print('comparing ' + latestPhrase['phrase'] +', ' + str(latestPhrase['numRecFrames']) + 
                #' against ' + phrase['phrase'] + ', ' + str(phrase['numRecFrames']))
        crDiff, pkDiff, numFramesDiff = compareTwoPhraseMetaData(latestPhrase, phrase)
        difference = crDiff + pkDiff + numFramesDiff
        if leastDiff > difference:
            leastDiff = difference
            bestMatchIndex = i
            print(phrase['phrase'], ' ', leastDiff)

            if phrase['phrase'] == previousPhrase:
                numMatches += 1
                #print('currPhrase EQUALS previousPhrase', numMatches)
            else:
                numMatches = 0
                previousPhrase = phrase['phrase']
                #print('currPhrase NOT previousPhrase', numMatches)


    return leastDiff, numMatches, phrasesArray[bestMatchIndex]

##################################################################
def numZeroCrossings(data):
    length = data.size
    i = 0
    crossings = 0
    while i < length - 1:
        if (data[i] > 0 and data[i+1] < 0) or (data[i] < 0 and data[i+1] > 0):
            crossings += 1
        i += 2
    return crossings

##################################################################
def getAudioMetaData(frames):

    jsonArray = []
    for i in range(len(frames)):
        data = np.frombuffer(frames[i], dtype=np.int16)
        crossings = numZeroCrossings(data)
        peak = np.amax(np.abs(data))
        bars = int(255*peak/2**16)
        #dispbars = '#'*int(255*peak/2**16)
        #print(dispbars)
        jsonStr = {"crossings": crossings, "peak": bars}
        jsonArray.append(jsonStr)

    jsonObject = {
            "phrase": phrase, 
            "recLimitSecs": seconds,
            "framesLimit": maxFramesBeforeTrim,
            "numRecFrames": numActualRecordedFrames, "frameData": jsonArray }
    return jsonObject

##################################################################
def addFakeAudioMetaDataForFillerFrames(metaData):

    numRecFrames = metaData['numRecFrames']
    framesLimit  = metaData['framesLimit']
    numFillFrames = framesLimit - numRecFrames
    frameData = metaData['frameData']
    for i in range(numFillFrames):
        frameData.append({"crossings": 0, "peak": 0})
    #metaData['numRecFrames'] = framesLimit

##################################################################
def countVolumeValue(data, value):
    count = 0
    for i in range(len(data)):
        if data[i] == value:
            count += 1
    return count

##################################################################
def isValidStartingSound(data, maxBackground):

    try:

        mode = statistics.mode(data)
        volCount = countVolumeValue(data, mode)

        if mode > 250  and volCount>= maxBackground:
            return False
        if mode < 3    and volCount >= maxBackground:
            return False

        return True

    except:
        #print('exception')
        return False

##################################################################
def isValidSound(frame, maxBackground):
    jsonArray = []
    data = np.frombuffer(frame, dtype=np.int16)
    peak = np.amax(np.abs(data))
    bars = int(255*peak/2**16)
    print('#'*bars)
    if bars > maxBackground:
        return True
    else:
        return False

##################################################################


if __name__ == '__main__':
    signal(SIGINT, signalHandler)



print('Load Existing JSON meta data from file...')
try:
    phrasesFile = open(jsonFile,'r')
    phrasesString = phrasesFile.read()
    phrasesFile.close()
    phrasesArray = json.loads(phrasesString)
except:
    print('no pre-existing meta data..')


while not quitProgram:

    listPhrasesTrained()

    recordAudio()



    if len(frames) > 0:
        

        metaDataForLatestRecordedPhrase = getAudioMetaData(frames)
        addFakeAudioMetaDataForFillerFrames(metaDataForLatestRecordedPhrase)

        if len(phrasesArray) > 0:
            difference, numMatches, bestMatch = findBestMatch(metaDataForLatestRecordedPhrase, phrasesArray)
            print('bestMatch: ', bestMatch['phrase'], ' numMatches: ', numMatches)

            if strictMatch:
                if difference < 100 and numMatches > 3:
                    print(f.renderText(bestMatch['phrase']))
                    textToSpeech.say('You said, ' + bestMatch['phrase'])
                elif difference < 300 and numMatches > 3:
                    print(f.renderText(bestMatch['phrase']))
                    textToSpeech.say('I believe you said, ' + bestMatch['phrase'])
                elif numMatches > 2:
                    print(f.renderText(bestMatch['phrase']))
                    textToSpeech.say('I think you said, ' + bestMatch['phrase'])
                elif difference < 400:
                    print(f.renderText(bestMatch['phrase']))
                    textToSpeech.say(bestMatch['phrase'] + '?')
                else:
                    print(f.renderText('Sorry'))
                    textToSpeech.say('Sorry.')
            else:
                print(f.renderText(bestMatch['phrase']))
                textToSpeech.say(bestMatch['phrase'])






# Terminate the PortAudio interface
p.terminate()



print('Done.')


