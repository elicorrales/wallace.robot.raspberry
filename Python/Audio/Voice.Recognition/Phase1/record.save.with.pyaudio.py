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
parser.add_argument('-s', '--max-bg-start', type=int, required=True, dest='maxBackgroundStart')
parser.add_argument('-e', '--max-bg-end', type=int, required=True, dest='maxBackgroundEnd')
parser.add_argument('-n', '--no-trim', dest='trim', action='store_false')
parser.add_argument('-r', '--save-raw-file', dest='saveNoTrimFile', action='store_true')
parser.add_argument('-l', '--length', type=int, required=True, dest='seconds')
parser.set_defaults(trim=True, saveNoTrimFile=False)

args = parser.parse_args()


#print(args.phrase)
print(args.maxBackgroundStart)
print(args.maxBackgroundEnd)
print(args.trim)
print(args.seconds)



##################################################################
#init program global variables
##################################################################
phrase=''
maxBackgroundStart=args.maxBackgroundStart
maxBackgroundEnd=args.maxBackgroundEnd
trim=args.trim
seconds=args.seconds
saveNoTrimFile=args.saveNoTrimFile
frames = []
maxFramesBeforeTrim = 0

print('Initializing Talkey, please wait....')
textToSpeech = talkey.Talkey()

p = pyaudio.PyAudio()  # Create an interface to PortAudio

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
    for i in range(0, int(RATE / CHUNK * seconds)):
        data = stream.read(CHUNK)
        if not isFirstValidSound:
            if isValidSound(data, maxBackgroundStart):
                print('.......capturing.....')
                print('.......capturing.....')
                print('.......capturing.....')
                isFirstValidSound = True
        frames.append(data)

    global maxFramesBeforeTrim 
    maxFramesBeforeTrim = len(frames)

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

    return crossingsDiff, peakDiff

##################################################################
def findBestMatch(latestPhrase, phrasesArray):

    numPhrases = len(phrasesArray)

    leastDiff = sys.maxsize
    bestMatchIndex = -1
    for i in range(numPhrases):
        phrase = phrasesArray[i]
        crDiff, pkDiff = compareTwoPhraseMetaData(latestPhrase, phrase)
        difference = crDiff + pkDiff
        if leastDiff > difference:
            leastDiff = difference
            bestMatchIndex = i

    return phrasesArray[bestMatchIndex]

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
        #peak = np.average(np.abs(data))*2
        peak = np.amax(np.abs(data))
        #bars = '#' * int(255*peak/2**16)
        bars = int(255*peak/2**16)
        #print('%04d %03d %05d %s'%(i, crossings, peak, bars))
        jsonStr = {"crossings": crossings,
                "peak": bars}
        #print(jsonStr) 
        jsonArray.append(jsonStr)
    jsonObject = {
            "phrase": phrase, 
            "recLimitSecs": seconds, 
            "framesLimit": maxFramesBeforeTrim, 
            "numRecFrames": len(frames), "frameData": jsonArray }
    #return json.dumps(jsonObject)
    return jsonObject

##################################################################
def addFakeAudioMetaDataForFillerFrames(metaData):

    numRecFrames = metaData['numRecFrames']
    framesLimit  = metaData['framesLimit']
    numFillFrames = framesLimit - numRecFrames
    frameData = metaData['frameData']
    for i in range(numFillFrames):
        frameData.append({"crossings": 0, "peak": 0})
    metaData['numRecFrames'] = framesLimit

##################################################################
def countVolumeValue(data, value):
    count = 0
    for i in range(len(data)):
        if data[i] == value:
            count += 1
    return count

##################################################################
def isValidSound(data, maxBackground):

    try:

        mode = statistics.mode(data)
        volCount = countVolumeValue(data, mode)

        if mode > 250  and volCount>= maxBackground:
            #print('mode 255 and exceeds max background')
            return False
        if mode < 3    and volCount >= maxBackground:
            #print('mode 0 and exceeds max background')
            return False

        #print('mode ', mode, ' ', volCount)
        #print('mode ', mode)
        return True

    except:
        #print('exception')
        return False
 


##################################################################


quitProgram = False

while not quitProgram:

    userInput = input('Press <ENTER> to record, or \'q\' to quit program: ')

    if userInput == 'q':
        break


    recordAudio()



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

    if trim:
        """
        if saveNoTrimFile:
            print('Saving UN-trimmed wave file...')
            # Save the recorded data as a WAV file
            wf = wave.open('wave.files/'+'untrimmed.'+phrase.replace(' ','.',100)+'.'+lastNumberStr+'.wav', 'wb')
            wf.setnchannels(channels)
            wf.setsampwidth(p.get_sample_size(sample_format))
            wf.setframerate(RATE)
            wf.writeframes(b''.join(frames))
            wf.close()
        """

        print('Triming start...')

        while len(frames) > 0:
            index = 0;
            if not isValidSound(frames[0], maxBackgroundStart):
                frames.pop(index)
                #print('...popped...')
            else:
                break

        print('Triming end...')

        while len(frames) > 0:
            index = len(frames) - 1;
            #print('index: ', index)
            if not isValidSound(frames[index], maxBackgroundEnd):
                frames.pop(index)
                #print('...popped...')
            else:
                break




    print('Load Existing JSON meta data from file...')
    phrasesArray = []
    try:
        phrasesFile = open('phrases.json','r')
        phrasesString = phrasesFile.read()
        phrasesFile.close()
        phrasesArray = json.loads(phrasesString)
    except:
        print('no pre-existing meta data..')


    metaDataForLatestRecordedPhrase = getAudioMetaData(frames)
    addFakeAudioMetaDataForFillerFrames(metaDataForLatestRecordedPhrase)

    if len(phrasesArray) > 0:
        bestMatch = findBestMatch(metaDataForLatestRecordedPhrase, phrasesArray)
        print('bestMatch: ', bestMatch['phrase'])
        textToSpeech.say(bestMatch['phrase'])
        isThisCorrect = input('Correct ? <y|n> :')
        if isThisCorrect == 'y':
            needPhrase = bestMatch['phrase']
        else:
            needPhrase = input('Need to assign new phrase to this latest recording:')
    else:
        needPhrase = input('Need to assign new phrase to this latest recording:')

    metaDataForLatestRecordedPhrase['phrase'] = needPhrase

    phrasesArray.append(metaDataForLatestRecordedPhrase)

    #print(phrasesArray)

    print('Saving meta data as JSON file...')
    phrasesFile = open('phrases.json','w')
    phrasesFile.write(json.dumps(phrasesArray))
    phrasesFile.close()


    """
    print('Saving wave file...')
    # Save the recorded data as a WAV file
    wf = wave.open('wave.files/'+phrase.replace(' ','.',100)+'.'+lastNumberStr+'.wav', 'wb')
    wf.setnchannels(channels)
    wf.setsampwidth(p.get_sample_size(sample_format))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()
    """

    print('Done.')


# Terminate the PortAudio interface
p.terminate()
