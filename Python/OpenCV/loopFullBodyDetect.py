import sys
import os
import numpy as np
import cv2

webcamConnected = False

url = "http:/localhost:8082/?action=stream"

# initialize USB webcam video capture.
# unable to capture directly from /dev/video0, but by using mjpg-streamer in another terminal,
# capture here works from URL instead.
cap = cv2.VideoCapture(url)
# limiting this to '1' means that the sending-receving between mjpg-streamer and this script doesn't cause a frames buildup,
# (which causes a huge lag)
# try running the program with this line commented and you will see.
cap.set(cv2.CAP_PROP_BUFFERSIZE,1)



xml_path = '/home/devchu/.virtualenvs/cv/lib/python3.7/site-packages/cv2/data/'
body_cascade = cv2.CascadeClassifier(xml_path + 'haarcascade_fullbody.xml')
#body_cascade = cv2.CascadeClassifier(xml_path + 'haarcascade_frontalface_default.xml')


# only attempt to read if it is opened
if cap.isOpened:
    while(True):
        ret, frame = cap.read()

        if True:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            bodies = body_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
            #for each body...
            for (x, y, w, h) in bodies:
                # draw a rectangle around the face
                cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 255, 255), 3)

            cv2.imshow('frame', frame)
        else:
            print("Error reading capture device")
            break
        if cv2.waitKey(1) & 0xff == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
else:
    print("Failed to open capture device")

