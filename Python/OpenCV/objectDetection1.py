
import cv2
import numpy as np

url = "http:/localhost:8082/?action=stream"
face_xml = '/home/devchu/.virtualenvs/cv/lib/python3.7/site-packages/cv2/data/haarcascade_frontalface_default.xml'

face_cascade = cv2.CascadeClassifier(face_xml)

cap = cv2.VideoCapture(url)

# only attempt to read if it is opened
if cap.isOpened:
    while(True):
        ret, img = cap.read()
        if ret:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            for (x,y,w,h) in faces:
                img = cv2.rectangle(img,(x,y),(x+w,y+h),(255,0,0),2)
                roi_gray = gray[y:y+h, x:x+w]
                roi_color = img[y:y+h, x:x+w]
            cv2.imshow('image',img)
            cv2.waitKey(1) & 0xFF == ord('q')
        else:
            print("Error reading capture device")
            break

    cap.release()
    cv2.destroyAllWindows()
else:
    print("Failed to open capture device")

