import cv2
import numpy as np
from matplotlib import pyplot as plt

img = cv2.imread('face1.png')
if img is not None:
    cv2.imshow('image',img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
else:
    print('No image found.')

