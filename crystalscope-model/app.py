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


from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
import os
import uuid
import cv2
import pillow_heif
from PIL import Image

pillow_heif.register_heif_opener()

app = Flask(__name__)
CORS(app)

# Load model
MODEL_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'model', 'best_v26lnogray.pt')
model = YOLO(MODEL_PATH)

CLASS_NAMES = {
    0: 'Ammonium Biurate',
    1: 'CaOx Dihydrate',
    2: 'CaOx Monohydrate Ovoid',
    3: 'Triple Phosphate',
    4: 'Uric Acid'
}

RISK_MAP = {
    'Ammonium Biurate':       'Moderate',
    'CaOx Dihydrate':         'High',
    'CaOx Monohydrate Ovoid': 'High',
    'Triple Phosphate':       'Moderate',
    'Uric Acid':              'High',
}

UPLOAD_FOLDER = 'temp_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'message': 'CrystalScope model API is running!' })

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({ 'error': 'No image provided' }), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({ 'error': 'No image selected' }), 400

    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        # Run YOLOv8 detection
        results = model(filepath, conf=0.35)

        # Save annotated image
        annotated_filename = f"annotated_{filename}"
        annotated_path = os.path.join(UPLOAD_FOLDER, annotated_filename)
        annotated_frame = results[0].plot()
        cv2.imwrite(annotated_path, annotated_frame)

        # Process results
        crystal_counts = {}
        detections = []

        for result in results:
            for box in result.boxes:
                class_id   = int(box.cls[0])
                confidence = float(box.conf[0])
                class_name = CLASS_NAMES.get(class_id, f'Unknown_{class_id}')

                if class_name not in crystal_counts:
                    crystal_counts[class_name] = 0
                crystal_counts[class_name] += 1

                detections.append({
                    'crystalType': class_name,
                    'confidence':  round(confidence * 100, 2),
                    'bbox':        box.xyxy[0].tolist()
                })

        summary = []
        for crystal_type, count in crystal_counts.items():
            summary.append({
                'crystalType': crystal_type,
                'count':       count,
                'risk':        RISK_MAP.get(crystal_type, 'Unknown'),
            })

        return jsonify({
            'success':        True,
            'summary':        summary,
            'detections':     detections,
            'total':          len(detections),
            'annotatedImage': f'http://localhost:5001/image/{annotated_filename}'
        })

    except Exception as e:
        return jsonify({ 'error': str(e) }), 500

    finally:
        # Delete original temp image only — keep annotated
        if os.path.exists(filepath):
            os.remove(filepath)

# Serve annotated image
@app.route('/image/<filename>', methods=['GET'])
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)