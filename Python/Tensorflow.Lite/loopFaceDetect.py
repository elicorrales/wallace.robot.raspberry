import sys
import os
import numpy as np
import cv2

webcamConnected = False

cap = cv2.VideoCapture(0)
#cap.set(cv2.CAP_PROP_BUFFERSIZE,1)



xml_path = '/home/devchu/.virtualenvs/cv/lib/python3.7/site-packages/cv2/data/'
face_cascade = cv2.CascadeClassifier(xml_path + 'haarcascade_frontalface_default.xml')


# only attempt to read if it is opened
if cap.isOpened:
    while(True):
        ret, frame = cap.read()

        if True:
            #cv2.imshow('frame',frame)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            #cv2.imshow('gray',gray)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
            #for each face...
            for (x, y, w, h) in faces:
                # draw a rectangle around the face
                #gray = cv2.rectangle(gray, (x, y), (x+w, y+h), (255, 255, 255), 3)
                frame = cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 255, 255), 3)

            #cv2.imshow('gray', gray)
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
