import numpy as np
import wavio

rate = 8000           # sampling rate (Hz)
duration = 2
freq = 880 
#audioFormat=3         # aka sample width; signed 24 bit Little Endian in 3bytes
#audioFormat=2         # aka sample width; signed 16 bit Little Endian 
audioFormat=1         # aka sample width; unsigned 8 bit

t = np.linspace(0, duration, duration*rate, endpoint=False)
x = np.sin(2*np.pi*freq*t)
wavio.write("sine.wav",x,rate,sampwidth=audioFormat)
