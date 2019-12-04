import sys
from scipy.io.wavfile import read, write

if len(sys.argv) < 3:
    print('usage: ', sys.argv[0], ' <file1> <file2>')
    sys.exit(1)

file1 = sys.argv[1]
file2 = sys.argv[2]

Fs1, data1 = read(file1)
Fs2, data2 = read(file2)

print(data1.size, ' ', data2.size)

list1 = data1.tolist()
list2 = data2.tolist()

trimmed1 = data1[(data1 < 127) | (data1 > 128)]
trimmed2 = data2[(data2 < 127) | (data2 > 128)]

print(trimmed1.size, ' ', trimmed2.size)


size = 0
if trimmed1.size >= trimmed2.size:
    size = trimmed2.size
else:
    size = trimmed1.size

numDiffs = 0
for idx in range(size):
    diff = abs(trimmed1[idx]-trimmed2[idx])
    if diff > 6 and diff < 249 and not (diff >= 126 and diff <= 128):
        print(idx, ' ', diff, ' ', trimmed1[idx], ' ', trimmed2[idx])
        numDiffs += 1

print(numDiffs)
