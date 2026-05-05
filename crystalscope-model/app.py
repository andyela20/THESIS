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

# -------------------------------------------------------------------------
# MODEL PATHS
# -------------------------------------------------------------------------

CRYSTALS_MODEL_PATH = os.path.join(
    os.path.abspath(os.path.dirname(__file__)), 'model', 'crystal.pt'
)

PARTICLES_MODEL_PATH = os.path.join(
    os.path.abspath(os.path.dirname(__file__)), 'model', 'particles.pt'
)

CONFIDENCE_THRESHOLD = 0.40

# -------------------------------------------------------------------------
# CLASS NAMES PER MODEL
# Replace class IDs and names to match your actual model outputs
# -------------------------------------------------------------------------

CRYSTALS_CLASS_NAMES = {
    1: 'Ammonium Biurate',
    2: 'CaOx Dihydrate',
    3: 'CaOx Monohydrate Ovoid',
    4: 'Triple Phosphate',
    5: 'Uric Acid',
}

PARTICLES_CLASS_NAMES = {
    1: 'Casts',
    2: 'Epithelial Cells',
    3: 'Microorganisms',
    4: 'Misc',
    5: 'Red Blood Cells',
    6: 'White Blood Cells',
}

# Offset applied to particles class IDs when merging with crystals detections
# to avoid ID collision. Set this higher than the max crystals class ID.
PARTICLES_CLASS_ID_OFFSET = 100

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

capture_sessions = {}


# -------------------------------------------------------------------------
# HELPERS
# -------------------------------------------------------------------------

def get_server_base_url():
    return request.host_url.rstrip("/")


def encode_image_to_base64(image_path: str) -> str:
    with open(image_path, 'rb') as f:
        encoded = base64.b64encode(f.read()).decode('utf-8')
    return f"data:image/jpeg;base64,{encoded}"


# -------------------------------------------------------------------------
# DETECTION MODEL CLASS
# -------------------------------------------------------------------------

class RFDETRDetectionModel(DetectionModel):

    def __init__(self, model_path, class_names, confidence_threshold=CONFIDENCE_THRESHOLD, device="cpu:0", **kwargs):
        self.model_path = model_path
        self.class_names = class_names
        self.confidence_threshold = confidence_threshold
        self.device = device
        self._object_prediction_list_per_image = [[]]
        self._original_predictions = None
        self.load_model()

    def load_model(self):
        self.model = RFDETRLarge(
            pretrain_weights=self.model_path,
            num_classes=len(self.class_names),
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
                class_name = self.class_names.get(class_id, f'Unknown_{class_id}')

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
        return len(self.class_names)

    @property
    def has_mask(self):
        return False

    @property
    def category_names(self):
        return list(self.class_names.values())


# -------------------------------------------------------------------------
# LOAD BOTH MODELS AT STARTUP
# -------------------------------------------------------------------------

crystals_detection_model = RFDETRDetectionModel(
    model_path=CRYSTALS_MODEL_PATH,
    class_names=CRYSTALS_CLASS_NAMES,
    confidence_threshold=CONFIDENCE_THRESHOLD,
    device="cpu:0",
)

particles_detection_model = RFDETRDetectionModel(
    model_path=PARTICLES_MODEL_PATH,
    class_names=PARTICLES_CLASS_NAMES,
    confidence_threshold=CONFIDENCE_THRESHOLD,
    device="cpu:0",
)


# -------------------------------------------------------------------------
# SAHI INFERENCE
# -------------------------------------------------------------------------

def run_sahi_single(pil_image: Image.Image, image_path: str, detection_model: RFDETRDetectionModel) -> sv.Detections:
    """Run SAHI inference for a single model. Returns raw sv.Detections."""
    w, h = pil_image.size
    long_edge = max(w, h)

    if long_edge < 800:
        return detection_model.model.predict(
            pil_image,
            threshold=CONFIDENCE_THRESHOLD
        )

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
        return raw.with_nms(threshold=0.4)
    else:
        return sv.Detections.empty()


def run_sahi(pil_image: Image.Image, image_path: str):
    """
    Run both models and merge their detections.
    Particles class IDs are offset by PARTICLES_CLASS_ID_OFFSET to avoid
    collision with crystals class IDs during merging.
    Returns: (merged sv.Detections, annotated frame, unified class name dict)
    """
    crystals_detections = run_sahi_single(pil_image, image_path, crystals_detection_model)
    particles_detections = run_sahi_single(pil_image, image_path, particles_detection_model)

    # Build unified class name lookup with offset applied to particles
    unified_class_names = dict(CRYSTALS_CLASS_NAMES)
    for class_id, class_name in PARTICLES_CLASS_NAMES.items():
        unified_class_names[class_id + PARTICLES_CLASS_ID_OFFSET] = class_name

    # Merge detections from both models
    all_xyxy, all_conf, all_cls = [], [], []

    if crystals_detections.class_id is not None and len(crystals_detections.class_id) > 0:
        all_xyxy.extend(crystals_detections.xyxy.tolist())
        all_conf.extend(crystals_detections.confidence.tolist())
        all_cls.extend(crystals_detections.class_id.tolist())

    if particles_detections.class_id is not None and len(particles_detections.class_id) > 0:
        all_xyxy.extend(particles_detections.xyxy.tolist())
        all_conf.extend(particles_detections.confidence.tolist())
        all_cls.extend([c + PARTICLES_CLASS_ID_OFFSET for c in particles_detections.class_id.tolist()])

    if all_xyxy:
        merged = sv.Detections(
            xyxy=np.array(all_xyxy, dtype=np.float32),
            confidence=np.array(all_conf, dtype=np.float32),
            class_id=np.array(all_cls, dtype=int),
        )
        merged = merged.with_nms(threshold=0.4)
    else:
        merged = sv.Detections.empty()

    # Annotate merged detections onto the original image
    frame = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    labels = (
        [unified_class_names.get(int(c), f'Unknown_{c}') for c in merged.class_id]
        if merged.class_id is not None and len(merged.class_id) > 0
        else []
    )

    box_annotator = sv.BoxAnnotator()
    label_annotator = sv.LabelAnnotator()

    annotated = box_annotator.annotate(scene=frame.copy(), detections=merged)
    annotated = label_annotator.annotate(scene=annotated, detections=merged, labels=labels)

    return merged, annotated, unified_class_names


# -------------------------------------------------------------------------
# SHARED RESULT BUILDER
# -------------------------------------------------------------------------

def build_results(detections: sv.Detections, unified_class_names: dict):
    """Convert sv.Detections into summary and detection_list for API responses."""
    crystal_counts = {}
    detection_list = []

    if detections.class_id is not None and len(detections.class_id) > 0:
        for i in range(len(detections)):
            class_id = int(detections.class_id[i])
            confidence = float(detections.confidence[i]) if detections.confidence is not None else 0.0
            class_name = unified_class_names.get(class_id, f'Unknown_{class_id}')
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

    return summary, detection_list


# -------------------------------------------------------------------------
# ROUTES
# -------------------------------------------------------------------------

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'message': 'CrystalScope model API is running!'
    })


@app.route('/create-capture-session', methods=['POST'])
def create_capture_session():
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
    session_id = request.form.get('sessionId')

    if not session_id:
        return jsonify({'success': False, 'error': 'No sessionId provided.'}), 400

    if session_id not in capture_sessions:
        return jsonify({'success': False, 'error': 'Invalid or expired capture session.'}), 404

    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image provided.'}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({'success': False, 'error': 'No image selected.'}), 400

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
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/check-capture/<session_id>', methods=['GET'])
def check_capture(session_id):
    session = capture_sessions.get(session_id)

    if not session:
        return jsonify({'success': False, 'error': 'Capture session not found.'}), 404

    return jsonify({
        'success': True,
        'session': session,
        'status': session['status'],
        'imageUrl': session.get('image_url'),
    }), 200


@app.route('/analyze-captured/<session_id>', methods=['POST'])
def analyze_captured(session_id):
    session = capture_sessions.get(session_id)

    if not session:
        return jsonify({'success': False, 'error': 'Capture session not found.'}), 404

    image_filename = session.get('image_filename')

    if not image_filename:
        return jsonify({'success': False, 'error': 'No uploaded image found for this session.'}), 400

    filepath = os.path.join(UPLOAD_FOLDER, image_filename)

    if not os.path.exists(filepath):
        return jsonify({'success': False, 'error': 'Captured image file does not exist.'}), 404

    raw_filename = f"raw_{uuid.uuid4()}.jpg"
    raw_path = os.path.join(UPLOAD_FOLDER, raw_filename)

    try:
        pil_image = Image.open(filepath).convert("RGB")
        pil_image.save(raw_path, "JPEG", quality=92)

        detections, annotated_frame, unified_class_names = run_sahi(pil_image, filepath)

        annotated_filename = f"annotated_{uuid.uuid4()}.jpg"
        annotated_path = os.path.join(UPLOAD_FOLDER, annotated_filename)
        cv2.imwrite(annotated_path, annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 92])

        raw_image_b64 = encode_image_to_base64(raw_path)
        summary, detection_list = build_results(detections, unified_class_names)
        annotated_image_url = f'{get_server_base_url()}/image/{annotated_filename}'

        session['status'] = 'analyzed'
        session['analysis'] = {
            'summary': summary,
            'detections': detection_list,
            'total': len(detection_list),
            'annotatedImage': annotated_image_url,
            'thresholdUsed': CONFIDENCE_THRESHOLD,
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
            'thresholdUsed': CONFIDENCE_THRESHOLD,
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if os.path.exists(raw_path):
            os.remove(raw_path)


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

        detections, annotated_frame, unified_class_names = run_sahi(pil_image, filepath)

        annotated_filename = f"annotated_{uuid.uuid4()}.jpg"
        annotated_path = os.path.join(UPLOAD_FOLDER, annotated_filename)
        cv2.imwrite(annotated_path, annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 92])

        raw_image_b64 = encode_image_to_base64(raw_path)
        summary, detection_list = build_results(detections, unified_class_names)

        return jsonify({
            'success': True,
            'summary': summary,
            'detections': detection_list,
            'total': len(detection_list),
            'annotatedImage': f'{get_server_base_url()}/image/{annotated_filename}',
            'rawImage': raw_image_b64,
            'thresholdUsed': CONFIDENCE_THRESHOLD,
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