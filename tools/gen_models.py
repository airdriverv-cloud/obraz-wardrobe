#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Generate photorealistic model photos through the local ComfyUI API."""

import io
import json
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image

API = "http://127.0.0.1:8188"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "assets" / "img" / "models"
CKPT = "realvisxl-v5.safetensors"

BASE_NEG = ("cropped, close-up portrait, face only, cut off feet, deformed, extra limbs, "
            "bad anatomy, text, watermark, logo, cartoon, illustration, painting, 3d render, "
            "low quality, blurry, busy background")

MODELS = [
    {
        "id": "mila",
        "prompt": ("full body fashion lookbook photograph of a young woman, 25 years old, long straight "
                   "dark brown hair, standing straight facing camera, arms relaxed, wearing a camel wool "
                   "coat over a cream turtleneck, black midi skirt, brown leather boots, plain warm beige "
                   "seamless studio backdrop, soft even lighting, professional editorial photo, full length "
                   "head to toe, sharp focus, 85mm lens"),
        "seed": 7412,
    },
    {
        "id": "nika",
        "prompt": ("full body fashion lookbook photograph of a young woman, 24 years old, dark hair in a "
                   "neat bun, standing straight facing camera, relaxed pose, wearing a beige trench coat over "
                   "a light blue shirt, straight blue jeans, white sneakers, plain light grey seamless studio "
                   "backdrop, soft even lighting, professional editorial photo, full length head to toe, "
                   "sharp focus, 85mm lens"),
        "seed": 1904,
    },
    {
        "id": "mark",
        "prompt": ("full body fashion lookbook photograph of a man, 30 years old, short dark hair, light "
                   "stubble, standing straight facing camera, arms relaxed, wearing a navy blue wool jacket "
                   "over a grey sweater, charcoal grey trousers, black leather boots, bright airy studio with "
                   "plain light warm beige seamless paper backdrop, soft even light, professional editorial "
                   "photo, entire body visible from head to shoes with space above head and below feet, "
                   "sharp focus, 85mm lens"),
        "seed": 3311,
    },
    {
        "id": "timur",
        "prompt": ("full body fashion lookbook photograph of a man, 28 years old, dark skin, short black "
                   "hair, standing straight facing camera, relaxed pose, wearing an olive green bomber jacket "
                   "over a white t-shirt, black jeans, white sneakers, bright airy studio with plain light "
                   "beige seamless paper backdrop, soft even light, professional editorial photo, entire body "
                   "visible from head to shoes with space above head and below feet, sharp focus, 85mm lens"),
        "seed": 5582,
    },
]


def workflow(prompt, seed, width=832, height=1216, steps=28, cfg=6.0):
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": BASE_NEG, "clip": ["1", 1]}},
        "4": {"class_type": "EmptyLatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "5": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "seed": seed, "steps": steps, "cfg": cfg,
            "sampler_name": "dpmpp_2m", "scheduler": "karras",
            "positive": ["2", 0], "negative": ["3", 0],
            "latent_image": ["4", 0], "denoise": 1.0}},
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"images": ["6", 0], "filename_prefix": "obraz_model"}},
    }


def post(path, payload):
    req = urllib.request.Request(
        API + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def wait(prompt_id, timeout=900):
    t0 = time.time()
    while time.time() - t0 < timeout:
        with urllib.request.urlopen(f"{API}/history/{prompt_id}", timeout=20) as r:
            hist = json.loads(r.read())
        if prompt_id in hist:
            return hist[prompt_id]
        time.sleep(3)
    raise TimeoutError("generation timed out")


def download(image_info):
    q = urllib.parse.urlencode({
        "filename": image_info["filename"],
        "subfolder": image_info.get("subfolder", ""),
        "type": image_info.get("type", "output"),
    })
    with urllib.request.urlopen(f"{API}/view?{q}", timeout=60) as r:
        return r.read()


def main():
    import urllib.parse  # noqa: F401  (нужен внутри download)
    OUT.mkdir(parents=True, exist_ok=True)
    only = sys.argv[1] if len(sys.argv) > 1 else None

    for m in MODELS:
        if only and m["id"] != only:
            continue
        t0 = time.time()
        res = post("/prompt", {"prompt": workflow(m["prompt"], m["seed"])})
        pid = res["prompt_id"]
        print(f"{m['id']}: queued {pid}", flush=True)
        hist = wait(pid)
        imgs = []
        for node in hist.get("outputs", {}).values():
            imgs.extend(node.get("images", []))
        if not imgs:
            print(f"{m['id']}: нет изображения", hist.get("status"))
            continue
        raw = download(imgs[0])
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        img.thumbnail((760, 1140))
        dest = OUT / (m["id"] + ".webp")
        img.save(dest, "WEBP", quality=88, method=6)
        print(f"{m['id']}: ok {img.size} за {time.time() - t0:.0f}s -> {dest.name}", flush=True)


if __name__ == "__main__":
    import urllib.parse
    main()
