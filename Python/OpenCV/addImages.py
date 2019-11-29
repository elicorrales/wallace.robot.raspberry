import cv2
import numpy as np
from matplotlib import pyplot as plt

car = cv2.imread('car.resized.to.bike.png')
bik = cv2.imread('bike.png')
if car is not None and bik is not None:
    result = cv2.add(car,bik)
    cv2.imshow('result',result)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
else:
    print('No images found.')

