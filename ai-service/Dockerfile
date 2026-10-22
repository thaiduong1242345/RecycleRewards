# CPU image. For a GPU EC2 instance, use an NVIDIA CUDA PyTorch base image and
# run docker with the NVIDIA container runtime.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    MODEL_PATH=/app/models/yolov8-based.pt

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
COPY ai-service/requirements.txt ./requirements.txt
# The default PyPI Torch package may pull CUDA/NVIDIA libraries (several GB).
# This EC2 deployment is CPU-only, so install the substantially smaller CPU
# wheels first. Ultralytics then reuses this compatible Torch installation.
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
      torch==2.5.1 torchvision==0.20.1 \
    && pip install --no-cache-dir -r requirements.txt
COPY ai-service/app ./app
COPY RecycleRewards_BE/models/yolov8-based.pt /app/models/yolov8-based.pt

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
