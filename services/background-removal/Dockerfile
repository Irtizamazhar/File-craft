# FileCraft background-removal service (BiRefNet general 1024, MIT) — CPU image.
# Build:  docker build -t filecraft-bg services/background-removal
# Run:    docker run --rm -p 8000:8000 -e SERVICE_TOKEN=change-me filecraft-bg
# GPU:    docker build --build-arg REQUIREMENTS=requirements-gpu.txt -t filecraft-bg-gpu services/background-removal
#         docker run --rm --gpus all -p 8000:8000 filecraft-bg-gpu   (needs the NVIDIA Container Toolkit on the host)
FROM python:3.12-slim

ARG REQUIREMENTS=requirements.txt
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 MODEL_PATH=/app/models/birefnet-general.onnx

WORKDIR /app
COPY requirements.txt requirements-gpu.txt ./
RUN pip install --no-cache-dir -r ${REQUIREMENTS}

COPY download_model.py ./
# Bake the pinned, checksum-verified model into the image so containers start without a download.
RUN python download_model.py

COPY app.py ./
COPY licenses ./licenses

RUN useradd --create-home --uid 10001 service && chown -R service /app
USER service

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s CMD python -c "import os,urllib.request;r=urllib.request.Request('http://127.0.0.1:8000/health',headers={'Authorization':'Bearer '+os.environ.get('SERVICE_TOKEN','')});urllib.request.urlopen(r,timeout=4)"
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
