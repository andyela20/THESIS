# from flask import Flask, request, jsonify, send_from_directory
# from flask_cors import CORS
# from rfdetr import RFDETRLarge  # ← Fixed: Large ang model mo, hindi Medium
# import supervision as sv
# import os
# import uuid
# import cv2
# import numpy as np
# import pillow_heif
# from PIL import Image

# # Register HEIC opener — allows PIL to open .heic/.heif files
# pillow_heif.register_heif_opener()

# app = Flask(__name__)
# CORS(app)

# # Load RF-DETR model
# MODEL_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'model', 'best_DF-DETRl.pt')
# model = RFDETRLarge(pretrain_weights=MODEL_PATH, num_classes=5, resolution=704)
# # ↑ Fix 1: RFDETRLarge (matches 'l' sa filename)
# # ↑ Fix 2: resolution=560 — subukan muna, kung may error pa try 640 o 704

# CLASS_NAMES = {
#     1: 'Ammonium Biurate',
#     2: 'CaOx Dihydrate',
#     3: 'CaOx Monohydrate Ovoid',
#     4: 'Triple Phosphate',
#     5: 'Uric Acid'
# }

# RISK_MAP = {
#     'Ammonium Biurate':       'Moderate',
#     'CaOx Dihydrate':         'High',
#     'CaOx Monohydrate Ovoid': 'High',
#     'Triple Phosphate':       'Moderate',
#     'Uric Acid':              'High',
# }

# UPLOAD_FOLDER = 'temp_uploads'
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# @app.route('/health', methods=['GET'])
# def health():
#     return jsonify({ 'status': 'ok', 'message': 'CrystalScope model API is running!' })

# @app.route('/analyze', methods=['POST'])
# def analyze():
#     if 'image' not in request.files:
#         return jsonify({ 'error': 'No image provided' }), 400

#     file = request.files['image']
#     if file.filename == '':
#         return jsonify({ 'error': 'No image selected' }), 400

#     filename = f"{uuid.uuid4()}_{file.filename}"
#     filepath = os.path.join(UPLOAD_FOLDER, filename)
#     file.save(filepath)

#     try:
#         # Open image via PIL — supports JPG, PNG, TIFF, BMP, and HEIC
#         pil_image = Image.open(filepath).convert("RGB")

#         # Run RF-DETR detection
#         detections: sv.Detections = model.predict(pil_image, threshold=0.35)

#         # Convert PIL image to OpenCV format for annotation
#         frame = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

#         # Annotate
#         box_annotator   = sv.BoxAnnotator()
#         label_annotator = sv.LabelAnnotator()

#         labels = [
#             CLASS_NAMES.get(int(cls), f'Unknown_{cls}')
#             for cls in detections.class_id
#         ] if detections.class_id is not None else []

#         annotated_frame = box_annotator.annotate(scene=frame.copy(), detections=detections)
#         annotated_frame = label_annotator.annotate(scene=annotated_frame, detections=detections, labels=labels)

#         # Save annotated image as .jpg regardless of original format
#         annotated_filename = f"annotated_{uuid.uuid4()}.jpg"
#         annotated_path     = os.path.join(UPLOAD_FOLDER, annotated_filename)
#         cv2.imwrite(annotated_path, annotated_frame)

#         # Process results
#         crystal_counts = {}
#         detection_list = []

#         if detections.class_id is not None:
#             for i in range(len(detections)):
#                 class_id   = int(detections.class_id[i])
#                 confidence = float(detections.confidence[i]) if detections.confidence is not None else 0.0
#                 class_name = CLASS_NAMES.get(class_id, f'Unknown_{class_id}')
#                 bbox       = detections.xyxy[i].tolist()

#                 crystal_counts[class_name] = crystal_counts.get(class_name, 0) + 1

#                 detection_list.append({
#                     'crystalType': class_name,
#                     'confidence':  round(confidence * 100, 2),
#                     'bbox':        bbox
#                 })

#         summary = [
#             {
#                 'crystalType': crystal_type,
#                 'count':       count,
#                 'risk':        RISK_MAP.get(crystal_type, 'Unknown'),
#             }
#             for crystal_type, count in crystal_counts.items()
#         ]

#         return jsonify({
#             'success':        True,
#             'summary':        summary,
#             'detections':     detection_list,
#             'total':          len(detection_list),
#             'annotatedImage': f'http://localhost:5001/image/{annotated_filename}'
#         })

#     except Exception as e:
#         return jsonify({ 'success': False, 'error': str(e) }), 500

#     finally:
#         if os.path.exists(filepath):
#             os.remove(filepath)

# # Serve annotated image
# @app.route('/image/<filename>', methods=['GET'])
# def serve_image(filename):
#     return send_from_directory(UPLOAD_FOLDER, filename)

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5001, debug=True)

# from flask import Flask, request, jsonify, send_from_directory
# from flask_cors import CORS
# from rfdetr_plus import RFDETRXLarge  # ← Fixed: Large ang model mo, hindi Medium
# import supervision as sv
# import os
# import uuid
# import cv2
# import numpy as np
# import pillow_heif
# from PIL import Image

# # Register HEIC opener — allows PIL to open .heic/.heif files
# pillow_heif.register_heif_opener()

# app = Flask(__name__)
# CORS(app)

# # Load RF-DETR model
# MODEL_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'model', 'best_DF-DETRxl.pt')
# model = RFDETRXLarge(
#     pretrain_weights=MODEL_PATH,
#     num_classes=5,
#     resolution=880,
#     patch_size=20,
#     positional_encoding_size=44,
# )
# # ↑ Fix 1: RFDETRLarge (matches 'l' sa filename)
# # ↑ Fix 2: resolution=560 — subukan muna, kung may error pa try 640 o 704

# CLASS_NAMES = {
#     1: 'Ammonium Biurate',
#     2: 'CaOx Dihydrate',
#     3: 'CaOx Monohydrate Ovoid',
#     4: 'Triple Phosphate',
#     5: 'Uric Acid'
# }

# RISK_MAP = {
#     'Ammonium Biurate':       'Moderate',
#     'CaOx Dihydrate':         'High',
#     'CaOx Monohydrate Ovoid': 'High',
#     'Triple Phosphate':       'Moderate',
#     'Uric Acid':              'High',
# }

# UPLOAD_FOLDER = 'temp_uploads'
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# @app.route('/health', methods=['GET'])
# def health():
#     return jsonify({ 'status': 'ok', 'message': 'CrystalScope model API is running!' })

# @app.route('/analyze', methods=['POST'])
# def analyze():
#     if 'image' not in request.files:
#         return jsonify({ 'error': 'No image provided' }), 400

#     file = request.files['image']
#     if file.filename == '':
#         return jsonify({ 'error': 'No image selected' }), 400

#     filename = f"{uuid.uuid4()}_{file.filename}"
#     filepath = os.path.join(UPLOAD_FOLDER, filename)
#     file.save(filepath)

#     try:
#         # Open image via PIL — supports JPG, PNG, TIFF, BMP, and HEIC
#         pil_image = Image.open(filepath).convert("RGB")

#         # Run RF-DETR detection
#         detections: sv.Detections = model.predict(pil_image, threshold=0.35)

#         # Convert PIL image to OpenCV format for annotation
#         frame = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

#         # Annotate
#         box_annotator   = sv.BoxAnnotator()
#         label_annotator = sv.LabelAnnotator()

#         labels = [
#             CLASS_NAMES.get(int(cls), f'Unknown_{cls}')
#             for cls in detections.class_id
#         ] if detections.class_id is not None else []

#         annotated_frame = box_annotator.annotate(scene=frame.copy(), detections=detections)
#         annotated_frame = label_annotator.annotate(scene=annotated_frame, detections=detections, labels=labels)

#         # Save annotated image as .jpg regardless of original format
#         annotated_filename = f"annotated_{uuid.uuid4()}.jpg"
#         annotated_path     = os.path.join(UPLOAD_FOLDER, annotated_filename)
#         cv2.imwrite(annotated_path, annotated_frame)

#         # Process results
#         crystal_counts = {}
#         detection_list = []

#         if detections.class_id is not None:
#             for i in range(len(detections)):
#                 class_id   = int(detections.class_id[i])
#                 confidence = float(detections.confidence[i]) if detections.confidence is not None else 0.0
#                 class_name = CLASS_NAMES.get(class_id, f'Unknown_{class_id}')
#                 bbox       = detections.xyxy[i].tolist()

#                 crystal_counts[class_name] = crystal_counts.get(class_name, 0) + 1

#                 detection_list.append({
#                     'crystalType': class_name,
#                     'confidence':  round(confidence * 100, 2),
#                     'bbox':        bbox
#                 })

#         summary = [
#             {
#                 'crystalType': crystal_type,
#                 'count':       count,
#                 'risk':        RISK_MAP.get(crystal_type, 'Unknown'),
#             }
#             for crystal_type, count in crystal_counts.items()
#         ]

#         return jsonify({
#             'success':        True,
#             'summary':        summary,
#             'detections':     detection_list,
#             'total':          len(detection_list),
#             'annotatedImage': f'http://localhost:5001/image/{annotated_filename}'
#         })

#     except Exception as e:
#         return jsonify({ 'success': False, 'error': str(e) }), 500

#     finally:
#         if os.path.exists(filepath):
#             os.remove(filepath)

# # Serve annotated image
# @app.route('/image/<filename>', methods=['GET'])
# def serve_image(filename):
#     return send_from_directory(UPLOAD_FOLDER, filename)

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5001, debug=True)


# from flask import Flask, request, jsonify, send_from_directory
# from flask_cors import CORS
# from ultralytics import YOLO
# import os
# import uuid
# import cv2
# import pillow_heif
# from PIL import Image

# pillow_heif.register_heif_opener()

# app = Flask(__name__)
# CORS(app)

# # Load model
# MODEL_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'model', 'best_v11x.pt')
# model = YOLO(MODEL_PATH)

# CLASS_NAMES = {
#     0: 'Ammonium Biurate',
#     1: 'CaOx Dihydrate',
#     2: 'CaOx Monohydrate Ovoid',
#     3: 'Triple Phosphate',
#     4: 'Uric Acid'
# }

# RISK_MAP = {
#     'Ammonium Biurate':       'Moderate',
#     'CaOx Dihydrate':         'High',
#     'CaOx Monohydrate Ovoid': 'High',
#     'Triple Phosphate':       'Moderate',
#     'Uric Acid':              'High',
# }

# UPLOAD_FOLDER = 'temp_uploads'
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# @app.route('/health', methods=['GET'])
# def health():
#     return jsonify({ 'status': 'ok', 'message': 'CrystalScope model API is running!' })

# @app.route('/analyze', methods=['POST'])
# def analyze():
#     if 'image' not in request.files:
#         return jsonify({ 'error': 'No image provided' }), 400

#     file = request.files['image']
#     if file.filename == '':
#         return jsonify({ 'error': 'No image selected' }), 400

#     filename = f"{uuid.uuid4()}_{file.filename}"
#     filepath = os.path.join(UPLOAD_FOLDER, filename)
#     file.save(filepath)

#     try:
#         # Run YOLOv8 detection
#         results = model(filepath, conf=0.35)

#         # Save annotated image
#         annotated_filename = f"annotated_{filename}"
#         annotated_path = os.path.join(UPLOAD_FOLDER, annotated_filename)
#         annotated_frame = results[0].plot()
#         cv2.imwrite(annotated_path, annotated_frame)

#         # Process results
#         crystal_counts = {}
#         detections = []

#         for result in results:
#             for box in result.boxes:
#                 class_id   = int(box.cls[0])
#                 confidence = float(box.conf[0])
#                 class_name = CLASS_NAMES.get(class_id, f'Unknown_{class_id}')

#                 if class_name not in crystal_counts:
#                     crystal_counts[class_name] = 0
#                 crystal_counts[class_name] += 1

#                 detections.append({
#                     'crystalType': class_name,
#                     'confidence':  round(confidence * 100, 2),
#                     'bbox':        box.xyxy[0].tolist()
#                 })

#         summary = []
#         for crystal_type, count in crystal_counts.items():
#             summary.append({
#                 'crystalType': crystal_type,
#                 'count':       count,
#                 'risk':        RISK_MAP.get(crystal_type, 'Unknown'),
#             })

#         return jsonify({
#             'success':        True,
#             'summary':        summary,
#             'detections':     detections,
#             'total':          len(detections),
#             'annotatedImage': f'http://localhost:5001/image/{annotated_filename}'
#         })

#     except Exception as e:
#         return jsonify({ 'error': str(e) }), 500

#     finally:
#         # Delete original temp image only — keep annotated
#         if os.path.exists(filepath):
#             os.remove(filepath)

# # Serve annotated image
# @app.route('/image/<filename>', methods=['GET'])
# def serve_image(filename):
#     return send_from_directory(UPLOAD_FOLDER, filename)

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5001, debug=True)


# WITH SAHI + CLASS-SPECIFIC THRESHOLDS (FINAL)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from rfdetr import RFDETRLarge
import supervision as sv
import os
import uuid
import cv2
import numpy as np
import pillow_heif
from PIL import Image

from sahi.models.base import DetectionModel
from sahi.prediction import ObjectPrediction
from sahi.predict import get_sliced_prediction

pillow_heif.register_heif_opener()

app = Flask(__name__)
CORS(app)

# ─── CONFIG ─────────────────────────────────────────
MODEL_PATH = os.path.join(
    os.path.abspath(os.path.dirname(__file__)),
    'model', 'best_DF-DETRl.pt'
)

UPLOAD_FOLDER = 'temp_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MIN_BOX_SIZE = 10

CLASS_NAMES = {
    1: 'Ammonium Biurate',
    2: 'CaOx Dihydrate',
    3: 'CaOx Monohydrate Ovoid',
    4: 'Triple Phosphate',
    5: 'Uric Acid',
}

RISK_MAP = {
    'Ammonium Biurate': 'Moderate',
    'CaOx Dihydrate': 'High',
    'CaOx Monohydrate Ovoid': 'High',
    'Triple Phosphate': 'Moderate',
    'Uric Acid': 'High',
}

# ✅ YOUR EVALUATED CLASS THRESHOLDS
CLASS_THRESHOLDS = {
    1: 0.45,
    2: 0.25,
    3: 0.45,
    4: 0.45,
    5: 0.45,
}

# ────────────────────────────────────────────────────
# ADAPTIVE THRESHOLD
# ────────────────────────────────────────────────────
def get_adaptive_threshold(pil_image):
    gray = np.array(pil_image.convert("L"))
    brightness = float(gray.mean())
    contrast = float(gray.std())
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()

    print(f"[ADAPTIVE] b={brightness:.1f} c={contrast:.1f} blur={blur_score:.1f}")

    if blur_score < 40:
        return 0.52
    elif brightness < 70 or contrast < 25:
        return 0.52
    elif brightness > 210 and contrast < 35:
        return 0.57
    elif blur_score >= 120 and 90 <= brightness <= 180:
        return 0.44
    elif blur_score >= 80:
        return 0.47
    else:
        return 0.48


def get_threshold_with_retry(pil_image):
    base = get_adaptive_threshold(pil_image)

    test = detection_model.model.predict(pil_image, threshold=base)
    count = len(test) if test.class_id is not None else 0

    print(f"[RETRY] base={base} count={count}")

    if count == 0:
        return max(base - 0.08, 0.40)
    elif count < 3:
        return max(base - 0.04, 0.40)
    elif count > 20:
        return min(base + 0.05, 0.60)

    return base


# ────────────────────────────────────────────────────
# SAHI WRAPPER
# ────────────────────────────────────────────────────
class RFDETRDetectionModel(DetectionModel):

    def __init__(self, model_path, confidence_threshold=0.35):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self._object_prediction_list_per_image = [[]]
        self._original_predictions = None
        self.load_model()

    def load_model(self):
        self.model = RFDETRLarge(
            pretrain_weights=self.model_path,
            num_classes=5,
        )

    def perform_inference(self, image: np.ndarray):
        pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        self._original_predictions = self.model.predict(
            pil, threshold=self.confidence_threshold
        )

    def convert_original_predictions(self, shift_amount=None, full_shape=None):
        detections = self._original_predictions
        objs = []

        if detections.class_id is not None:
            for i in range(len(detections)):
                conf = float(detections.confidence[i])

                if conf < self.confidence_threshold:
                    continue

                x1, y1, x2, y2 = detections.xyxy[i].tolist()
                cls_id = int(detections.class_id[i])

                objs.append(
                    ObjectPrediction(
                        bbox=[x1, y1, x2, y2],
                        category_id=cls_id,
                        category_name=CLASS_NAMES.get(cls_id, "Unknown"),
                        score=conf,
                    )
                )

        self._object_prediction_list_per_image = [objs]

    @property
    def object_prediction_list(self):
        return self._object_prediction_list_per_image[0]


# ────────────────────────────────────────────────────
# INIT MODEL
# ────────────────────────────────────────────────────
detection_model = RFDETRDetectionModel(MODEL_PATH)


# ────────────────────────────────────────────────────
# SAHI PIPELINE
# ────────────────────────────────────────────────────
def run_sahi(pil_image, image_path):

    threshold = get_threshold_with_retry(pil_image)
    detection_model.confidence_threshold = threshold

    print(f"[FINAL THRESHOLD] {threshold}")

    result = get_sliced_prediction(
        image=image_path,
        detection_model=detection_model,
        slice_height=640,
        slice_width=640,
        overlap_height_ratio=0.15,
        overlap_width_ratio=0.15,
        postprocess_type="GREEDYNMM",
        postprocess_match_threshold=0.3,
        verbose=0,
    )

    boxes, confs, classes = [], [], []

    for obj in result.object_prediction_list:
        bbox = obj.bbox
        x1, y1, x2, y2 = bbox.minx, bbox.miny, bbox.maxx, bbox.maxy

        w, h = x2 - x1, y2 - y1
        if w < MIN_BOX_SIZE or h < MIN_BOX_SIZE:
            continue

        class_id = int(obj.category.id)
        class_threshold = CLASS_THRESHOLDS.get(class_id, 0.40)

        if obj.score.value < class_threshold:
            continue

        boxes.append([x1, y1, x2, y2])
        confs.append(obj.score.value)
        classes.append(class_id)

    if boxes:
        det = sv.Detections(
            xyxy=np.array(boxes),
            confidence=np.array(confs),
            class_id=np.array(classes),
        )
        det = det.with_nms(threshold=0.30)
    else:
        det = sv.Detections.empty()

    frame = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    ann = sv.BoxAnnotator().annotate(frame.copy(), det)
    ann = sv.LabelAnnotator().annotate(
        ann,
        det,
        labels=[CLASS_NAMES.get(int(c)) for c in det.class_id] if det.class_id is not None else []
    )

    return det, ann, threshold


# ────────────────────────────────────────────────────
# ROUTES
# ────────────────────────────────────────────────────
@app.route('/analyze', methods=['POST'])
def analyze():
    file = request.files['image']
    filename = f"{uuid.uuid4()}_{file.filename}"
    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    try:
        pil = Image.open(path).convert("RGB")

        det, ann, threshold = run_sahi(pil, path)

        out_name = f"annotated_{uuid.uuid4()}.jpg"
        out_path = os.path.join(UPLOAD_FOLDER, out_name)
        cv2.imwrite(out_path, ann)

        results = []
        counts = {}

        if det.class_id is not None:
            for i in range(len(det)):
                cls = CLASS_NAMES[int(det.class_id[i])]
                conf = float(det.confidence[i])

                counts[cls] = counts.get(cls, 0) + 1

                results.append({
                    "crystalType": cls,
                    "confidence": round(conf * 100, 2),
                    "bbox": det.xyxy[i].tolist()
                })

        summary = [
            {
                "crystalType": k,
                "count": v,
                "risk": RISK_MAP.get(k)
            }
            for k, v in counts.items()
        ]

        return jsonify({
            "success": True,
            "summary": summary,
            "detections": results,
            "total": len(results),
            "thresholdUsed": threshold,
            "annotatedImage": f"http://localhost:5001/image/{out_name}"
        })

    finally:
        os.remove(path)


@app.route('/image/<filename>')
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)