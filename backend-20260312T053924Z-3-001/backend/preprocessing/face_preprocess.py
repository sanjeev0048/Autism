import cv2
import numpy as np

# Load OpenCV face detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

def preprocess_face(image_path):

    img = cv2.imread(image_path)

    if img is None:
        return None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        # Fallback: Use the whole image if face cascade fails
        face = img
    else:
        x, y, w, h = faces[0]
        face = img[y:y+h, x:x+w]

    face = cv2.resize(face, (224,224))

    face = face / 255.0

    face = np.expand_dims(face, axis=0)

    return face