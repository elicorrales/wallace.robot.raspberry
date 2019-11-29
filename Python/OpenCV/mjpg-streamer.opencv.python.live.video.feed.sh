#!/bin/bash

if [ "$1" = "" ];
then
    echo;echo; echo "Missing device name";echo;echo; exit 1;
fi;

if [ "$2" = "" ];
then
    echo;echo; echo "Missing Port ";echo;echo; exit 1;
fi;

if [ "$3" = "" ];
then
    echo;echo; echo "Missing Resolution ";echo;echo; exit 1;
fi;







device="$1";
port="$2";
resolution="$3";
FPS="30";
qualityOfJPG=80;

if [ "$4" != "" ];
then
	FPS=$4;
fi;

echo;
echo "$device   $port   $resolution    $FPS";
echo;

export LD_LIBRARY_PATH=
#        -i "input_uvc.so -r $resolution -d $device -f $FPS -q $qualityOfJPG -timeout 10" \
        #-i "input_opencv.so -r $resolution -d $device -f $FPS -q $qualityOfJPG -timeout 10" \
mjpg_streamer   \
        -i "input_opencv.so -r $resolution -d $device -f $FPS -q $qualityOfJPG -timeout 10" \
        -o "output_http.so -p $port -w /home/devchu/public_html" 



