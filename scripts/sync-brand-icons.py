#!/usr/bin/env python3
"""kimito.link 系と同じ icon.png から Web/PWA/LP アイコンを一括生成。"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets/images/icon.png"
KIMITO_BLUE = (0, 66, 123, 255)


def save_resize(size: int, out: Path, bg=(0, 0, 0, 0)) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    img = Image.open(SOURCE).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), bg)
    img.thumbnail((size, size), Image.Resampling.LANCZOS)
    ox = (size - img.width) // 2
    oy = (size - img.height) // 2
    canvas.paste(img, (ox, oy), img)
    canvas.save(out, optimize=True)
    print(f"wrote {out.relative_to(ROOT)}")


def save_maskable(size: int, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    inner = int(size * 0.72)
    pad = (size - inner) // 2
    canvas = Image.new("RGBA", (size, size), KIMITO_BLUE)
    img = Image.open(SOURCE).convert("RGBA")
    img.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    ox = pad + (inner - img.width) // 2
    oy = pad + (inner - img.height) // 2
    canvas.paste(img, (ox, oy), img)
    canvas.save(out, optimize=True)
    print(f"wrote {out.relative_to(ROOT)}")


def save_android_foreground(out: Path) -> None:
    size = 432
    inner = 288
    pad = (size - inner) // 2
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    img = Image.open(SOURCE).convert("RGBA")
    img.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    ox = pad + (inner - img.width) // 2
    oy = pad + (inner - img.height) // 2
    canvas.paste(img, (ox, oy), img)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, optimize=True)
    print(f"wrote {out.relative_to(ROOT)}")


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"missing source: {SOURCE}")

    save_resize(48, ROOT / "assets/images/favicon.png")
    save_resize(200, ROOT / "assets/images/splash-icon.png")
    save_android_foreground(ROOT / "assets/images/android-icon-foreground.png")

    save_resize(48, ROOT / "public/favicon.png")
    save_resize(192, ROOT / "public/icon-192.png")
    save_resize(512, ROOT / "public/icon-512.png")
    save_maskable(512, ROOT / "public/icon-512-maskable.png")
    save_resize(180, ROOT / "public/apple-touch-icon.png")

    # PNG favicon.ico（モダンブラウザ対応）
    shutil.copy2(ROOT / "public/favicon.png", ROOT / "public/favicon.ico")

    lp = ROOT / "public/lp"
    lp.mkdir(parents=True, exist_ok=True)
    for name in ("favicon.ico", "icon-192.png", "apple-touch-icon.png"):
        src = ROOT / "public" / ("favicon.ico" if "favicon" in name else name.replace("lp/", ""))
        if name == "icon-192.png":
            src = ROOT / "public/icon-192.png"
        shutil.copy2(src, lp / name)
        print(f"copied lp/{name}")


if __name__ == "__main__":
    main()
