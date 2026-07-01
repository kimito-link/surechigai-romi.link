#!/usr/bin/env python3
"""
ブランドアイコン一括生成。
- タブ favicon / PWA / ホーム画面: 君斗りんく アイドルキャラ（site-icon-source.png）
- ネイティブ App Store / スプラッシュ: 同上
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SITE_ICON_SOURCE = ROOT / "assets/images/site-icon-source.png"
KIMITO_BLUE = (0, 66, 123, 255)
STREETPASS_CYAN = (34, 211, 238, 140)
STREETPASS_MAGENTA = (236, 72, 153, 140)


def compose_site_icon(size: int) -> Image.Image:
    """ネイビー丸地 + すれ違い電波 + アイドルキャラ（全身をセンター配置）。"""
    if not SITE_ICON_SOURCE.is_file():
        raise FileNotFoundError(SITE_ICON_SOURCE)

    canvas = Image.new("RGBA", (size, size), KIMITO_BLUE)
    draw = ImageDraw.Draw(canvas)
    stroke = max(1, size // 28)

    cx, cy = size // 2, int(size * 0.58)
    for i, (color, side) in enumerate(
        (
            (STREETPASS_CYAN, -1),
            (STREETPASS_MAGENTA, 1),
        )
    ):
        r = int(size * (0.36 + i * 0.08))
        box = [cx + side * r // 3 - r, cy - r, cx + side * r // 3 + r, cy + r]
        draw.arc(box, start=210 if side < 0 else 330, end=330 if side < 0 else 30, fill=color, width=stroke)

    char = Image.open(SITE_ICON_SOURCE).convert("RGBA")
    # 黒背景を透過扱いに近づける（アイコン用）
    pixels = char.load()
    for y in range(char.height):
        for x in range(char.width):
            r, g, b, a = pixels[x, y]
            if a > 0 and r < 28 and g < 28 and b < 28:
                pixels[x, y] = (r, g, b, 0)

    target = int(size * 0.88)
    char.thumbnail((target, target), Image.Resampling.LANCZOS)
    ox = (size - char.width) // 2
    oy = (size - char.height) // 2 + int(size * 0.02)
    canvas.paste(char, (ox, oy), char)
    return canvas


def save_site_icon(size: int, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    compose_site_icon(size).save(out, optimize=True)
    print(f"wrote {out.relative_to(ROOT)}")


def save_maskable(size: int, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    inner = int(size * 0.72)
    pad = (size - inner) // 2
    canvas = Image.new("RGBA", (size, size), KIMITO_BLUE)
    icon = compose_site_icon(inner)
    canvas.paste(icon, (pad, pad), icon)
    canvas.save(out, optimize=True)
    print(f"wrote {out.relative_to(ROOT)}")


def save_android_foreground(out: Path) -> None:
    size = 432
    inner = 288
    pad = (size - inner) // 2
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    icon = compose_site_icon(inner)
    canvas.paste(icon, (pad, pad), icon)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, optimize=True)
    print(f"wrote {out.relative_to(ROOT)}")


def main() -> None:
    if not SITE_ICON_SOURCE.is_file():
        raise SystemExit(f"missing: {SITE_ICON_SOURCE}")

    for size in (16, 32, 48):
        save_site_icon(size, ROOT / f"public/favicon-{size}.png")
    save_site_icon(48, ROOT / "assets/images/favicon.png")

    save_site_icon(180, ROOT / "public/pwa-icon-180.png")
    save_site_icon(192, ROOT / "public/pwa-icon-192.png")
    save_site_icon(512, ROOT / "public/pwa-icon-512.png")
    save_maskable(512, ROOT / "public/pwa-icon-512-maskable.png")

    save_site_icon(200, ROOT / "assets/images/splash-icon.png")
    save_android_foreground(ROOT / "assets/images/android-icon-foreground.png")

    # レガシー互換パス
    shutil.copy2(ROOT / "public/favicon-48.png", ROOT / "public/favicon.ico")
    shutil.copy2(ROOT / "public/favicon-48.png", ROOT / "public/favicon.png")
    shutil.copy2(ROOT / "public/pwa-icon-180.png", ROOT / "public/apple-touch-icon.png")
    shutil.copy2(ROOT / "public/pwa-icon-192.png", ROOT / "public/icon-192.png")
    shutil.copy2(ROOT / "public/pwa-icon-512.png", ROOT / "public/icon-512.png")
    shutil.copy2(ROOT / "public/pwa-icon-512-maskable.png", ROOT / "public/icon-512-maskable.png")

    lp = ROOT / "public/lp"
    lp.mkdir(parents=True, exist_ok=True)
    for name in (
        "favicon.ico",
        "favicon-48.png",
        "favicon.png",
        "pwa-icon-192.png",
        "pwa-icon-180.png",
        "apple-touch-icon.png",
        "icon-192.png",
    ):
        src = ROOT / "public" / name
        if src.is_file():
            shutil.copy2(src, lp / name)
            print(f"copied lp/{name}")


if __name__ == "__main__":
    main()
