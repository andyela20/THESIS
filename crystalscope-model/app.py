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


# WITH SAHI

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

# ─── SAHI imports ─────────────────────────────────────────────────────────────
from sahi.models.base import DetectionModel
from sahi.prediction import ObjectPrediction
from sahi.predict import get_sliced_prediction
# ──────────────────────────────────────────────────────────────────────────────

pillow_heif.register_heif_opener()

app = Flask(__name__)
CORS(app)

# ─── Paths & constants ────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(
    os.path.abspath(os.path.dirname(__file__)), 'model', 'best_particlesDETRL.pt'
)

CLASS_NAMES = {
    0:  'Ammonium Biurate',
    1:  'CaOx Dihydrate',
    2:  'CaOx Monohydrate Ovoid',
    3:  'Casts',
    4:  'Epithelial Cells',
    5:  'Lipids',
    6:  'Microorganisms',
    7:  'Misc',
    8:  'Red Blood Cells',
    9:  'Triple Phosphate',
    10: 'Uric Acid',
    11: 'White Blood Cells',
}

RISK_MAP = {
    'Ammonium Biurate':       'Moderate',
    'CaOx Dihydrate':         'High',
    'CaOx Monohydrate Ovoid': 'High',
    'Casts':                  'High',
    'Epithelial Cells':       'Low',
    'Lipids':                 'Moderate',
    'Microorganisms':         'High',
    'Misc':                   'Low',
    'Red Blood Cells':        'High',
    'Triple Phosphate':       'Moderate',
    'Uric Acid':              'High',
    'White Blood Cells':      'High',
}

UPLOAD_FOLDER = 'temp_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════════
#  Adaptive Confidence Threshold (Strategy 3: Combined)
#
#  Evaluates image quality based on:
#    - Blur score  (Laplacian variance — higher = sharper)
#    - Brightness  (mean pixel value)
#    - Contrast    (std dev of pixel values)
#
#  Threshold scale:
#    Blurry image          → 0.20 (lenient — catch more detections)
#    Dark / low contrast   → 0.25 (slightly lenient)
#    Normal / sharp        → 0.35 (standard)
#    Overexposed / washed  → 0.45 (strict — avoid false positives)
# ══════════════════════════════════════════════════════════════════════════════
def get_adaptive_threshold(pil_image: Image.Image) -> float:
    gray       = np.array(pil_image.convert("L"))
    brightness = float(gray.mean())
    contrast   = float(gray.std())
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()

    print(f"[ADAPTIVE] brightness={brightness:.1f} | contrast={contrast:.1f} | blur={blur_score:.1f}")

    # ── Strong conditions ─────────────────────────────
    if blur_score < 40:
        threshold = 0.52
        reason = "very blurry"

    elif brightness < 70 or contrast < 25:
        threshold = 0.52
        reason = "very dark / very low contrast"

    elif brightness > 210 and contrast < 35:
        threshold = 0.57
        reason = "overexposed"

    # ── Good condition ───────────────────────────────
    elif blur_score >= 120 and 90 <= brightness <= 180:
        threshold = 0.44
        reason = "clean, well-balanced image"

    # ── Mid-quality (NEW – important) ────────────────
    elif blur_score >= 80:
        threshold = 0.47
        reason = "moderate quality"

    # ── Fallback ─────────────────────────────────────
    else:
        threshold = 0.48
        reason = "default fallback"

    print(f"[ADAPTIVE] threshold={threshold} ({reason})")
    return threshold

def get_threshold_with_retry(pil_image: Image.Image) -> float:
    base_threshold = get_adaptive_threshold(pil_image)

    test_detections = detection_model.model.predict(
        pil_image, threshold=base_threshold
    )

    count = len(test_detections) if test_detections.class_id is not None else 0
    print(f"[RETRY CHECK] detections at {base_threshold}: {count}")

    # ── Case 1: No detections → aggressive drop
    if count == 0:
        lowered = max(base_threshold - 0.08, 0.40)
        print(f"[RETRY] no detections → {base_threshold} → {lowered}")
        return lowered

    # ── Case 2: Too few detections → slight drop
    elif count < 3:
        lowered = max(base_threshold - 0.04, 0.40)
        print(f"[RETRY] few detections → {base_threshold} → {lowered}")
        return lowered

    # ── Case 3: Too many detections → increase threshold 
    elif count > 20:
        raised = min(base_threshold + 0.05, 0.60)
        print(f"[RETRY] too many detections → {base_threshold} → {raised}")
        return raised

    return base_threshold
# ══════════════════════════════════════════════════════════════════════════════
#  Custom SAHI wrapper for RF-DETR XL
# ══════════════════════════════════════════════════════════════════════════════
class RFDETRDetectionModel(DetectionModel):

    def __init__(self, model_path, confidence_threshold=0.35, device="cpu:0", **kwargs):
        # Do NOT call super().__init__() — it calls load_model() too early
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.device = device
        self._object_prediction_list_per_image = [[]]
        self._original_predictions = None
        self.load_model()

    def load_model(self):
        """Load RF-DETR XL weights."""
        self.model = RFDETRLarge(
        pretrain_weights=self.model_path,
        num_classes=11,
    )
        self.set_model(self.model)

    def set_model(self, model):
        self.model = model

    def perform_inference(self, image: np.ndarray):
        """Run inference on a single tile (numpy BGR from SAHI)."""
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        detections: sv.Detections = self.model.predict(
            pil_image, threshold=self.confidence_threshold
        )
        self._original_predictions = detections

    def convert_original_predictions(
        self,
        shift_amount: list = None,
        full_shape: list = None,
    ):
        """Translate sv.Detections into SAHI ObjectPrediction objects."""
        if shift_amount is None:
            shift_amount = [0, 0]
        elif isinstance(shift_amount, (list, tuple)) and len(shift_amount) > 0:
            if isinstance(shift_amount[0], (list, tuple)):
                shift_amount = shift_amount[0]

        if isinstance(full_shape, (list, tuple)) and len(full_shape) > 0:
            if isinstance(full_shape[0], (list, tuple)):
                full_shape = full_shape[0]

        detections = self._original_predictions
        object_predictions = []

        if detections.class_id is not None and len(detections.class_id) > 0:
            for i in range(len(detections)):
                x1, y1, x2, y2 = detections.xyxy[i].tolist()
                confidence      = float(detections.confidence[i]) if detections.confidence is not None else 0.0
                class_id        = int(detections.class_id[i])
                class_name      = CLASS_NAMES.get(class_id, f'Unknown_{class_id}')

                if confidence < self.confidence_threshold:
                    continue

                object_predictions.append(
                    ObjectPrediction(
                        bbox=[x1, y1, x2, y2],
                        category_id=class_id,
                        category_name=class_name,
                        score=confidence,
                        shift_amount=shift_amount,
                        full_shape=full_shape,
                    )
                )

        self._object_prediction_list_per_image = [object_predictions]

    @property
    def object_prediction_list(self):
        return self._object_prediction_list_per_image[0]

    @property
    def num_categories(self):
        return len(CLASS_NAMES)

    @property
    def has_mask(self):
        return False

    @property
    def category_names(self):
        return list(CLASS_NAMES.values())


# ─── Instantiate once at startup ─────────────────────────────────────────────
detection_model = RFDETRDetectionModel(
    model_path=MODEL_PATH,
    confidence_threshold=0.2,  # default — overridden per-request by adaptive
    device="cpu:0",
)
# ──────────────────────────────────────────────────────────────────────────────


# ──────────────────────────────────────────────────────────────────────────────
#  Helper: adaptive SAHI sliced prediction
#
#  Strategy based on image size:
#    < 800px  — direct inference, no slicing (fast)
#    800-1280 — single pass, 640px tiles (balanced)
#    > 1280px — two passes: 768px + 384px tiles (big & small crystals)
# ──────────────────────────────────────────────────────────────────────────────
def run_sahi(pil_image: Image.Image, image_path: str):
    # ── Step 1: Compute adaptive threshold for this image ────────────────────
    adaptive_conf = get_adaptive_threshold(pil_image)
    detection_model.confidence_threshold = adaptive_conf  # update dynamically

    w, h = pil_image.size
    long_edge = max(w, h)

    def annotate(pil_img, dets):
        frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        labels = (
            [CLASS_NAMES.get(int(c), f'Unknown_{c}') for c in dets.class_id]
            if dets.class_id is not None and len(dets.class_id) > 0
            else []
        )
        box_annotator   = sv.BoxAnnotator()
        label_annotator = sv.LabelAnnotator()
        ann = box_annotator.annotate(scene=frame.copy(), detections=dets)
        ann = label_annotator.annotate(scene=ann, detections=dets, labels=labels)
        return ann

    # ── Case 1: Small image — direct inference, no slicing ───────────────────
    if long_edge < 800:
        detections = detection_model.model.predict(
            pil_image, threshold=detection_model.confidence_threshold
        )
        return detections, annotate(pil_image, detections), adaptive_conf

    # ── Case 2: Medium image — single pass with 640px tiles ──────────────────
    elif long_edge <= 1280:
        slice_passes = [
            dict(slice_height=640, slice_width=640,
                 overlap_height_ratio=0.15, overlap_width_ratio=0.15),
        ]

    # ── Case 3: Large image — two passes for mixed crystal sizes ─────────────
    else:
        slice_passes = [
            dict(slice_height=768, slice_width=768,
                 overlap_height_ratio=0.15, overlap_width_ratio=0.15),
            dict(slice_height=384, slice_width=384,
                 overlap_height_ratio=0.2, overlap_width_ratio=0.2),
        ]

    # ── Run all passes and pool predictions ──────────────────────────────────
    all_xyxy, all_conf, all_cls = [], [], []

    for params in slice_passes:
        result = get_sliced_prediction(
            image=image_path,
            detection_model=detection_model,
            postprocess_type="GREEDYNMM",
            postprocess_match_threshold=0.3,
            verbose=0,
            **params,
        )
        for obj in result.object_prediction_list:
            bbox = obj.bbox
            all_xyxy.append([bbox.minx, bbox.miny, bbox.maxx, bbox.maxy])
            all_conf.append(obj.score.value)
            all_cls.append(int(obj.category.id))

    # ── Merge via NMS to remove cross-pass duplicates ─────────────────────────
    if all_xyxy:
        raw = sv.Detections(
            xyxy=np.array(all_xyxy, dtype=np.float32),
            confidence=np.array(all_conf, dtype=np.float32),
            class_id=np.array(all_cls, dtype=int),
        )
        detections = raw.with_nms(threshold=0.4)
    else:
        detections = sv.Detections.empty()

    return detections, annotate(pil_image, detections), adaptive_conf


# ──────────────────────────────────────────────────────────────────────────────
#  Routes
# ──────────────────────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'CrystalScope model API is running!'})


@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400

    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        pil_image = Image.open(filepath).convert("RGB")

        # SAHI sliced inference with adaptive confidence
        detections, annotated_frame, used_threshold = run_sahi(pil_image, filepath)

        annotated_filename = f"annotated_{uuid.uuid4()}.jpg"
        annotated_path     = os.path.join(UPLOAD_FOLDER, annotated_filename)
        cv2.imwrite(annotated_path, annotated_frame)

        crystal_counts = {}
        detection_list = []

        if detections.class_id is not None and len(detections.class_id) > 0:
            for i in range(len(detections)):
                class_id   = int(detections.class_id[i])
                confidence = float(detections.confidence[i]) if detections.confidence is not None else 0.0
                class_name = CLASS_NAMES.get(class_id, f'Unknown_{class_id}')
                bbox       = detections.xyxy[i].tolist()

                crystal_counts[class_name] = crystal_counts.get(class_name, 0) + 1
                detection_list.append({
                    'crystalType': class_name,
                    'confidence':  round(confidence * 100, 2),
                    'bbox':        bbox,
                })

        summary = [
            {
                'crystalType': crystal_type,
                'count':       count,
                'risk':        RISK_MAP.get(crystal_type, 'Unknown'),
            }
            for crystal_type, count in crystal_counts.items()
        ]

        return jsonify({
            'success':          True,
            'summary':          summary,
            'detections':       detection_list,
            'total':            len(detection_list),
            'annotatedImage':   f'http://localhost:5001/image/{annotated_filename}',
            'thresholdUsed':    used_threshold,   # ← returned to frontend for transparency
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.route('/image/<filename>', methods=['GET'])
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)