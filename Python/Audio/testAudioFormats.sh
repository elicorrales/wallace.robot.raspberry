fileName=$1;

arecord -D plughw:1,0 --format=U8 --rate=8000 --duration=2 --file-type=wav $fileName;
