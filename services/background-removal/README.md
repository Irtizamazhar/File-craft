# FileCraft background-removal service

A small FastAPI service that runs **BiRefNet general** (1024×1024, MIT license) with ONNX Runtime and
returns a soft alpha matte. The Next.js app calls it through `app/api/remove-background/route.ts`; the
browser falls back to the in-browser BiRefNet Lite model when the service is not configured or not reachable.

- Model: [`onnx-community/BiRefNet-ONNX`](https://huggingface.co/onnx-community/BiRefNet-ONNX) at revision
  `534d3c82d3bb8b2f0867db6dfbc3a525b8e42f67`, an ONNX export of
  [ZhengPeng7/BiRefNet](https://github.com/ZhengPeng7/BiRefNet) — **MIT** (`licenses/BiRefNet-MIT.txt`).
  973 MB, SHA-256 `58f621f00f5d756097615970a88a791584600dcf7c45b18a0a6267535a1ebd3c` (checked by `download_model.py`).
- Python packages: FastAPI (MIT), Uvicorn (BSD-3), ONNX Runtime (MIT), NumPy (BSD-3), Pillow (MIT-CMU).
- Privacy: images are decoded and processed in memory only. Nothing is written to disk, logged or kept.

## API

| Method | Path | Notes |
|---|---|---|
| `GET` | `/health` | `{"status":"ok","model":"BiRefNet general 1024","device":"cpu"\|"cuda","inputSize":1024}` |
| `POST` | `/v1/matte` | Body: raw JPG/PNG/WebP bytes with a matching `Content-Type`. Returns an 8-bit grayscale PNG matte at the **original resolution** (255 = foreground). Headers `X-Model`, `X-Device`, `X-Inference-Ms`. |

Both require `Authorization: Bearer <SERVICE_TOKEN>` when `SERVICE_TOKEN` is set.
Errors: 401 (token), 413 (over 15 MB or 25 MP), 415 (not JPG/PNG/WebP or corrupt), 422 (too small).

Processing: EXIF orientation applied → transparent pixels flattened on the ImageNet mean colour →
**letterboxed** to 1024×1024 (aspect ratio kept, no squashing) → ImageNet normalisation → BiRefNet →
sigmoid → padding cropped → bilinear resize to the original size. Edge refinement, stray-blob cleanup and
colour decontamination happen in the browser worker (`lib/advanced/matte.ts`) for both engines.

## Run locally (Windows, macOS, Linux)

Requires Python 3.10+ and about 4 GB of free RAM.

```bash
cd services/background-removal
python -m venv .venv
# Windows: .venv\Scripts\activate     macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python download_model.py                       # ~973 MB, verified by SHA-256
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Then add to the Next.js `.env.local` and restart `npm run dev`:

```
BG_REMOVAL_SERVICE_URL=http://127.0.0.1:8000
```

The status line under the editor shows which engine was used ("BiRefNet 1024 on the FileCraft server" or
"BiRefNet Lite 512 in your browser; fallback because …").

## Run with Docker

```bash
docker build -t filecraft-bg services/background-removal
docker run -d --restart unless-stopped -p 127.0.0.1:8000:8000 -e SERVICE_TOKEN=<long-random-secret> filecraft-bg
```

GPU (NVIDIA, needs the NVIDIA Container Toolkit on the host):

```bash
docker build --build-arg REQUIREMENTS=requirements-gpu.txt -t filecraft-bg-gpu services/background-removal
docker run -d --gpus all -p 127.0.0.1:8000:8000 -e SERVICE_TOKEN=<secret> filecraft-bg-gpu
```

`/health` reports `"device":"cuda"` when the GPU is used. The GPU image was not tested on the development
machine (no NVIDIA GPU there).

## Production

- Run the service on a host with **at least 4 GB RAM free for it** (8 GB+ recommended); a GPU host is strongly
  recommended for real traffic (see timings below). Typical shared Node.js hosting cannot run it.
- Keep it private: bind to localhost or a private network, set `SERVICE_TOKEN`, and only expose the Next.js app.
- Next.js environment (server-side only, never `NEXT_PUBLIC_`):
  - `BG_REMOVAL_SERVICE_URL` — e.g. `http://127.0.0.1:8000` or the private URL of the container.
  - `BG_REMOVAL_SERVICE_TOKEN` — same value as the service's `SERVICE_TOKEN`.
  - `BG_REMOVAL_TIMEOUT_MS` — optional, default 180000.
- Service environment: `SERVICE_TOKEN`, `MAX_CONCURRENCY` (default 1 image at a time; raise only with
  enough RAM/GPU memory), `ORT_THREADS` (CPU threads, default = physical cores), `MAX_UPLOAD_BYTES`
  (default 15 MB), `MAX_PIXELS` (default 25 MP), `MODEL_PATH`.

## Measured speed

Measured on the development laptop (Intel i5-10400H, CPU only, `ORT_CPU_ARENA` off, other apps open), on the
images in `tests/fixtures/quality` (about 1200 px on the long side):

| Step | Time per image |
| --- | --- |
| Server model, BiRefNet general 1024 (CPU) | 54–105 s |
| Browser fallback, BiRefNet Lite 512 | 10–26 s |
| Edge refinement and colour clean-up in the browser | 0.4–2.7 s |

Service memory: about 1.4 GB idle and 7.1 GB at peak while one image is processed. A GPU host was not measured;
use one for real traffic, because CPU-only speed is too slow for many users at once.
