import sys
import sounddevice as sndev
from scipy.io.wavfile import write

SECONDS=3
RATE=16000
CHANNELS=1

if len(sys.argv) < 2:
    print('usage: ', sys.argv[0], ' <file name>')
    sys.exit(1)

fileName=sys.argv[1]

print('recording...')

recording = sndev.rec(
    int(SECONDS * RATE), 
    samplerate=RATE,
    channels=CHANNELS)

sndev.wait()

write(fileName, RATE, recording)
