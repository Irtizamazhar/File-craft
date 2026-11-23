"""FileCraft background-removal service.

Runs BiRefNet (general, 1024x1024, MIT license) with ONNX Runtime and returns a soft alpha
matte as an 8-bit grayscale PNG at the original image resolution.

Privacy: uploaded images are decoded and processed in memory only. Nothing is written to
disk, logged or kept after the response is sent.
"""
from __future__ import annotations

import asyncio
import io
import os
import time
from contextlib import asynccontextmanager

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.concurrency import run_in_threadpool
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.environ.get("MODEL_PATH", os.path.join(HERE, "models", "birefnet-general.onnx"))
MODEL_NAME = os.environ.get("MODEL_NAME", "BiRefNet general 1024")
MAX_UPLOAD_BYTES = int(os.environ.get("MAX_UPLOAD_BYTES", str(15 * 1024 * 1024)))
MAX_PIXELS = int(os.environ.get("MAX_PIXELS", str(25_000_000)))
MAX_CONCURRENCY = max(1, int(os.environ.get("MAX_CONCURRENCY", "1")))
SERVICE_TOKEN = os.environ.get("SERVICE_TOKEN", "")
ORT_THREADS = int(os.environ.get("ORT_THREADS", "0"))
# ONNX Runtime's CPU memory arena keeps (and grows) its buffers between requests; with BiRefNet at
# 1024 px that reached ~10 GB of committed memory. Off by default so memory is returned after each image.
ORT_CPU_ARENA = os.environ.get("ORT_CPU_ARENA", "0") == "1"

INPUT_SIZE = 1024
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
# Letterbox padding uses the ImageNet mean colour, which normalises to zero (a neutral, "empty" input).
PAD_RGB = (124, 116, 104)
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

Image.MAX_IMAGE_PIXELS = MAX_PIXELS
state: dict = {}


def create_session() -> ort.InferenceSession:
    available = ort.get_available_providers()
    providers = [p for p in ("CUDAExecutionProvider", "CPUExecutionProvider") if p in available]
    if "CUDAExecutionProvider" in providers and hasattr(ort, "preload_dlls"):
        try:
            ort.preload_dlls()  # CUDA/cuDNN wheels installed via onnxruntime-gpu[cuda,cudnn]
        except Exception:  # noqa: BLE001 - fall back to whatever the system provides
            pass
    options = ort.SessionOptions()
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    options.enable_cpu_mem_arena = ORT_CPU_ARENA
    options.enable_mem_pattern = ORT_CPU_ARENA
    if ORT_THREADS > 0:
        options.intra_op_num_threads = ORT_THREADS
    return ort.InferenceSession(MODEL_PATH, sess_options=options, providers=providers)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not os.path.isfile(MODEL_PATH):
        raise RuntimeError(f"Model not found at {MODEL_PATH}. Run: python download_model.py")
    session = create_session()
    state["session"] = session
    state["input"] = session.get_inputs()[0].name
    state["device"] = "cuda" if "CUDAExecutionProvider" in session.get_providers() else "cpu"
    state["gate"] = asyncio.Semaphore(MAX_CONCURRENCY)
    yield
    state.clear()


app = FastAPI(title="FileCraft background removal", docs_url=None, redoc_url=None, lifespan=lifespan)


def check_token(request: Request) -> None:
    if SERVICE_TOKEN and request.headers.get("authorization") != f"Bearer {SERVICE_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")


async def read_limited(request: Request) -> bytes:
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large")
    chunks, size = [], 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Image is too large")
        chunks.append(chunk)
    if not size:
        raise HTTPException(status_code=400, detail="Empty upload")
    return b"".join(chunks)


def decode(data: bytes) -> Image.Image:
    try:
        image = Image.open(io.BytesIO(data))
        fmt = image.format
        if fmt not in ALLOWED_FORMATS:
            raise HTTPException(status_code=415, detail="Upload a JPG, PNG or WebP image")
        if image.width * image.height > MAX_PIXELS:
            raise HTTPException(status_code=413, detail="Image has too many pixels")
        image.load()
    except HTTPException:
        raise
    except Image.DecompressionBombError as error:
        raise HTTPException(status_code=413, detail="Image has too many pixels") from error
    except Exception as error:  # noqa: BLE001 - corrupt or unsupported data
        raise HTTPException(status_code=415, detail="Unsupported or corrupt image") from error
    image = ImageOps.exif_transpose(image)
    if image.width < 8 or image.height < 8:
        raise HTTPException(status_code=422, detail="Image is too small")
    if image.mode in ("RGBA", "LA", "PA") or (image.mode == "P" and "transparency" in image.info):
        rgba = image.convert("RGBA")
        flat = Image.new("RGB", rgba.size, PAD_RGB)
        flat.paste(rgba, mask=rgba.getchannel("A"))
        return flat
    return image.convert("RGB")


def matte(image: Image.Image) -> tuple[bytes, int]:
    """Letterbox to 1024 (no squashing), run BiRefNet, crop the padding, resize to the original size."""
    width, height = image.size
    scale = INPUT_SIZE / max(width, height)
    new_w, new_h = max(1, round(width * scale)), max(1, round(height * scale))
    off_x, off_y = (INPUT_SIZE - new_w) // 2, (INPUT_SIZE - new_h) // 2
    canvas = Image.new("RGB", (INPUT_SIZE, INPUT_SIZE), PAD_RGB)
    canvas.paste(image.resize((new_w, new_h), Image.Resampling.BILINEAR), (off_x, off_y))
    tensor = ((np.asarray(canvas, dtype=np.float32) / 255.0 - MEAN) / STD).transpose(2, 0, 1)[None]
    started = time.perf_counter()
    outputs = state["session"].run(None, {state["input"]: np.ascontiguousarray(tensor)})
    inference_ms = round((time.perf_counter() - started) * 1000)
    logits = outputs[-1][0, 0].astype(np.float32)  # last output = finest-scale prediction
    probability = 1.0 / (1.0 + np.exp(-logits))
    crop = probability[off_y:off_y + new_h, off_x:off_x + new_w]
    full = Image.fromarray(np.ascontiguousarray(crop), mode="F").resize((width, height), Image.Resampling.BILINEAR)
    alpha = np.clip(np.asarray(full) * 255.0 + 0.5, 0, 255).astype(np.uint8)
    buffer = io.BytesIO()
    Image.fromarray(alpha, mode="L").save(buffer, format="PNG", compress_level=6)
    return buffer.getvalue(), inference_ms


@app.get("/health")
def health(request: Request) -> dict:
    check_token(request)
    return {"status": "ok", "model": MODEL_NAME, "device": state.get("device", "cpu"), "inputSize": INPUT_SIZE}


@app.post("/v1/matte")
async def create_matte(request: Request) -> Response:
    check_token(request)
    data = await read_limited(request)
    image = decode(data)
    del data
    async with state["gate"]:
        png, inference_ms = await run_in_threadpool(matte, image)
    del image
    return Response(
        content=png,
        media_type="image/png",
        headers={
            "Cache-Control": "no-store",
            "X-Model": MODEL_NAME,
            "X-Device": state["device"],
            "X-Inference-Ms": str(inference_ms),
        },
    )
