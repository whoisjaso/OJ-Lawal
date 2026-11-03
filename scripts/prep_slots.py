#!/usr/bin/env python3
"""Clean-grade original photos into named site slots (placeholders until AI images arrive,
or the permanent choice when the client prefers the original).

Usage:
  python prep_slots.py slots.json <originals-dir> <slots-dir> [--only SLOT]

slots.json example:
  {"hero-pastors": {"src": "IMG_3164.jpg", "ratio": "16:9", "focus_y": 0.35, "widths": [1280, 2400]},
   "ed-sanctuary": {"src": "sanctuary.jpg", "ratio": "4:5", "focus_y": 0.5, "widths": [800, 1400]},
   "band-group":   {"src": "group.jpg", "ratio": "2:1", "focus_y": 0.0, "widths": [1280, 2400]}}
focus_y: 0 keeps the top (heads), 1 keeps the bottom. focus_x likewise for portrait crops.
Writes <slot>-<width>.webp plus a .json provenance sidecar per file.
"""
import json, sys, datetime
from pathlib import Path
from PIL import Image, ImageEnhance
import numpy as np


def clean(im):
    im = ImageEnhance.Contrast(im.convert("RGB")).enhance(1.06)
    im = ImageEnhance.Color(im).enhance(1.04)
    a = np.asarray(im).astype(np.float32)
    a[..., 0] *= 1.02; a[..., 2] *= 0.97          # a breath of warmth, never a filter look
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def crop(im, ratio, fx=0.5, fy=0.5):
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio); x = int((w - nw) * fx); return im.crop((x, 0, x + nw, h))
    nh = int(w / ratio); y = int((h - nh) * fy); return im.crop((0, y, w, y + nh))


def main():
    spec = json.loads(Path(sys.argv[1]).read_text())
    src_dir, out_dir = Path(sys.argv[2]), Path(sys.argv[3])
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    out_dir.mkdir(parents=True, exist_ok=True)
    for slot, s in spec.items():
        if only and slot != only:
            continue
        a, b = (float(x) for x in s.get("ratio", "16:9").split(":"))
        im = clean(crop(Image.open(src_dir / s["src"]), a / b, s.get("focus_x", 0.5), s.get("focus_y", 0.5)))
        for w in s.get("widths", [1280, 2400]):
            r = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            f = out_dir / f"{slot}-{w}.webp"
            r.save(f, "WEBP", quality=86, method=6)
            Path(str(f) + ".json").write_text(json.dumps({"prompt": f"Sourced: client's own photo {s['src']}, cropped {s.get('ratio')} and clean-graded. Not AI generated.", "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}, indent=2))
            print("wrote", f, r.size)


if __name__ == "__main__":
    main()
