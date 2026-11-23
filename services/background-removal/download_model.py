"""Download the pinned BiRefNet general ONNX model (MIT) and verify its SHA-256.

Source: https://huggingface.co/onnx-community/BiRefNet-ONNX (export of ZhengPeng7/BiRefNet, MIT license).
"""
import hashlib
import os
import sys
import urllib.request

REVISION = "534d3c82d3bb8b2f0867db6dfbc3a525b8e42f67"
URL = f"https://huggingface.co/onnx-community/BiRefNet-ONNX/resolve/{REVISION}/onnx/model.onnx"
SHA256 = "58f621f00f5d756097615970a88a791584600dcf7c45b18a0a6267535a1ebd3c"
SIZE = 972_666_916
TARGET = os.environ.get("MODEL_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "birefnet-general.onnx"))


def sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    if os.path.isfile(TARGET) and os.path.getsize(TARGET) == SIZE and sha256(TARGET) == SHA256:
        print(f"Model already present and verified: {TARGET}")
        return 0
    os.makedirs(os.path.dirname(TARGET), exist_ok=True)
    partial = TARGET + ".part"
    print(f"Downloading BiRefNet general (~{SIZE // 1_000_000} MB) ...")
    with urllib.request.urlopen(URL, timeout=60) as response, open(partial, "wb") as out:
        done = 0
        while block := response.read(1 << 20):
            out.write(block)
            done += len(block)
            print(f"\r{done * 100 // SIZE:3d}%", end="", flush=True)
    print()
    if os.path.getsize(partial) != SIZE or sha256(partial) != SHA256:
        os.remove(partial)
        print("Checksum mismatch; download discarded.", file=sys.stderr)
        return 1
    os.replace(partial, TARGET)
    print(f"Model verified and saved to {TARGET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
