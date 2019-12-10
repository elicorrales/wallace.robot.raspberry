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
import pyfiglet

CHUNK = 512
sample_format = pyaudio.paInt16  # 16 bits per sample
channels = 1
#RATE = 16000
RATE = 32000

##################################################################
# set up command-line arguments
##################################################################
parser = argparse.ArgumentParser(prog=sys.argv[0], description='train with phrases', allow_abbrev=False)
#parser.add_argument('-p', '--phrase', type=str, required=True, dest='phrase')
parser.add_argument('-s', '--max-bg-start', type=int, dest='maxBackgroundStart')
parser.add_argument('-e', '--max-bg-end', type=int, dest='maxBackgroundEnd')
parser.add_argument('-w', '--save-wave-file', dest='saveWaveFile', action='store_true')
parser.add_argument('-l', '--length', type=int, dest='seconds')
parser.add_argument('-j', '--json-file', type=str, dest='jsonFile')
parser.set_defaults(maxBackgroundStart=80, maxBackgroundEnd=1, seconds=5)

args = parser.parse_args()



##################################################################
#init program global variables
##################################################################
phrase=''
maxBackgroundStart=args.maxBackgroundStart
maxBackgroundEnd=args.maxBackgroundEnd
seconds=args.seconds
saveWaveFile=args.saveWaveFile
yesNoQuitJsonFile='yes.no.quit.json'
phrasesJsonFile='phrases.json'
#frames = []
numActualRecordedFrames = 0
maxFramesBeforeTrim = int(RATE / CHUNK * seconds)

textToSpeech = talkey.Talkey()

p = pyaudio.PyAudio()  # Create an interface to PortAudio

yesNoQuitArray = []
phrasesArray = []

quitProgram = False
newPhraseAddedThisTime = False


##################################################################
def listPhrasesTrained():

    listedPhrases = []
    for phrase in phrasesArray:
        #print(listedPhrases)
        if not phrase['phrase'] in listedPhrases:
            listedPhrases.append(phrase['phrase'])
            print(phrase['phrase'])


##################################################################
def getIsThisCorrectUserInput():

    previousPhrase = ''
    numYesNoQuitMatches = 0

    yesNoQuitFrames = recordAudio()

    numMatches = 0
    isThisCorrect = False
    if len(yesNoQuitFrames) > 0:
        
        metaDataForLatestRecordedPhrase = getAudioMetaData(yesNoQuitFrames)
        addFakeAudioMetaDataForFillerFrames(metaDataForLatestRecordedPhrase)

        global yesNoQuitArray
        if len(yesNoQuitArray) > 0:
            numMatches, bestMatch = findBestMatch(metaDataForLatestRecordedPhrase, yesNoQuitArray)
            #print('bestMatch: ', bestMatch['phrase'], '  numMatches: ', numMatches)

    if numMatches > 2:
        print('Found good match...')
        isThisCorrect = True
    else:
        userResponse = input('Correct ? <y|n> :')
        if userResponse == 'y':
            isThisCorrect = True


    return isThisCorrect

##################################################################
def saveWaveFile(phrase, frames):
    lastNumber = 0
    try:
        lastNumberFile= open('wave.files/last.number.txt','r')
        lastNumber = int(lastNumberFile.read())
        lastNumberFile.close()
    except:
        print('no wave.files/last.number.txt file')

    print('last number: ', lastNumber)
    lastNumber += 1
    lastNumberFile= open('wave.files/last.number.txt','w')
    lastNumberFile.write('%d'%lastNumber)
    lastNumberFile.close()
    lastNumberStr = str(lastNumber)

    print('Saving wave file...')
    wf = wave.open('wave.files/'+phrase.replace(' ','.',100)+'.'+lastNumberStr+'.wav', 'wb')
    wf.setnchannels(channels)
    wf.setsampwidth(p.get_sample_size(sample_format))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()

##################################################################
def signalHandler(signalReceived, frame):
    print('Got CTRL-C...')


    # Terminate the PortAudio interface
    global p
    p.terminate()

    global newPhraseAddedThisTime
    global phrasesArray

    if newPhraseAddedThisTime and len(phrasesArray) > 0:
        print('Saving meta data as JSON file...')
        phrasesFile = open(phrasesJsonFile,'w')
        phrasesFile.write(json.dumps(phrasesArray))
        phrasesFile.close()

    print('Done.')

    sys.exit(0)


##################################################################
def recordAudio():

    stream = p.open(format=sample_format,
                channels=channels,
                rate=RATE,
                frames_per_buffer=CHUNK,
                input=True)

    frames = []  # Initialize array to store frames

    print('recording...')

    isFirstValidSound = False
    lastSoundWasInvalid = False
    numConsecutiveInvalidSounds = 0
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


    # Stop and close the stream 
    stream.stop_stream()
    stream.close()

    return frames

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
    print('numPhrases to compare against: ', numPhrases)
    for i in range(numPhrases):
        phrase = phrasesArray[i]
        print('comparing ' + latestPhrase['phrase'] +', ' + latestPhrase['numRecFrames'] + 
                ' against ' + phrase['phrase'] + ', ' + phrase['numRecFrames'])
        crDiff, pkDiff, numFramesDiff = compareTwoPhraseMetaData(latestPhrase, phrase)
        difference = crDiff + pkDiff + numFramesDiff
        if leastDiff > difference:
            leastDiff = difference
            bestMatchIndex = i
            print(phrase['phrase'], ' ', difference)

            if phrase['phrase'] == previousPhrase:
                numMatches += 1
                print('currPhrase EQUALS previousPhrase', numMatches)
            else:
                numMatches = 0
                previousPhrase = phrase['phrase']
                print('currPhrase NOT previousPhrase', numMatches)


    return numMatches, phrasesArray[bestMatchIndex]

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
    yesNoQuitFile = open(yesNoQuitJsonFile,'r')
    yesNoQuitString = yesNoQuitFile.read()
    yesNoQuitFile.close()
    yesNoQuitArray = json.loads(yesNoQuitString)
    print('Existing JSON meta data loaded from file.')
except:
    print('')
    print('no pre-existing yes / no / quit meta data. Need this to continue.')
    print('first generate yes/no/quit meta data.')
    print('')
    sys.exit(1)


print('Load Existing JSON meta data from file...')
try:
    phrasesFile = open(phrasesJsonFile,'r')
    phrasesString = phrasesFile.read()
    phrasesFile.close()
    phrasesArray = json.loads(phrasesString)
    print('Existing JSON meta data loaded from file.')
except:
    print('')
    print('no pre-existing meta data..')
    print('')


while not quitProgram:

    listPhrasesTrained()

    userInput = input('Press <ENTER> to record, or \'q\' to quit program: ')

    if userInput == 'q':
        break


    phraseFrames = recordAudio()



    if len(phraseFrames) > 0:
        

        metaDataForLatestRecordedPhrase = getAudioMetaData(phraseFrames)
        addFakeAudioMetaDataForFillerFrames(metaDataForLatestRecordedPhrase)

        if len(phrasesArray) > 0:
            numMatches, bestPhraseMatch = findBestMatch(metaDataForLatestRecordedPhrase, phrasesArray)
            print('best Phrase Match: ', bestPhraseMatch['phrase'], '  numMatches: ', numMatches)
            if numMatches > 3:
                textToSpeech.say('You said, ' + bestPhraseMatch['phrase'])
                needPhrase = bestPhraseMatch['phrase']
            else:
                textToSpeech.say(bestPhraseMatch['phrase'] + '?')
                isThisCorrect = getIsThisCorrectUserInput()
                if isThisCorrect == True:
                    needPhrase = bestPhraseMatch['phrase']
                else:
                    needPhrase = input('Need to assign new phrase to this latest recording:')
        else:
            needPhrase = input('Need to assign new phrase to this latest recording:')

        if len(needPhrase) > 0:
            if saveWaveFile:
                saveWaveFile(needPhrase, phraseFrames)
            metaDataForLatestRecordedPhrase['phrase'] = needPhrase
            print('')
            print('Saving : ', metaDataForLatestRecordedPhrase['phrase'])
            print('')
            phrasesArray.append(metaDataForLatestRecordedPhrase)
            newPhraseAddedThisTime = True
        else:
            print('Throwing new recording away....')
    else:
        print('Nothing Recorded ....')
        print('Nothing Recorded ....')
        print('Nothing Recorded ....')



# Terminate the PortAudio interface
p.terminate()

if newPhraseAddedThisTime:
    print('Saving meta data as JSON file...')
    phrasesFile = open(phrasesJsonFile,'w')
    phrasesFile.write(json.dumps(phrasesArray, indent=4, sort_keys=True))
    phrasesFile.close()
    print('Done.')


