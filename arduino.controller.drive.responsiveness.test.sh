#!/bin/bash

baseurl="http://localhost:8084";
arduino="${baseurl}/arduino";
api="${arduino}/api";

echo;echo "STOP RC auto send status indication";
echo "on server side console (node server.js)";
read -p "press <ENTER> to move on.";
curl "${api}/status/stop";

for cycles in 1 2 3 4;
do
    for speed in 10 20 30 40 50 60 70 80 90 100 90 80 70 60 50 40 30 20 10;
    do
        echo;echo "Move forward at $speed..";
        curl "${api}/forward/${speed}/${speed}";
    done;


    for speed in 10 20 30 40 50 60 70 80 90 100 90 80 70 60 50 40 30 20 10;
    do
        echo;echo "Move backward at $speed..";
        curl "${api}/backward/${speed}/${speed}";
    done;
done;


echo;echo "Stop motors";
curl "${api}/stop";

