import numpy as np
import cv2
import time

webcamConnected = False

url = "http:/localhost:8082/?action=stream"

cap = cv2.VideoCapture(url)
cap.set(cv2.CAP_PROP_BUFFERSIZE,1)

MAX_FEATURES = 500
orb = cv2.ORB_create(MAX_FEATURES)


# only attempt to read if it is opened
if cap.isOpened:
    while(True):
        ret, frame = cap.read()

        if True:
            img = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            #cv2.imshow('frame',frame)
            keypoints, descriptors = orb.detectAndCompute(img, None)
            img2 = np.zeros(shape=[img.shape[0], img.shape[1],3],dtype=np.uint8)
            feat = cv2.drawKeypoints(frame, keypoints, img2, color=(0,255,0), flags=0)

            cv2.imshow('frame',feat)
            print("showing frame")
        else:
            print("Error reading capture device")
            break
        if cv2.waitKey(1) & 0xff == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
else:
    print("Failed to open capture device")

