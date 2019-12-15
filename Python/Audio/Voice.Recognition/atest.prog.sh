#!/bin/bash


read -p "Enter phrase you will say, words separated by '.' then <ENTER> :" fileName;


python record.save.with.pyaudio.py -f $fileName -s 90 -e 150 -l 3 2>/dev/null;


for file in $(ls audio.files):
do
    python diff.files.py ${fileName}.wav audio.files/$file;
done;
