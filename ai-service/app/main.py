"""FastAPI service that performs one warm YOLOv8 inference per uploaded frame.

The model is initialised once in the application lifespan.  It is deliberately
not loaded inside a request handler: doing that is both slow and a common cause
of GPU/CPU memory leaks in long-running web services.
"""
from __future__ import annotations

import asyncio
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

EXPECTED_LABELS = {"cardboard", "glass", "metal", "paper", "plastic", "trash"}
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(4 * 1024 * 1024)))
CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.45"))
IMAGE_SIZE = int(os.getenv("YOLO_IMAGE_SIZE", "320"))


def configured_origins() -> list[str]:
    """Return explicit CORS origins; never use '*' for a production API."""
    configured = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:4173,https://recycle-rewards-2026.web.app",
    )
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


def model_path() -> Path:
    """Use MODEL_PATH first, then the repository's checked-in custom weights."""
    explicit = os.getenv("MODEL_PATH")
    if explicit:
        return Path(explicit)
    return Path(__file__).resolve().parents[2] / "RecycleRewards_BE" / "models" / "yolov8-based.pt"


def decode_image(payload: bytes) -> np.ndarray:
    """Safely decode an image upload to a BGR OpenCV image."""
    if not payload:
        raise HTTPException(status_code=400, detail="Ảnh tải lên đang trống.")
    if len(payload) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail=f"Ảnh vượt quá giới hạn {MAX_IMAGE_BYTES // 1024 // 1024} MB.")
    image = cv2.imdecode(np.frombuffer(payload, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=422, detail="Không thể giải mã ảnh. Hãy gửi JPEG hoặc PNG hợp lệ.")
    return image


def normalise_names(names: Any) -> dict[int, str]:
    """Ultralytics accepts either an index-keyed dict or a class-name list."""
    if isinstance(names, dict):
        return {int(index): str(label) for index, label in names.items()}
    return {index: str(label) for index, label in enumerate(names)}


@asynccontextmanager
async def lifespan(app: FastAPI):
    weights = model_path()
    if not weights.is_file():
        raise RuntimeError(
            f"Không tìm thấy weights YOLO tại {weights}. Đặt MODEL_PATH tới file .pt TrashNet đã huấn luyện."
        )

    # Kept on app.state so exactly one model lives for the worker process.
    model = YOLO(str(weights))
    names = normalise_names(model.names)
    app.state.model = model
    app.state.names = names
    app.state.inference_lock = asyncio.Lock()  # Ultralytics/PyTorch inference is not thread-safe.
    app.state.weights = str(weights)
    app.state.label_warning = sorted(set(names.values()) ^ EXPECTED_LABELS)
    yield
    # Drop references when the container/service stops. CUDA allocations are
    # released with the process; this also makes reloads predictable locally.
    app.state.model = None


app = FastAPI(
    title="RecycleRewards YOLO API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=600,
)


@app.get("/health")
async def health(request: Request) -> dict[str, Any]:
    """Readiness probe; label_warning helps spot the wrong .pt file at deploy time."""
    return {
        "ok": getattr(request.app.state, "model", None) is not None,
        "model": Path(request.app.state.weights).name,
        "labels": list(request.app.state.names.values()),
        "label_warning": request.app.state.label_warning,
    }


@app.post("/api/v1/detect")
async def detect(request: Request, file: UploadFile = File(...)) -> dict[str, Any]:
    """Detect TrashNet classes in multipart field `file` and return source-pixel boxes.

    `latency_ms` is included for operational monitoring. With warmed YOLOv8n at
    320px on GPU this is normally below 100 ms; CPU hardware cannot guarantee it.
    """
    if file.content_type not in {"image/jpeg", "image/jpg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.")
    payload = await file.read(MAX_IMAGE_BYTES + 1)
    image = decode_image(payload)
    started = time.perf_counter()

    # Serialising calls prevents concurrent browser frames from multiplying
    # PyTorch memory. The client also permits only one in-flight upload.
    try:
        # Refuse a congested request rather than retaining a queue of webcam
        # frames that can never be "real time". The browser retries on its next
        # 100 ms tick.
        await asyncio.wait_for(request.app.state.inference_lock.acquire(), timeout=0.05)
    except TimeoutError as exc:
        raise HTTPException(status_code=503, detail="Máy chủ AI đang xử lý frame trước đó, hãy thử lại.") from exc
    try:
        result = await asyncio.to_thread(
            request.app.state.model.predict,
            source=image,
            conf=CONFIDENCE,
            imgsz=IMAGE_SIZE,
            verbose=False,
        )
    finally:
        request.app.state.inference_lock.release()

    boxes: list[dict[str, Any]] = []
    first = result[0]
    if first.boxes is not None:
        for xyxy, confidence, class_id in zip(
            first.boxes.xyxy.cpu().tolist(),
            first.boxes.conf.cpu().tolist(),
            first.boxes.cls.cpu().tolist(),
        ):
            label = request.app.state.names.get(int(class_id), str(int(class_id)))
            boxes.append(
                {
                    "label": label,
                    "confidence": round(float(confidence), 4),
                    "box": [round(float(value), 1) for value in xyxy],
                }
            )

    boxes.sort(key=lambda item: item["confidence"], reverse=True)
    return {
        "detections": boxes,
        "image": {"width": int(image.shape[1]), "height": int(image.shape[0])},
        "latency_ms": round((time.perf_counter() - started) * 1000, 1),
    }
