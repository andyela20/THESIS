from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from rfdetr import RFDETRLarge
import supervision as sv
import os
import sys
import uuid
import cv2
import numpy as np
import pillow_heif
from PIL import Image
import base64
from datetime import datetime

import torch
import torch.nn as nn
from transformers import Dinov2Config, Dinov2Model

from sahi.models.base import DetectionModel
from sahi.prediction import ObjectPrediction
from sahi.predict import get_sliced_prediction

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

os.environ["PYTHONUTF8"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"

pillow_heif.register_heif_opener()

app = Flask(__name__)
CORS(app)



def resource_path(*parts):
    """
    Finds files in normal development mode and later when packaged.
    Used for loading local model files.
    """
    base_dir = os.path.abspath(os.path.dirname(__file__))
    exe_dir = os.path.abspath(os.path.dirname(sys.executable))

    candidates = [
        os.path.join(base_dir, *parts),
        os.path.join(exe_dir, *parts),
        os.path.join(os.getcwd(), *parts),
    ]

    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate

    return candidates[0]


MODEL_PATH = resource_path("model-final", "RAFA LATEST.pt")


CLASS_NAMES = {
    1: "Ammonium Biurate",
    2: "CaOx Dihydrate",
    3: "CaOx Monohydrate Ovoid",
    4: "Casts",
    5: "Epithelial Cells",
    6: "Microorganisms",
    7: "Misc",
    8: "Red Blood Cells",
    9: "Triple Phosphate",
    10: "Uric Acid",
    11: "White Blood Cells",
}


RISK_MAP = {
    "Ammonium Biurate": {
        "Low": (1, 2),
        "Moderate": (3, 5),
        "High": (6, float("inf"))
    },
    "CaOx Dihydrate": {
        "Low": (1, 3),
        "Moderate": (4, 7),
        "High": (8, float("inf"))
    },
    "CaOx Monohydrate Ovoid": {
        "Low": (1, 2),
        "Moderate": (3, 5),
        "High": (6, float("inf"))
    },
    "Casts": {
        "Low": (1, 1),
        "Moderate": (2, 3),
        "High": (4, float("inf"))
    },
    "Epithelial Cells": {
        "Low": (1, 5),
        "Moderate": (6, 10),
        "High": (11, float("inf"))
    },
    "Microorganisms": {
        "Low": (1, 3),
        "Moderate": (4, 8),
        "High": (9, float("inf"))
    },
    "Misc": {
        "Low": (1, 2),
        "Moderate": (3, 5),
        "High": (6, float("inf"))
    },
    "Red Blood Cells": {
        "Low": (1, 3),
        "Moderate": (4, 10),
        "High": (11, float("inf"))
    },
    "Triple Phosphate": {
        "Low": (1, 3),
        "Moderate": (4, 6),
        "High": (7, float("inf"))
    },
    "Uric Acid": {
        "Low": (1, 3),
        "Moderate": (4, 7),
        "High": (8, float("inf"))
    },
    "White Blood Cells": {
        "Low": (1, 5),
        "Moderate": (6, 10),
        "High": (11, float("inf"))
    },
}


def get_risk_level(class_name, count):
    if class_name not in RISK_MAP:
        return "Unknown"
    for risk_level, (min_count, max_count) in RISK_MAP[class_name].items():
        if min_count <= count <= max_count:
            return risk_level
    return "Unknown"


UPLOAD_FOLDER = "temp_uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Detection behavior settings.
# OVERLAP_NMS_IOU_THRESHOLD controls when overlapping predictions are treated
# as the same object. The higher-confidence prediction wins.
TILE_ZOOM_SCALE = 2.0
MAX_ZOOMED_TILE_LONG_EDGE = 1200
OVERLAP_NMS_IOU_THRESHOLD = 0.45
ENABLE_MICROSCOPE_IMAGE_GATE = True

# Local DINOv2 classifier gate.
# Put your trained classifier file here:
# project_folder/model/dinov2_classifier.pt
#
# This classifier is used BEFORE RF-DETR/SAHI.
# If the image is classified as Random/non-microscope, detection is skipped.
CLASSIFIER_MODEL_PATH = resource_path("model-final", "dinov2_classifier.pt")
ENABLE_CLASSIFIER_GATE = True
CLASSIFIER_MIN_CONFIDENCE = 0.70
CLASSIFIER_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# These names are based on your uploaded classifier checkpoint:
# class_to_idx = {"Micro": 0, "Random": 1}
CLASSIFIER_ACCEPT_CLASSES = {"micro", "microscope", "valid_microscope", "urine_microscope"}
CLASSIFIER_REJECT_CLASSES = {"random", "non_microscope", "invalid_random_photo", "selfie"}


# Mobile capture temporary session storage
# Later, this can be replaced with your database.
capture_sessions = {}


def get_server_base_url():
    host = request.host_url.rstrip("/")
    return host


def encode_image_to_base64(image_path: str) -> str:
    with open(image_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")

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


class DINOv2ImageClassifier(nn.Module):
    """
    Classifier architecture used by dinov2_classifier.pt.

    This version does NOT call AutoModel.from_pretrained(), so it does not
    need to download the DINOv2 backbone from HuggingFace at runtime.
    It builds the DINOv2-small architecture locally and loads the weights
    from your checkpoint.
    """

    def __init__(self, state_dict, num_classes: int):
        super().__init__()

        hidden_size = int(state_dict["backbone.layernorm.weight"].shape[0])
        intermediate_size = int(state_dict["backbone.encoder.layer.0.mlp.fc1.weight"].shape[0])
        patch_size = int(state_dict["backbone.embeddings.patch_embeddings.projection.weight"].shape[-1])
        position_count = int(state_dict["backbone.embeddings.position_embeddings"].shape[1])
        patch_grid = int(np.sqrt(position_count - 1))
        image_size = int(patch_grid * patch_size)

        layer_indices = []
        for key in state_dict.keys():
            if key.startswith("backbone.encoder.layer."):
                parts = key.split(".")
                if len(parts) > 3 and parts[3].isdigit():
                    layer_indices.append(int(parts[3]))

        num_hidden_layers = max(layer_indices) + 1 if layer_indices else 12
        num_attention_heads = max(1, hidden_size // 64)

        self.image_size = image_size

        config = Dinov2Config(
            image_size=image_size,
            patch_size=patch_size,
            num_channels=3,
            hidden_size=hidden_size,
            num_hidden_layers=num_hidden_layers,
            num_attention_heads=num_attention_heads,
            intermediate_size=intermediate_size,
            layer_norm_eps=1e-6,
            hidden_act="gelu",
            qkv_bias=True,
            layerscale_value=1.0,
            use_swiglu_ffn=False,
        )

        self.backbone = Dinov2Model(config)

        self.classifier = nn.Sequential(
            nn.LayerNorm(hidden_size),
            nn.Dropout(0.2),
            nn.Linear(hidden_size, num_classes),
        )

    def forward(self, pixel_values):
        outputs = self.backbone(pixel_values=pixel_values)
        cls_token = outputs.last_hidden_state[:, 0]
        logits = self.classifier(cls_token)
        return logits


classifier_model = None
classifier_idx_to_class = None
classifier_image_size = 518


def normalize_class_name(class_name: str) -> str:
    return str(class_name).strip().lower().replace(" ", "_").replace("-", "_")


def preprocess_for_dinov2(pil_image: Image.Image, image_size: int):
    """
    Local DINOv2 preprocessing.

    Uses RGB resize + ImageNet normalization, matching the usual DINOv2
    image processor behavior closely enough for local inference.
    """

    image = pil_image.convert("RGB")

    try:
        resample_filter = Image.Resampling.BICUBIC
    except AttributeError:
        resample_filter = Image.BICUBIC

    image = image.resize((image_size, image_size), resample_filter)

    array = np.array(image).astype(np.float32) / 255.0

    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    array = (array - mean) / std
    array = np.transpose(array, (2, 0, 1))

    tensor = torch.from_numpy(array).unsqueeze(0).float()
    return tensor


def load_classifier_model():
    """
    Loads the local DINOv2 classifier once and keeps it in memory.
    """

    global classifier_model, classifier_idx_to_class, classifier_image_size

    if classifier_model is not None:
        return classifier_model, classifier_idx_to_class, classifier_image_size

    if not os.path.exists(CLASSIFIER_MODEL_PATH):
        raise FileNotFoundError(
            f"Classifier model not found at: {CLASSIFIER_MODEL_PATH}. "
            "Place dinov2_classifier.pt inside the model folder."
        )

    checkpoint = torch.load(CLASSIFIER_MODEL_PATH, map_location=CLASSIFIER_DEVICE)

    state_dict = checkpoint["state_dict"]
    raw_idx_to_class = checkpoint.get("idx_to_class", {0: "Micro", 1: "Random"})

    classifier_idx_to_class = {
        int(index): class_name
        for index, class_name in raw_idx_to_class.items()
    }

    classifier_model = DINOv2ImageClassifier(
        state_dict=state_dict,
        num_classes=len(classifier_idx_to_class)
    )

    classifier_model.load_state_dict(state_dict, strict=True)
    classifier_model.to(CLASSIFIER_DEVICE)
    classifier_model.eval()

    classifier_image_size = int(classifier_model.image_size)

    print(
        f"[CLASSIFIER] loaded local DINOv2 checkpoint from {CLASSIFIER_MODEL_PATH} | "
        f"classes={classifier_idx_to_class} | "
        f"image_size={classifier_image_size} | "
        f"device={CLASSIFIER_DEVICE}"
    )

    return classifier_model, classifier_idx_to_class, classifier_image_size


def classify_microscope_domain(pil_image: Image.Image):
    """
    Classifies the whole uploaded image before object detection.

    Expected classes from your uploaded model:
    - Micro  = valid microscope image
    - Random = invalid/random image
    """

    model, idx_to_class, image_size = load_classifier_model()

    pixel_values = preprocess_for_dinov2(
        pil_image,
        image_size=image_size
    ).to(CLASSIFIER_DEVICE)

    with torch.no_grad():
        logits = model(pixel_values=pixel_values)
        probabilities = torch.softmax(logits, dim=1)[0]

    confidence, predicted_index = torch.max(probabilities, dim=0)
    predicted_index = int(predicted_index.item())
    confidence = float(confidence.item())

    predicted_class = idx_to_class.get(predicted_index, f"class_{predicted_index}")
    normalized_class = normalize_class_name(predicted_class)

    all_probabilities = {
        idx_to_class.get(i, f"class_{i}"): round(float(probabilities[i].item()), 4)
        for i in range(len(probabilities))
    }

    is_accepted_class = normalized_class in CLASSIFIER_ACCEPT_CLASSES
    is_rejected_class = normalized_class in CLASSIFIER_REJECT_CLASSES

    is_valid = (
        is_accepted_class
        and confidence >= CLASSIFIER_MIN_CONFIDENCE
        and not is_rejected_class
    )

    print(
        f"[CLASSIFIER] predicted={predicted_class} | "
        f"confidence={confidence:.4f} | valid={is_valid} | "
        f"probabilities={all_probabilities}"
    )

    return {
        "is_valid": is_valid,
        "predictedClass": predicted_class,
        "normalizedClass": normalized_class,
        "confidence": round(confidence, 4),
        "minConfidence": CLASSIFIER_MIN_CONFIDENCE,
        "probabilities": all_probabilities,
    }


def reject_if_not_microscope_image(pil_image: Image.Image):
    """
    Stops selfies/random photos before RF-DETR/SAHI detection.
    """

    if not ENABLE_MICROSCOPE_IMAGE_GATE or not ENABLE_CLASSIFIER_GATE:
        return None

    try:
        check = classify_microscope_domain(pil_image)
    except Exception as e:
        error_message = str(e)
        print(f"[CLASSIFIER ERROR] {error_message}")
        return jsonify({
            "success": False,
            "errorType": "CLASSIFIER_EXECUTION_ERROR",
            "error": f"Microscope classifier could not be loaded or executed: {error_message}",
            "message": error_message,
            "popup": {
                "show": True,
                "title": "Classifier Error",
                "message": "The microscope image validator could not run. Please check the classifier model file and server dependencies."
            },
            "classifierModelPath": CLASSIFIER_MODEL_PATH,
            "total": 0,
            "summary": [],
            "detections": []
        }), 500

    if check["is_valid"]:
        return None

    return jsonify({
        "success": False,
        "errorType": "INVALID_IMAGE_CLASSIFIER_REJECTED",
        "error": "The uploaded image was rejected by the microscope-image classifier.",
        "message": "Please upload a valid urine sediment microscope image instead of a random/non-microscope image.",
        "popup": {
            "show": True,
            "title": "Invalid Image Uploaded",
            "message": "This image does not appear to be a urine sediment microscope image. Please upload a valid microscope image."
        },
        "classifierPrediction": check,
        "total": 0,
        "summary": [],
        "detections": []
    }), 400


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
        print(f"[RETRY] no detections â†’ {base_threshold} â†’ {lowered}")
        return lowered

    elif count < 3:
        lowered = 0.20
        print(f"[RETRY] few detections â†’ {base_threshold} â†’ {lowered}")
        return lowered

    elif count < 8:
        lowered = 0.22
        print(f"[RETRY] low detections â†’ {base_threshold} â†’ {lowered}")
        return lowered

    return base_threshold


class RFDETRDetectionModel(DetectionModel):
    """
    SAHI adapter for RF-DETR.

    This version applies TILE-FIRST-THEN-ZOOM detection:
    1. SAHI slices the original image.
    2. Each tile is digitally zoomed inside perform_inference().
    3. RF-DETR detects on the zoomed tile.
    4. Bounding boxes are scaled back to the original tile coordinate size.
    5. SAHI shifts/merges the tile detections back onto the original image.
    """

    def __init__(
        self,
        model_path,
        confidence_threshold=0.35,
        device="cpu:0",
        tile_zoom_scale=2.0,
        max_zoomed_tile_long_edge=1200,
        **kwargs
    ):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.device = device

        # Tile-level digital zoom settings
        self.tile_zoom_scale = tile_zoom_scale
        self.max_zoomed_tile_long_edge = max_zoomed_tile_long_edge

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

    def zoom_tile(self, pil_tile: Image.Image):
        """
        Digitally zooms only the current SAHI tile.
        This does not zoom the whole original image.
        """

        w, h = pil_tile.size
        long_edge = max(w, h)

        scale = self.tile_zoom_scale

        # Prevent excessively large tile images.
        if long_edge * scale > self.max_zoomed_tile_long_edge:
            scale = self.max_zoomed_tile_long_edge / long_edge

        if scale <= 1.0:
            return pil_tile, 1.0

        new_w = int(w * scale)
        new_h = int(h * scale)

        try:
            resample_filter = Image.Resampling.BICUBIC
        except AttributeError:
            resample_filter = Image.BICUBIC

        zoomed_tile = pil_tile.resize((new_w, new_h), resample_filter)

        print(
            f"[TILE ZOOM] tile={w}x{h} â†’ "
            f"{new_w}x{new_h} | scale={scale:.2f}x"
        )

        return zoomed_tile, scale

    def perform_inference(self, image: np.ndarray):
        """
        Called by SAHI for every sliced tile.
        """

        # Keep the same conversion style as the original code.
        pil_tile = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

        original_w, original_h = pil_tile.size

        zoomed_tile, zoom_scale = self.zoom_tile(pil_tile)

        detections: sv.Detections = self.model.predict(
            zoomed_tile,
            threshold=self.confidence_threshold
        )

        # Scale detected boxes back from zoomed-tile coordinates
        # to original-tile coordinates before SAHI applies shifting.
        if (
            detections is not None
            and detections.class_id is not None
            and len(detections.class_id) > 0
            and zoom_scale != 1.0
        ):
            detections.xyxy = detections.xyxy / zoom_scale

            # Clip boxes inside the original tile boundaries.
            detections.xyxy[:, 0] = np.clip(detections.xyxy[:, 0], 0, original_w)
            detections.xyxy[:, 1] = np.clip(detections.xyxy[:, 1], 0, original_h)
            detections.xyxy[:, 2] = np.clip(detections.xyxy[:, 2], 0, original_w)
            detections.xyxy[:, 3] = np.clip(detections.xyxy[:, 3], 0, original_h)

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

        if detections is not None:
            if detections.class_id is not None and len(detections.class_id) > 0:
                for i in range(len(detections)):
                    x1, y1, x2, y2 = detections.xyxy[i].tolist()

                    confidence = (
                        float(detections.confidence[i])
                        if detections.confidence is not None
                        else 0.0
                    )

                    class_id = int(detections.class_id[i])
                    class_name = CLASS_NAMES.get(class_id, f"Unknown_{class_id}")

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


# Main RF-DETR model wrapped for SAHI.
detection_model = RFDETRDetectionModel(
    model_path=MODEL_PATH,
    confidence_threshold=0.2,
    device="cpu:0",

    # Recommended first test settings.
    # Increase to 2.5 if detection is still weak.
    # Decrease to 1.5 if it becomes too slow or too noisy.
    tile_zoom_scale=TILE_ZOOM_SCALE,
    max_zoomed_tile_long_edge=MAX_ZOOMED_TILE_LONG_EDGE,
)


def compute_iou_xyxy(box, boxes):
    """
    Computes IoU between one box and many boxes.
    Box format: [x1, y1, x2, y2]
    """

    x1 = np.maximum(box[0], boxes[:, 0])
    y1 = np.maximum(box[1], boxes[:, 1])
    x2 = np.minimum(box[2], boxes[:, 2])
    y2 = np.minimum(box[3], boxes[:, 3])

    intersection_w = np.maximum(0, x2 - x1)
    intersection_h = np.maximum(0, y2 - y1)
    intersection_area = intersection_w * intersection_h

    box_area = max(0, box[2] - box[0]) * max(0, box[3] - box[1])
    boxes_area = (
        np.maximum(0, boxes[:, 2] - boxes[:, 0])
        * np.maximum(0, boxes[:, 3] - boxes[:, 1])
    )

    union_area = box_area + boxes_area - intersection_area

    return intersection_area / np.maximum(union_area, 1e-6)


def class_agnostic_highest_confidence_nms(
    detections: sv.Detections,
    iou_threshold=OVERLAP_NMS_IOU_THRESHOLD
):
    """
    Removes overlapping duplicate detections regardless of class.

    Purpose:
    If the same object is detected as two different classes,
    the higher-confidence prediction takes over and the lower-confidence
    overlapping prediction is removed.

    This is NOT the same as raising the confidence threshold.
    Low-confidence boxes are only removed when they overlap strongly
    with a higher-confidence box.
    """

    if (
        detections is None
        or detections.class_id is None
        or detections.confidence is None
        or len(detections) == 0
    ):
        return detections

    boxes = detections.xyxy.astype(np.float32)
    scores = detections.confidence.astype(np.float32)

    order = np.argsort(scores)[::-1]
    keep_indices = []

    while len(order) > 0:
        current_index = order[0]
        keep_indices.append(current_index)

        if len(order) == 1:
            break

        remaining_indices = order[1:]
        ious = compute_iou_xyxy(
            boxes[current_index],
            boxes[remaining_indices]
        )

        # Keep only boxes that do not strongly overlap with
        # the already accepted higher-confidence box.
        order = remaining_indices[ious < iou_threshold]

    return sv.Detections(
        xyxy=detections.xyxy[keep_indices],
        confidence=detections.confidence[keep_indices],
        class_id=detections.class_id[keep_indices],
    )


def run_sahi(pil_image: Image.Image, image_path: str):
    """
    Tile-first-then-zoom detection.

    This does NOT zoom the whole image.
    Instead:
    1. SAHI slices the original image.
    2. Each tile is zoomed inside RFDETRDetectionModel.perform_inference().
    3. Boxes are scaled back to original tile size.
    4. SAHI merges detections back into the original full image.
    """

    adaptive_conf = get_threshold_with_retry(pil_image)
    detection_model.confidence_threshold = adaptive_conf

    w, h = pil_image.size
    long_edge = max(w, h)

    def annotate(pil_img, dets):
        frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        labels = []

        if dets.class_id is not None and len(dets.class_id) > 0:
            for i, c in enumerate(dets.class_id):
                class_name = CLASS_NAMES.get(int(c), f"Unknown_{c}")

                if dets.confidence is not None:
                    conf = float(dets.confidence[i]) * 100
                    labels.append(f"{class_name} {conf:.1f}%")
                else:
                    labels.append(class_name)

        box_annotator = sv.BoxAnnotator()
        label_annotator = sv.LabelAnnotator()

        ann = box_annotator.annotate(
            scene=frame.copy(),
            detections=dets
        )

        ann = label_annotator.annotate(
            scene=ann,
            detections=dets,
            labels=labels
        )

        return ann

    # Always use SAHI because your goal is tile-first-then-zoom.
    if long_edge < 800:
        slice_passes = [
            dict(
                slice_height=384,
                slice_width=384,
                overlap_height_ratio=0.25,
                overlap_width_ratio=0.25
            ),
        ]

    elif long_edge <= 1280:
        slice_passes = [
            dict(
                slice_height=512,
                slice_width=512,
                overlap_height_ratio=0.25,
                overlap_width_ratio=0.25
            ),
            dict(
                slice_height=384,
                slice_width=384,
                overlap_height_ratio=0.25,
                overlap_width_ratio=0.25
            ),
        ]

    else:
        slice_passes = [
            dict(
                slice_height=640,
                slice_width=640,
                overlap_height_ratio=0.20,
                overlap_width_ratio=0.20
            ),
            dict(
                slice_height=384,
                slice_width=384,
                overlap_height_ratio=0.25,
                overlap_width_ratio=0.25
            ),
            dict(
                slice_height=256,
                slice_width=256,
                overlap_height_ratio=0.30,
                overlap_width_ratio=0.30
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

            all_xyxy.append([
                bbox.minx,
                bbox.miny,
                bbox.maxx,
                bbox.maxy
            ])

            all_conf.append(obj.score.value)
            all_cls.append(int(obj.category.id))

    if all_xyxy:
        raw = sv.Detections(
            xyxy=np.array(all_xyxy, dtype=np.float32),
            confidence=np.array(all_conf, dtype=np.float32),
            class_id=np.array(all_cls, dtype=int),
        )

        # Final cleanup for overlapping predictions.
        # This is class-agnostic, so if the same object is detected
        # as two different classes, the higher-confidence detection wins.
        detections = class_agnostic_highest_confidence_nms(
            raw,
            iou_threshold=0.45
        )

    else:
        detections = sv.Detections.empty()

    return detections, annotate(pil_image, detections), adaptive_conf


def build_summary(crystal_counts: dict) -> list:
    """
    Builds the summary list from a crystal_counts dict.
    Each entry contains the crystal type, its count, and the resolved
    risk level string (e.g. "Low", "Moderate", "High", or "Unknown").
    """
    return [
        {
            "crystalType": crystal_type,
            "count": count,
            "risk": get_risk_level(crystal_type, count),
        }
        for crystal_type, count in crystal_counts.items()
    ]


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "message": "CrystalScope model API is running!"
    })


# -------------------------------------------------------------------------
# MOBILE CAPTURE ROUTES
# -------------------------------------------------------------------------

@app.route("/create-capture-session", methods=["POST"])
def create_capture_session():
    """
    Desktop calls this after selecting/adding a patient.
    It creates a temporary session that the mobile app will use when uploading.
    """

    data = request.get_json(silent=True) or {}

    patient_id = data.get("patientId")
    patient_name = data.get("patientName", "")
    age = data.get("age", "")
    sex = data.get("sex", "")

    if not patient_id:
        patient_id = f"TEMP-{uuid.uuid4().hex[:8]}"

    session_id = str(uuid.uuid4())

    capture_sessions[session_id] = {
        "session_id": session_id,
        "patient_id": patient_id,
        "patient_name": patient_name,
        "age": age,
        "sex": sex,
        "status": "waiting",
        "image_filename": None,
        "image_url": None,
        "created_at": datetime.now().isoformat(),
        "uploaded_at": None,
    }

    base_url = get_server_base_url()

    return jsonify({
        "success": True,
        "message": "Capture session created.",
        "sessionId": session_id,
        "patientId": patient_id,
        "captureUploadEndpoint": f"{base_url}/upload-capture",
        "checkEndpoint": f"{base_url}/check-capture/{session_id}",
        "session": capture_sessions[session_id],
    }), 200


@app.route("/upload-capture", methods=["POST"])
def upload_capture():
    """
    Mobile calls this after capturing an image.
    This only uploads the captured image. It does NOT analyze yet.
    Desktop will analyze later.
    """

    session_id = request.form.get("sessionId")

    if not session_id:
        return jsonify({
            "success": False,
            "error": "No sessionId provided."
        }), 400

    if session_id not in capture_sessions:
        return jsonify({
            "success": False,
            "error": "Invalid or expired capture session."
        }), 404

    if "image" not in request.files:
        return jsonify({
            "success": False,
            "error": "No image provided."
        }), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({
            "success": False,
            "error": "No image selected."
        }), 400

    try:
        filename = f"capture_{session_id}_{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        pil_image = Image.open(file.stream).convert("RGB")
        pil_image.save(filepath, "JPEG", quality=92)

        image_url = f"{get_server_base_url()}/image/{filename}"

        capture_sessions[session_id]["status"] = "uploaded"
        capture_sessions[session_id]["image_filename"] = filename
        capture_sessions[session_id]["image_url"] = image_url
        capture_sessions[session_id]["uploaded_at"] = datetime.now().isoformat()

        return jsonify({
            "success": True,
            "message": "Image uploaded successfully.",
            "sessionId": session_id,
            "imageUrl": image_url,
            "session": capture_sessions[session_id],
        }), 200

    except Exception as e:
        print(f"[UPLOAD CAPTURE ERROR] {str(e)}")

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/check-capture/<session_id>", methods=["GET"])
def check_capture(session_id):
    """
    Desktop polls this endpoint to know if the mobile image has arrived.
    """

    session = capture_sessions.get(session_id)

    if not session:
        return jsonify({
            "success": False,
            "error": "Capture session not found."
        }), 404

    return jsonify({
        "success": True,
        "session": session,
        "status": session["status"],
        "imageUrl": session.get("image_url"),
    }), 200


@app.route("/analyze-captured/<session_id>", methods=["POST"])
def analyze_captured(session_id):
    """
    Desktop can call this to analyze the image uploaded by mobile.
    """

    session = capture_sessions.get(session_id)

    if not session:
        return jsonify({
            "success": False,
            "error": "Capture session not found."
        }), 404

    image_filename = session.get("image_filename")

    if not image_filename:
        return jsonify({
            "success": False,
            "error": "No uploaded image found for this session."
        }), 400

    filepath = os.path.join(UPLOAD_FOLDER, image_filename)

    if not os.path.exists(filepath):
        return jsonify({
            "success": False,
            "error": "Captured image file does not exist."
        }), 404

    raw_filename = f"raw_{uuid.uuid4()}.jpg"
    raw_path = os.path.join(UPLOAD_FOLDER, raw_filename)

    try:
        pil_image = Image.open(filepath).convert("RGB")

        rejection_response = reject_if_not_microscope_image(pil_image)
        if rejection_response is not None:
            return rejection_response

        pil_image.save(raw_path, "JPEG", quality=92)

        detections, annotated_frame, used_threshold = run_sahi(
            pil_image,
            filepath
        )

        annotated_filename = f"annotated_{uuid.uuid4()}.jpg"
        annotated_path = os.path.join(UPLOAD_FOLDER, annotated_filename)

        cv2.imwrite(
            annotated_path,
            annotated_frame,
            [cv2.IMWRITE_JPEG_QUALITY, 92]
        )

        raw_image_b64 = encode_image_to_base64(raw_path)

        crystal_counts = {}
        detection_list = []

        if detections.class_id is not None and len(detections.class_id) > 0:
            for i in range(len(detections)):
                class_id = int(detections.class_id[i])

                confidence = (
                    float(detections.confidence[i])
                    if detections.confidence is not None
                    else 0.0
                )

                class_name = CLASS_NAMES.get(class_id, f"Unknown_{class_id}")
                bbox = detections.xyxy[i].tolist()

                crystal_counts[class_name] = crystal_counts.get(class_name, 0) + 1

                detection_list.append({
                    "crystalType": class_name,
                    "confidence": round(confidence * 100, 2),
                    "bbox": bbox,
                })

        # FIX: was passing the raw RISK_MAP dict instead of the resolved level string
        summary = build_summary(crystal_counts)

        annotated_image_url = f"{get_server_base_url()}/image/{annotated_filename}"

        session["status"] = "analyzed"
        session["analysis"] = {
            "summary": summary,
            "detections": detection_list,
            "total": len(detection_list),
            "annotatedImage": annotated_image_url,
            "thresholdUsed": used_threshold,
        }

        return jsonify({
            "success": True,
            "message": "Captured image analyzed successfully.",
            "patientId": session.get("patient_id"),
            "sessionId": session_id,
            "summary": summary,
            "detections": detection_list,
            "total": len(detection_list),
            "annotatedImage": annotated_image_url,
            "rawImage": raw_image_b64,
            "thresholdUsed": used_threshold,
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        if os.path.exists(raw_path):
            os.remove(raw_path)


# -------------------------------------------------------------------------
# EXISTING ANALYZE ROUTE
# -------------------------------------------------------------------------

@app.route("/analyze", methods=["POST"])
def analyze():
    if "image" not in request.files:
        return jsonify({
            "error": "No image provided"
        }), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({
            "error": "No image selected"
        }), 400

    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    raw_filename = f"raw_{uuid.uuid4()}.jpg"
    raw_path = os.path.join(UPLOAD_FOLDER, raw_filename)

    try:
        pil_image = Image.open(filepath).convert("RGB")

        rejection_response = reject_if_not_microscope_image(pil_image)
        if rejection_response is not None:
            return rejection_response

        pil_image.save(raw_path, "JPEG", quality=92)

        detections, annotated_frame, used_threshold = run_sahi(
            pil_image,
            filepath
        )

        annotated_filename = f"annotated_{uuid.uuid4()}.jpg"
        annotated_path = os.path.join(UPLOAD_FOLDER, annotated_filename)

        cv2.imwrite(
            annotated_path,
            annotated_frame,
            [cv2.IMWRITE_JPEG_QUALITY, 92]
        )

        raw_image_b64 = encode_image_to_base64(raw_path)

        crystal_counts = {}
        detection_list = []

        if detections.class_id is not None and len(detections.class_id) > 0:
            for i in range(len(detections)):
                class_id = int(detections.class_id[i])

                confidence = (
                    float(detections.confidence[i])
                    if detections.confidence is not None
                    else 0.0
                )

                class_name = CLASS_NAMES.get(class_id, f"Unknown_{class_id}")
                bbox = detections.xyxy[i].tolist()

                crystal_counts[class_name] = crystal_counts.get(class_name, 0) + 1

                detection_list.append({
                    "crystalType": class_name,
                    "confidence": round(confidence * 100, 2),
                    "bbox": bbox,
                })

        # FIX: was passing the raw RISK_MAP dict instead of the resolved level string
        summary = build_summary(crystal_counts)

        return jsonify({
            "success": True,
            "summary": summary,
            "detections": detection_list,
            "total": len(detection_list),
            "annotatedImage": f"{get_server_base_url()}/image/{annotated_filename}",
            "rawImage": raw_image_b64,
            "thresholdUsed": used_threshold,
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

        if os.path.exists(raw_path):
            os.remove(raw_path)


@app.route("/image/<filename>", methods=["GET"])
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=False,
        use_reloader=False
    )
