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


# iOS Safari の PWA (ホーム画面追加後の起動時) 向けスプラッシュ画像。
# apple-touch-startup-image はデバイス毎の画面解像度(width x height, px単位)に
# 個別の画像+media queryが必要。主要なiPhone/iPad解像度をカバーする。
# (width, height, device-pixel-ratio) — CSS論理ピクセルではなく実ピクセルで指定
IOS_STARTUP_SIZES = (
    (1170, 2532, 3),  # iPhone 12/13/14
    (1179, 2556, 3),  # iPhone 14 Pro/15/16
    (1284, 2778, 3),  # iPhone 12/13/14 Pro Max
    (1290, 2796, 3),  # iPhone 14/15/16 Pro Max
    (1080, 2340, 3),  # iPhone 12/13 mini系
    (828, 1792, 2),  # iPhone 11/XR
    (750, 1334, 2),  # iPhone SE/8/7/6s
    (1668, 2388, 2),  # iPad Pro 11
    (2048, 2732, 2),  # iPad Pro 12.9
)


def save_ios_startup_image(width: int, height: int, out: Path) -> None:
    """単色背景（manifest.background_colorと同色）の中央にロゴを配置したsplash画像。"""
    bg = (0xE2, 0xED, 0xF7, 255)  # manifest.json background_color と一致させる
    canvas = Image.new("RGBA", (width, height), bg)
    icon_size = int(min(width, height) * 0.28)
    icon = compose_site_icon(icon_size)
    ox = (width - icon_size) // 2
    oy = (height - icon_size) // 2
    canvas.paste(icon, (ox, oy), icon)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out, optimize=True)
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

    # iOS Safari PWA向けスプラッシュ（apple-touch-startup-image）
    for w, h, _dpr in IOS_STARTUP_SIZES:
        save_ios_startup_image(w, h, ROOT / f"public/splash/ios-{w}x{h}.png")
    # media属性なしのフォールバック（新機種等でdevice-width/heightが未登録の解像度でも
    # スプラッシュが真っ黒/無地にならないようにする保険）。
    save_ios_startup_image(1290, 2796, ROOT / "public/splash/ios-fallback.png")

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
