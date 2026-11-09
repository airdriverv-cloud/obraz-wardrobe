#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Download clothing photos from a public dataset and normalise them for the demo.

Source: alexeygrigorev/clothing-dataset-small (GitHub, product photos).
Each photo is white-balanced so the backdrop turns white, then centred on a
square white canvas. Such images look like a clean catalogue grid and can be
blended onto a body photo with CSS `mix-blend-mode: multiply` (white disappears).
"""

import json
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance

API = "https://api.github.com/repos/alexeygrigorev/clothing-dataset-small/contents/test/{cat}?ref=master"
RAW = "https://raw.githubusercontent.com/alexeygrigorev/clothing-dataset-small/master/test/{cat}/{name}"

ROOT = Path(__file__).resolve().parent.parent
OUT_IMG = ROOT / "site" / "assets" / "img" / "items"
OUT_JSON = ROOT / "site" / "assets" / "data" / "items.json"
TMP = ROOT / "tools" / "_tmp"

CATS = [
    ("outwear", 10),
    ("longsleeve", 10),
    ("shirt", 10),
    ("t-shirt", 10),
    ("pants", 10),
    ("skirt", 8),
    ("dress", 10),
    ("shorts", 7),
    ("shoes", 10),
    ("hat", 7),
]

PALETTE = [
    ("чёрный", "#1B1B1B"), ("графитовый", "#3A3C3E"), ("серый", "#9A9A96"),
    ("белый", "#F2EEE6"), ("кремовый", "#E6D8C1"), ("бежевый", "#D2BD9E"),
    ("коричневый", "#6B4E3A"), ("шоколадный", "#57402F"), ("рыжий", "#B5623A"),
    ("терракотовый", "#C8553D"), ("бордовый", "#6E2334"), ("красный", "#B3312C"),
    ("розовый", "#D9A6A6"), ("сиреневый", "#9C8AA8"), ("фиолетовый", "#5B3E6B"),
    ("синий", "#2C4A6E"), ("голубой", "#7EA3C4"), ("деним", "#5B7A99"),
    ("бирюзовый", "#3E7C7A"), ("зелёный", "#3E6B5A"), ("оливковый", "#6F7D5A"),
    ("хаки", "#8A8663"), ("горчичный", "#C99A34"), ("жёлтый", "#D9B23C"),
    ("оранжевый", "#D97A3A"),
]

CANVAS = 420


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def nearest_color(rgb):
    best, best_d = None, 1e9
    for name, h in PALETTE:
        pr, pg, pb = hex2rgb(h)
        d = (pr - rgb[0]) ** 2 * 0.3 + (pg - rgb[1]) ** 2 * 0.59 + (pb - rgb[2]) ** 2 * 0.11
        if d < best_d:
            best, best_d = (name, h), d
    return best


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "obraz-demo/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def whiten(img):
    """Scale channels so the median border colour becomes white."""
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    h, w, _ = arr.shape
    border = np.concatenate([arr[0, :, :], arr[-1, :, :], arr[:, 0, :], arr[:, -1, :]])
    bg = np.percentile(border, 75, axis=0)
    gain = 255.0 / np.clip(bg, 60, 255)
    out = np.clip(arr * gain, 0, 255)
    return Image.fromarray(out.astype(np.uint8), "RGB")


def square(img):
    """Crop to the garment and centre it on a white square canvas."""
    arr = np.asarray(img).astype(np.int16)
    # «не фон» = заметно отличается от белого
    diff = 255 - arr.min(axis=2)
    mask = diff > 18
    ys, xs = np.where(mask)
    if len(ys) < 500:
        inner = img
    else:
        y0, y1 = int(np.percentile(ys, 0.5)), int(np.percentile(ys, 99.5))
        x0, x1 = int(np.percentile(xs, 0.5)), int(np.percentile(xs, 99.5))
        y0, x0 = max(0, y0 - 4), max(0, x0 - 4)
        y1, x1 = min(img.height, y1 + 5), min(img.width, x1 + 5)
        inner = img.crop((x0, y0, x1, y1))

    pad = int(CANVAS * 0.07)
    box = CANVAS - 2 * pad
    k = min(box / inner.width, box / inner.height)
    inner = inner.resize((max(1, int(inner.width * k)), max(1, int(inner.height * k))), Image.LANCZOS)

    canvas = Image.new("RGB", (CANVAS, CANVAS), (255, 255, 255))
    canvas.paste(inner, ((CANVAS - inner.width) // 2, (CANVAS - inner.height) // 2))
    return canvas


def dominant_color(img):
    arr = np.asarray(img).astype(np.int16)
    px = arr.reshape(-1, 3)
    lum = px.mean(axis=1)
    keep = px[(lum < 232)]
    if len(keep) < 200:
        keep = px
    return tuple(np.median(keep, axis=0))


def main():
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)

    items = []
    for cat, limit in CATS:
        try:
            listing = json.loads(fetch(API.format(cat=cat)))
        except Exception as exc:  # noqa: BLE001
            print("listing failed", cat, exc)
            continue

        names = [f["name"] for f in listing if f["name"].lower().endswith((".jpg", ".jpeg", ".png"))]
        step = max(1, len(names) // max(1, limit))
        picked = names[::step][:limit]

        idx = 0
        for name in picked:
            try:
                raw = fetch(RAW.format(cat=cat, name=name))
                tmp = TMP / name
                tmp.write_bytes(raw)
                img = Image.open(tmp)
                img = whiten(img)
                img = ImageEnhance.Color(img).enhance(1.04)
                out = square(img)

                idx += 1
                fname = "%s-%02d.webp" % (cat, idx)
                out.save(OUT_IMG / fname, "WEBP", quality=84, method=6)

                rgb = dominant_color(out)
                cname, chex = nearest_color(rgb)
                items.append({
                    "id": "%s-%02d" % (cat, idx),
                    "src": "assets/img/items/" + fname,
                    "cat": cat,
                    "color": cname,
                    "hex": chex,
                    "rgb": [int(c) for c in rgb],
                })
            except Exception as exc:  # noqa: BLE001
                print("skip", cat, name, exc)

        print("%-11s -> %d" % (cat, idx))

    OUT_JSON.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
    print("items:", len(items))


if __name__ == "__main__":
    sys.exit(main())
