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
import base64
from datetime import datetime

from sahi.models.base import DetectionModel
from sahi.prediction import ObjectPrediction
from sahi.predict import get_sliced_prediction

pillow_heif.register_heif_opener()

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(
    os.path.abspath(os.path.dirname(__file__)), 'model', 'best_RFDETRL_von.pt'
)

CLASS_NAMES = {
    1: 'Ammonium Biurate',
    2: 'CaOx Dihydrate',
    3: 'CaOx Monohydrate Ovoid',
    4: 'Casts',
    5: 'Epithelial Cells',
    6: 'Microorganisms',
    7: 'Misc',
    8: 'Red Blood Cells',
    9: 'Triple Phosphate',
    10: 'Uric Acid',
    11: 'White Blood Cells',
}

RISK_MAP = {
    'Ammonium Biurate': 'Moderate',
    'CaOx Dihydrate': 'High',
    'CaOx Monohydrate Ovoid': 'High',
    'Casts': 'High',
    'Epithelial Cells': 'Low',
    'Lipids': 'Moderate',
    'Microorganisms': 'High',
    'Misc': 'Low',
    'Red Blood Cells': 'High',
    'Triple Phosphate': 'Moderate',
    'Uric Acid': 'High',
    'White Blood Cells': 'High',
}

UPLOAD_FOLDER = 'temp_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Mobile capture temporary session storage
# Later, this can be replaced with your database.
capture_sessions = {}


def get_server_base_url():
    host = request.host_url.rstrip("/")
    return host


def encode_image_to_base64(image_path: str) -> str:
    with open(image_path, 'rb') as f:
        encoded = base64.b64encode(f.read()).decode('utf-8')
    return f"data:image/jpeg;base64,{encoded}"


def get_adaptive_threshold(pil_image: Image.Image) -> float:
    gray = np.array(pil_image.convert("L"))

    brightness = float(gray.mean())
    contrast = float(gray.std())
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()

    print(
        f"[ADAPTIVE] brightness={brightness:.1f} | "
        f"contrast={contrast:.1f} | blur={blur_score:.1f}"
    )

    if blur_score < 40:
        threshold, reason = 0.30, "very blurry"
    elif brightness < 70 or contrast < 25:
        threshold, reason = 0.28, "dark / low contrast"
    elif brightness > 210 and contrast < 35:
        threshold, reason = 0.32, "overexposed"
    elif blur_score >= 120 and 90 <= brightness <= 180:
        threshold, reason = 0.25, "clean image"
    elif blur_score >= 80:
        threshold, reason = 0.27, "moderate quality"
    else:
        threshold, reason = 0.30, "fallback"

    print(f"[ADAPTIVE] threshold={threshold} ({reason})")
    return threshold


def get_threshold_with_retry(pil_image: Image.Image) -> float:
    base_threshold = get_adaptive_threshold(pil_image)

    test_detections = detection_model.model.predict(
        pil_image,
        threshold=base_threshold
    )

    count = len(test_detections) if test_detections.class_id is not None else 0

    print(f"[RETRY CHECK] detections at {base_threshold}: {count}")

    if count == 0:
        lowered = 0.18
        print(f"[RETRY] no detections → {base_threshold} → {lowered}")
        return lowered

    elif count < 3:
        lowered = 0.20
        print(f"[RETRY] few detections → {base_threshold} → {lowered}")
        return lowered

    elif count < 8:
        lowered = 0.22
        print(f"[RETRY] low detections → {base_threshold} → {lowered}")
        return lowered

    return base_threshold


class RFDETRDetectionModel(DetectionModel):

    def __init__(self, model_path, confidence_threshold=0.35, device="cpu:0", **kwargs):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.device = device
        self._object_prediction_list_per_image = [[]]
        self._original_predictions = None
        self.load_model()

    def load_model(self):
        self.model = RFDETRLarge(
            pretrain_weights=self.model_path,
            num_classes=11,
        )
        self.set_model(self.model)

    def set_model(self, model):
        self.model = model

    def perform_inference(self, image: np.ndarray):
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        detections: sv.Detections = self.model.predict(
            pil_image,
            threshold=self.confidence_threshold
        )
        self._original_predictions = detections

    def convert_original_predictions(self, shift_amount=None, full_shape=None):
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
                confidence = float(detections.confidence[i]) if detections.confidence is not None else 0.0
                class_id = int(detections.class_id[i])
                class_name = CLASS_NAMES.get(class_id, f'Unknown_{class_id}')

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


detection_model = RFDETRDetectionModel(
    model_path=MODEL_PATH,
    confidence_threshold=0.2,
    device="cpu:0",
)


def run_sahi(pil_image: Image.Image, image_path: str):
    adaptive_conf = get_threshold_with_retry(pil_image)
    detection_model.confidence_threshold = adaptive_conf

    w, h = pil_image.size
    long_edge = max(w, h)

    def annotate(pil_img, dets):
        frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        labels = (
            [CLASS_NAMES.get(int(c), f'Unknown_{c}') for c in dets.class_id]
            if dets.class_id is not None and len(dets.class_id) > 0
            else []
        )

        box_annotator = sv.BoxAnnotator()
        label_annotator = sv.LabelAnnotator()

        ann = box_annotator.annotate(scene=frame.copy(), detections=dets)
        ann = label_annotator.annotate(scene=ann, detections=dets, labels=labels)
        return ann

    if long_edge < 800:
        detections = detection_model.model.predict(
            pil_image,
            threshold=detection_model.confidence_threshold
        )
        return detections, annotate(pil_image, detections), adaptive_conf

    elif long_edge <= 1280:
        slice_passes = [
            dict(
                slice_height=640,
                slice_width=640,
                overlap_height_ratio=0.15,
                overlap_width_ratio=0.15
            ),
        ]

    else:
        slice_passes = [
            dict(
                slice_height=768,
                slice_width=768,
                overlap_height_ratio=0.15,
                overlap_width_ratio=0.15
            ),
            dict(
                slice_height=384,
                slice_width=384,
                overlap_height_ratio=0.2,
                overlap_width_ratio=0.2
            ),
        ]

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


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'message': 'CrystalScope model API is running!'
    })


# -------------------------------------------------------------------------
# MOBILE CAPTURE ROUTES
# -------------------------------------------------------------------------

@app.route('/create-capture-session', methods=['POST'])
def create_capture_session():
    """
    Desktop calls this after selecting/adding a patient.
    It creates a temporary session that the mobile app will use when uploading.
    """
    data = request.get_json(silent=True) or {}

    patient_id = data.get('patientId')
    patient_name = data.get('patientName', '')
    age = data.get('age', '')
    sex = data.get('sex', '')

    if not patient_id:
        patient_id = f"TEMP-{uuid.uuid4().hex[:8]}"

    session_id = str(uuid.uuid4())

    capture_sessions[session_id] = {
        'session_id': session_id,
        'patient_id': patient_id,
        'patient_name': patient_name,
        'age': age,
        'sex': sex,
        'status': 'waiting',
        'image_filename': None,
        'image_url': None,
        'created_at': datetime.now().isoformat(),
        'uploaded_at': None,
    }

    base_url = get_server_base_url()

    return jsonify({
        'success': True,
        'message': 'Capture session created.',
        'sessionId': session_id,
        'patientId': patient_id,
        'captureUploadEndpoint': f'{base_url}/upload-capture',
        'checkEndpoint': f'{base_url}/check-capture/{session_id}',
        'session': capture_sessions[session_id],
    }), 200


@app.route('/upload-capture', methods=['POST'])
def upload_capture():
    """
    Mobile calls this after capturing an image.
    This only uploads the captured image. It does NOT analyze yet.
    Desktop will analyze later.
    """
    session_id = request.form.get('sessionId')

    if not session_id:
        return jsonify({
            'success': False,
            'error': 'No sessionId provided.'
        }), 400

    if session_id not in capture_sessions:
        return jsonify({
            'success': False,
            'error': 'Invalid or expired capture session.'
        }), 404

    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No image provided.'
        }), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No image selected.'
        }), 400

    try:
        filename = f"capture_{session_id}_{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        pil_image = Image.open(file.stream).convert("RGB")
        pil_image.save(filepath, "JPEG", quality=92)

        image_url = f"{get_server_base_url()}/image/{filename}"

        capture_sessions[session_id]['status'] = 'uploaded'
        capture_sessions[session_id]['image_filename'] = filename
        capture_sessions[session_id]['image_url'] = image_url
        capture_sessions[session_id]['uploaded_at'] = datetime.now().isoformat()

        return jsonify({
            'success': True,
            'message': 'Image uploaded successfully.',
            'sessionId': session_id,
            'imageUrl': image_url,
            'session': capture_sessions[session_id],
        }), 200

    except Exception as e:
        print(f"[UPLOAD CAPTURE ERROR] {str(e)}")

        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/check-capture/<session_id>', methods=['GET'])
def check_capture(session_id):
    """
    Desktop polls this endpoint to know if the mobile image has arrived.
    """
    session = capture_sessions.get(session_id)

    if not session:
        return jsonify({
            'success': False,
            'error': 'Capture session not found.'
        }), 404

    return jsonify({
        'success': True,
        'session': session,
        'status': session['status'],
        'imageUrl': session.get('image_url'),
    }), 200


@app.route('/analyze-captured/<session_id>', methods=['POST'])
def analyze_captured(session_id):
    """
    Optional route:
    Desktop can call this to analyze the image uploaded by mobile.
    """
    session = capture_sessions.get(session_id)

    if not session:
        return jsonify({
            'success': False,
            'error': 'Capture session not found.'
        }), 404

    image_filename = session.get('image_filename')

    if not image_filename:
        return jsonify({
            'success': False,
            'error': 'No uploaded image found for this session.'
        }), 400

    filepath = os.path.join(UPLOAD_FOLDER, image_filename)

    if not os.path.exists(filepath):
        return jsonify({
            'success': False,
            'error': 'Captured image file does not exist.'
        }), 404

    raw_filename = f"raw_{uuid.uuid4()}.jpg"
    raw_path = os.path.join(UPLOAD_FOLDER, raw_filename)

    try:
        pil_image = Image.open(filepath).convert("RGB")
        pil_image.save(raw_path, "JPEG", quality=92)

        detections, annotated_frame, used_threshold = run_sahi(pil_image, filepath)

        annotated_filename = f"annotated_{uuid.uuid4()}.jpg"
        annotated_path = os.path.join(UPLOAD_FOLDER, annotated_filename)
        cv2.imwrite(annotated_path, annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 92])

        raw_image_b64 = encode_image_to_base64(raw_path)

        crystal_counts = {}
        detection_list = []

        if detections.class_id is not None and len(detections.class_id) > 0:
            for i in range(len(detections)):
                class_id = int(detections.class_id[i])
                confidence = float(detections.confidence[i]) if detections.confidence is not None else 0.0
                class_name = CLASS_NAMES.get(class_id, f'Unknown_{class_id}')
                bbox = detections.xyxy[i].tolist()

                crystal_counts[class_name] = crystal_counts.get(class_name, 0) + 1

                detection_list.append({
                    'crystalType': class_name,
                    'confidence': round(confidence * 100, 2),
                    'bbox': bbox,
                })

        summary = [
            {
                'crystalType': crystal_type,
                'count': count,
                'risk': RISK_MAP.get(crystal_type, 'Unknown'),
            }
            for crystal_type, count in crystal_counts.items()
        ]

        annotated_image_url = f'{get_server_base_url()}/image/{annotated_filename}'

        session['status'] = 'analyzed'
        session['analysis'] = {
            'summary': summary,
            'detections': detection_list,
            'total': len(detection_list),
            'annotatedImage': annotated_image_url,
            'thresholdUsed': used_threshold,
        }

        return jsonify({
            'success': True,
            'message': 'Captured image analyzed successfully.',
            'patientId': session.get('patient_id'),
            'sessionId': session_id,
            'summary': summary,
            'detections': detection_list,
            'total': len(detection_list),
            'annotatedImage': annotated_image_url,
            'rawImage': raw_image_b64,
            'thresholdUsed': used_threshold,
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

    finally:
        if os.path.exists(raw_path):
            os.remove(raw_path)


# -------------------------------------------------------------------------
# EXISTING ANALYZE ROUTE
# -------------------------------------------------------------------------

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

    raw_filename = f"raw_{uuid.uuid4()}.jpg"
    raw_path = os.path.join(UPLOAD_FOLDER, raw_filename)

    try:
        pil_image = Image.open(filepath).convert("RGB")

        pil_image.save(raw_path, "JPEG", quality=92)

        detections, annotated_frame, used_threshold = run_sahi(pil_image, filepath)

        annotated_filename = f"annotated_{uuid.uuid4()}.jpg"
        annotated_path = os.path.join(UPLOAD_FOLDER, annotated_filename)
        cv2.imwrite(annotated_path, annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 92])

        raw_image_b64 = encode_image_to_base64(raw_path)

        crystal_counts = {}
        detection_list = []

        if detections.class_id is not None and len(detections.class_id) > 0:
            for i in range(len(detections)):
                class_id = int(detections.class_id[i])
                confidence = float(detections.confidence[i]) if detections.confidence is not None else 0.0
                class_name = CLASS_NAMES.get(class_id, f'Unknown_{class_id}')
                bbox = detections.xyxy[i].tolist()

                crystal_counts[class_name] = crystal_counts.get(class_name, 0) + 1

                detection_list.append({
                    'crystalType': class_name,
                    'confidence': round(confidence * 100, 2),
                    'bbox': bbox,
                })

        summary = [
            {
                'crystalType': crystal_type,
                'count': count,
                'risk': RISK_MAP.get(crystal_type, 'Unknown'),
            }
            for crystal_type, count in crystal_counts.items()
        ]

        return jsonify({
            'success': True,
            'summary': summary,
            'detections': detection_list,
            'total': len(detection_list),
            'annotatedImage': f'{get_server_base_url()}/image/{annotated_filename}',
            'rawImage': raw_image_b64,
            'thresholdUsed': used_threshold,
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

        if os.path.exists(raw_path):
            os.remove(raw_path)


@app.route('/image/<filename>', methods=['GET'])
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)