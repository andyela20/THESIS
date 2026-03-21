from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
import os
import uuid
import cv2

app = Flask(__name__)
CORS(app)

# Load model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'best.pt')
model = YOLO(MODEL_PATH)

CLASS_NAMES = {
    0: 'CaOx Dihydrate',
    1: 'CaOx Monohydrate Ovoid',
    2: 'Phosphate',
}

RISK_MAP = {
    'CaOx Dihydrate':         'High',
    'CaOx Monohydrate Ovoid': 'High',
    'Phosphate':              'Moderate',
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
        results = model(filepath)

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