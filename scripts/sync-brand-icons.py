#!/usr/bin/env python3
"""
ブランドアイコン一括生成。
- タブ favicon（16–48px）: KL 丸ロゴ（icon-orange）— 小さくても判別できる
- PWA / ホーム画面（192px+）: りんくキャラ（icon.png）— App Store と同じ
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TAB_FAVICON_SOURCE = ROOT / "assets/images/logo/icon-orange.webp"
APP_ICON_SOURCE = ROOT / "assets/images/icon.png"
KIMITO_BLUE = (0, 66, 123, 255)


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
    if not TAB_FAVICON_SOURCE.is_file():
        raise SystemExit(f"missing: {TAB_FAVICON_SOURCE}")
    if not APP_ICON_SOURCE.is_file():
        raise SystemExit(f"missing: {APP_ICON_SOURCE}")

    # タブ用 — KL 丸（オレンジ）
    for size in (16, 32, 48):
        save_resize(TAB_FAVICON_SOURCE, size, ROOT / f"public/favicon-{size}.png")
    save_resize(TAB_FAVICON_SOURCE, 48, ROOT / "assets/images/favicon.png")
    save_resize(TAB_FAVICON_SOURCE, 48, ROOT / "public/favicon.png")

    # PWA / スプラッシュ — りんくキャラ
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
        src = ROOT / "public" / (name if name != "favicon.png" else "favicon.png")
        shutil.copy2(src, lp / name)
        print(f"copied lp/{name}")


if __name__ == "__main__":
    main()
