"""Local-only privacy hints. This never grants consent or auto-approves media."""
import json
import os
import sys

def output(value):
    print(json.dumps(value, ensure_ascii=False))

try:
    import cv2
except Exception as error:
    output({"available": False, "flags": ["LOCAL_PRIVACY_ANALYZER_UNAVAILABLE"], "faceCount": 0, "reason": str(error)[:300]})
    raise SystemExit(0)

if len(sys.argv) != 2 or not os.path.isfile(sys.argv[1]):
    output({"available": False, "flags": ["LOCAL_PRIVACY_ANALYZER_INVALID_INPUT"], "faceCount": 0})
    raise SystemExit(0)

path = sys.argv[1]
face_cascade = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml"))
plate_path = os.path.join(cv2.data.haarcascades, "haarcascade_russian_plate_number.xml")
plate_cascade = cv2.CascadeClassifier(plate_path) if os.path.isfile(plate_path) else None
qr_detector = cv2.QRCodeDetector()
frames = []
image = cv2.imread(path)
if image is not None:
    frames = [image]
else:
    capture = cv2.VideoCapture(path)
    count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    for index in sorted(set([0, count // 4, count // 2, (count * 3) // 4, max(0, count - 1)]))[:5]:
        capture.set(cv2.CAP_PROP_POS_FRAMES, index)
        ok, frame = capture.read()
        if ok and frame is not None:
            frames.append(frame)
    capture.release()

flags = set()
face_count = 0
for frame in frames[:5]:
    height, width = frame.shape[:2]
    scale = min(1.0, 1280.0 / max(height, width))
    if scale < 1.0:
        frame = cv2.resize(frame, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(32, 32))
    face_count += len(faces)
    if len(faces): flags.add("FACE_DETECTED")
    if plate_cascade is not None and not plate_cascade.empty():
        if len(plate_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(50, 15))): flags.add("POSSIBLE_LICENSE_PLATE")
    try:
        value, points, _ = qr_detector.detectAndDecode(frame)
        if value or points is not None: flags.add("QR_CODE_DETECTED")
    except Exception:
        pass
output({"available": True, "flags": sorted(flags), "faceCount": face_count, "framesChecked": len(frames[:5])})
