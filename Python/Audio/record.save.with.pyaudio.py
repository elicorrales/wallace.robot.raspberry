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

CHUNK = 512
sample_format = pyaudio.paInt16  # 16 bits per sample
channels = 1
RATE = 16000

##################################################################
# set up command-line arguments
##################################################################
parser = argparse.ArgumentParser(prog=sys.argv[0], description='Record, trim, save audio', allow_abbrev=False)
parser.add_argument('-p', '--phrase', type=str, required=True, dest='phrase')
parser.add_argument('-s', '--max-bg-start', type=int, required=True, dest='maxBackgroundStart')
parser.add_argument('-e', '--max-bg-end', type=int, required=True, dest='maxBackgroundEnd')
parser.add_argument('-n', '--no-trim', dest='trim', action='store_false')
parser.add_argument('-r', '--save-raw-file', dest='saveNoTrimFile', action='store_true')
parser.add_argument('-l', '--length', type=int, required=True, dest='seconds')
parser.set_defaults(trim=True, saveNoTrimFile=False)

args = parser.parse_args()


print(args.phrase)
print(args.maxBackgroundStart)
print(args.maxBackgroundEnd)
print(args.trim)
print(args.seconds)



##################################################################
#init program global variables
##################################################################
phrase=args.phrase
maxBackgroundStart=args.maxBackgroundStart
maxBackgroundEnd=args.maxBackgroundEnd
trim=args.trim
seconds=args.seconds
saveNoTrimFile=args.saveNoTrimFile


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
    jsonObject = {"phrase": phrase, "numFrames": len(frames), "frames": jsonArray }
    return json.dumps(jsonObject)

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

        print('mode ', mode, ' ', volCount)
        #print('mode ', mode)
        return True

    except:
        #print('exception')
        return False
 


##################################################################

p = pyaudio.PyAudio()  # Create an interface to PortAudio

stream = p.open(format=sample_format,
                channels=channels,
                rate=RATE,
                frames_per_buffer=CHUNK,
                input=True)

frames = []  # Initialize array to store frames

print('recording...')

for i in range(0, int(RATE / CHUNK * seconds)):
    data = stream.read(CHUNK)
    frames.append(data)

# Stop and close the stream 
stream.stop_stream()
stream.close()
# Terminate the PortAudio interface
p.terminate()


if trim:

    """
    if saveNoTrimFile:
        print('Saving NOT trimmed...')
        # Save the recorded data as a WAV file
        wf = wave.open('no.trim.'+fileName+'.wav', 'wb')
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



print('Saving...')
phrasesFile = open('phrases.json','a+')
phrasesFile.write(getAudioMetaData(frames))
phrasesFile.close()

"""
# Save the recorded data as a WAV file
wf = wave.open(fileName+'.wav', 'wb')
wf.setnchannels(channels)
wf.setsampwidth(p.get_sample_size(sample_format))
wf.setframerate(RATE)
wf.writeframes(b''.join(frames))
wf.close()
"""
print('Done.')
