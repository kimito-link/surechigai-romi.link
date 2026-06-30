#!/usr/bin/env python3
"""
ブランドアイコン一括生成。
- タブ favicon（16–48px）: kimito-link 公式ゆっくりりんく + すれ違い電波
- PWA / ホーム画面（192px+）: りんくキャラ（icon.png）— App Store と同じ

ゆっくり素材元: kimito-link/src/images/yukkuri-charactore-english/link/
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
YUKKURI_LINK = ROOT / "assets/images/yukkuri/link/link-yukkuri-normal-mouth-closed.png"
APP_ICON_SOURCE = ROOT / "assets/images/icon.png"
KIMITO_BLUE = (0, 66, 123, 255)
STREETPASS_CYAN = (34, 211, 238, 200)
STREETPASS_MAGENTA = (236, 72, 153, 200)


def compose_tab_favicon(size: int) -> Image.Image:
    """ネイビー丸地 + すれ違い電波 + ゆっくりりんく（kimito-link 公式素材）。"""
    canvas = Image.new("RGBA", (size, size), KIMITO_BLUE)
    draw = ImageDraw.Draw(canvas)
    stroke = max(1, size // 24)

    # すれ違い通信っぽい交差電波（DS ストリートパス風）
    cx, cy = size // 2, int(size * 0.58)
    for i, (color, side) in enumerate(
        (
            (STREETPASS_CYAN, -1),
            (STREETPASS_MAGENTA, 1),
            (STREETPASS_CYAN, -1),
        )
    ):
        r = int(size * (0.34 + i * 0.07))
        box = [cx + side * r // 3 - r, cy - r, cx + side * r // 3 + r, cy + r]
        draw.arc(box, start=210 if side < 0 else 330, end=330 if side < 0 else 30, fill=color, width=stroke)

    char = Image.open(YUKKURI_LINK).convert("RGBA")
    target = int(size * 0.9)
    char.thumbnail((target, target), Image.Resampling.LANCZOS)
    ox = (size - char.width) // 2
    oy = (size - char.height) // 2 + int(size * 0.03)
    canvas.paste(char, (ox, oy), char)
    return canvas


def save_tab_favicon(size: int, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    compose_tab_favicon(size).save(out, optimize=True)
    print(f"wrote {out.relative_to(ROOT)}")


def save_resize(source: Path, size: int, out: Path, bg=(0, 0, 0, 0)) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    img = Image.open(source).convert("RGBA")
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
    img = Image.open(APP_ICON_SOURCE).convert("RGBA")
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
    img = Image.open(APP_ICON_SOURCE).convert("RGBA")
    img.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    ox = pad + (inner - img.width) // 2
    oy = pad + (inner - img.height) // 2
    canvas.paste(img, (ox, oy), img)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, optimize=True)
    print(f"wrote {out.relative_to(ROOT)}")


def main() -> None:
    if not YUKKURI_LINK.is_file():
        raise SystemExit(f"missing: {YUKKURI_LINK}")
    if not APP_ICON_SOURCE.is_file():
        raise SystemExit(f"missing: {APP_ICON_SOURCE}")

    # タブ用 — ゆっくりりんく + すれ違い電波
    for size in (16, 32, 48):
        save_tab_favicon(size, ROOT / f"public/favicon-{size}.png")
    save_tab_favicon(48, ROOT / "assets/images/favicon.png")
    save_tab_favicon(48, ROOT / "public/favicon.png")

    # PWA / スプラッシュ — 全身りんくキャラ
    save_resize(APP_ICON_SOURCE, 200, ROOT / "assets/images/splash-icon.png")
    save_android_foreground(ROOT / "assets/images/android-icon-foreground.png")
    save_resize(APP_ICON_SOURCE, 192, ROOT / "public/icon-192.png")
    save_resize(APP_ICON_SOURCE, 512, ROOT / "public/icon-512.png")
    save_maskable(512, ROOT / "public/icon-512-maskable.png")
    save_resize(APP_ICON_SOURCE, 180, ROOT / "public/apple-touch-icon.png")

    shutil.copy2(ROOT / "public/favicon.png", ROOT / "public/favicon.ico")

    lp = ROOT / "public/lp"
    lp.mkdir(parents=True, exist_ok=True)
    for name in ("favicon.ico", "favicon.png", "icon-192.png", "apple-touch-icon.png"):
        shutil.copy2(ROOT / "public" / name, lp / name)
        print(f"copied lp/{name}")


if __name__ == "__main__":
    main()
