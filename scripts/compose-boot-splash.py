#!/usr/bin/env python3
"""既存のリポジトリアートから起動画面を合成する。

外部の画像生成サービスは使わない。素材は次だけ:
  - assets/images/logos/kimitolink-logo.webp（キミとリンクのワードマーク）
  - assets/images/yukkuri/link/link-yukkuri-smile-mouth-open.png
  - assets/images/characters/backup/kitsune-yukkuri-smile-mouth-open.png
  - assets/images/characters/backup/tanuki-yukkuri-smile-mouth-open.png
地図ピンはアクセント色 #F97316 で描く（写真素材がリポジトリに無いため）。

出力:
  - assets/images/splash-composition.png  … iOS の expo-splash-screen（透過。地色は backgroundColor）
  - assets/images/splash-icon.png         … Android 12+ の円形マスクに収まる透過アイコン
  - public/boot-splash.png                … Web の同じ絵（内容ハッシュの元）
  - public/splash/ios-<w>x<h>.png         … apple-touch-startup-image（不透明。地色＋同じ絵）
  - public/splash/ios-fallback.png

このあと `pnpm splash:sync` でハッシュ名へ改名し、`node scripts/gen-boot-mark-data.mjs` で
HTML へ埋め込む data URI を更新する。
"""
from __future__ import annotations

import json
import sys
from hashlib import sha256
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent

BG = (0xE2, 0xED, 0xF7, 255)  # palette.kimitoBlueSoft / BOOT.background
NAVY = (0x00, 0x42, 0x7B, 255)  # palette.kimitoBlue。地色とのコントラストは 8.4:1
PIN = (0xF9, 0x73, 0x16, 255)  # app.config.json brand.accentColor
TAGLINE = "キミの現在地を、刻む。"

WORDMARK = ROOT / "assets/images/logos/kimitolink-logo.webp"
LINK = ROOT / "assets/images/yukkuri/link/link-yukkuri-smile-mouth-open.png"
KITSUNE = ROOT / "assets/images/characters/backup/kitsune-yukkuri-smile-mouth-open.png"
TANUKI = ROOT / "assets/images/characters/backup/tanuki-yukkuri-smile-mouth-open.png"
FONT_PATH = Path("/usr/share/fonts/truetype/wqy/wqy-microhei.ttc")

# iOS の storyboard は imageWidth(dp) で幅を決める。3x 端末で 300dp → 900px。
COMP_WIDTH = 900
# Android 公式: 288dp キャンバス・直径 192dp の円。画像側でさらに内接させる。
ICON_SIZE = 1024
SAFE_RATIO = 192.0 / 288.0


def trim(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im


def key_near_white(im: Image.Image, thresh: int = 248) -> Image.Image:
    """ワードマークの白地を透過にする。文字の穴（白）も地色が透ける。"""
    im = im.convert("RGBA")
    pix = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if a and r >= thresh and g >= thresh and b >= thresh:
                pix[x, y] = (r, g, b, 0)
    return trim(im)


def fit_width(im: Image.Image, width: int) -> Image.Image:
    im = trim(im)
    height = max(1, round(im.height * width / im.width))
    return im.resize((width, height), Image.Resampling.LANCZOS)


def draw_pin(height: int) -> Image.Image:
    """位置のモチーフ。円＋しずく。穴は透過（地色が透ける）。"""
    width = int(height * 0.72)
    im = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = width * 0.46
    cx = width / 2
    cy = r + 1
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=PIN)
    d.polygon(
        [
            (cx - r * 0.62, cy + r * 0.28),
            (cx + r * 0.62, cy + r * 0.28),
            (cx, height - 1),
        ],
        fill=PIN,
    )
    # 円を塗り直して、しずくの付け根を滑らかにする
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=PIN)
    hole = r * 0.34
    d.ellipse((cx - hole, cy - hole, cx + hole, cy + hole), fill=(0, 0, 0, 0))
    return im


def load_font(size: int) -> ImageFont.FreeTypeFont:
    if not FONT_PATH.is_file():
        raise SystemExit(f"日本語フォントがありません: {FONT_PATH}")
    return ImageFont.truetype(str(FONT_PATH), size=size)


def render_tagline(font_size: int) -> Image.Image:
    font = load_font(font_size)
    # 余白を含めた仮キャンバスに描いてから切り抜く
    probe = Image.new("RGBA", (font_size * len(TAGLINE), font_size * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(probe)
    d.text((0, 0), TAGLINE, font=font, fill=NAVY)
    return trim(probe)


def compose_artwork() -> Image.Image:
    """透過の縦積み。地色は塗らない（native / CSS の background と一致させるため）。"""
    word = fit_width(key_near_white(Image.open(WORDMARK)), 760)
    pin = draw_pin(96)
    kitsune = fit_width(Image.open(KITSUNE).convert("RGBA"), 250)
    link = fit_width(Image.open(LINK).convert("RGBA"), 320)
    tanuki = fit_width(Image.open(TANUKI).convert("RGBA"), 250)
    tagline = render_tagline(46)

    gap_after_word = 4
    gap_after_pin = 8
    gap_after_chars = 18
    pad_x = 24
    pad_y = 8

    row_h = max(kitsune.height, link.height, tanuki.height)
    # キャラは少し重ねて一塊に見せる
    overlap = 18
    row_w = kitsune.width + link.width + tanuki.width - overlap * 2

    content_w = max(word.width, pin.width, row_w, tagline.width)
    width = max(COMP_WIDTH, content_w + pad_x * 2)
    height = (
        pad_y
        + word.height
        + gap_after_word
        + pin.height
        + gap_after_pin
        + row_h
        + gap_after_chars
        + tagline.height
        + pad_y
    )
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))

    def center_x(im: Image.Image) -> int:
        return (width - im.width) // 2

    y = pad_y
    canvas.alpha_composite(word, (center_x(word), y))
    y += word.height + gap_after_word
    canvas.alpha_composite(pin, (center_x(pin), y))
    y += pin.height + gap_after_pin

    x = (width - row_w) // 2
    # 下端を揃える
    canvas.alpha_composite(kitsune, (x, y + row_h - kitsune.height))
    x += kitsune.width - overlap
    canvas.alpha_composite(link, (x, y + row_h - link.height))
    x += link.width - overlap
    canvas.alpha_composite(tanuki, (x, y + row_h - tanuki.height))
    y += row_h + gap_after_chars
    canvas.alpha_composite(tagline, (center_x(tagline), y))
    return trim(canvas)


def compose_android_icon(size: int = ICON_SIZE) -> Image.Image:
    """円形マスクの内側に収まる透過アイコン（リンクのゆっくり＋小さなピン）。

    半対角が安全円を超えないよう、絵の一辺は size * SAFE_RATIO / sqrt(2)。
    """
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    target = int(size * SAFE_RATIO / (2 ** 0.5) * 0.92)
    char = fit_width(Image.open(LINK).convert("RGBA"), target)
    pin = draw_pin(max(48, target // 5))
    # ピンをキャラの右上に少し乗せる
    group_w = max(char.width, char.width // 2 + pin.width)
    group_h = char.height
    ox = (size - char.width) // 2
    oy = (size - char.height) // 2
    canvas.alpha_composite(char, (ox, oy))
    canvas.alpha_composite(pin, (ox + char.width - pin.width + 8, oy + 4))
    # ピンがはみ出したら全体を安全円へ縮小
    bbox = canvas.getbbox()
    if not bbox:
        return canvas
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    limit = int(size * SAFE_RATIO / (2 ** 0.5))
    if bw > limit or bh > limit:
        scale = limit / max(bw, bh)
        resized = canvas.resize((int(size * scale), int(size * scale)), Image.Resampling.LANCZOS)
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
        return out
    return canvas


def place_on_background(art: Image.Image, width: int, height: int) -> Image.Image:
    """PWA の起動画像。地色を全面に敷き、絵を幅の 72% で中央に置く（CSS の 78vw に近い）。"""
    canvas = Image.new("RGBA", (width, height), BG)
    target_w = int(width * 0.72)
    scale = target_w / art.width
    # 縦が画面の 86% を超える端末（横に近い比率）では縮める
    if art.height * scale > height * 0.86:
        scale = (height * 0.86) / art.height
    tw, th = max(1, round(art.width * scale)), max(1, round(art.height * scale))
    placed = art.resize((tw, th), Image.Resampling.LANCZOS)
    canvas.alpha_composite(placed, ((width - tw) // 2, (height - th) // 2))
    return canvas.convert("RGB")


def load_ios_startup_sizes() -> list[tuple[int, int]]:
    raw = json.loads((ROOT / "scripts/data/ios-launch-sizes.json").read_text(encoding="utf-8"))
    sizes = [(int(e["px"][0]), int(e["px"][1])) for e in raw["portrait"]]
    sizes.append((1290, 2796))  # fallback。既存の ios-fallback と同じ論理サイズ
    # 重複を除く（fallback が表と重なることがある）
    seen: set[tuple[int, int]] = set()
    out: list[tuple[int, int]] = []
    for wh in sizes:
        if wh in seen:
            continue
        seen.add(wh)
        out.append(wh)
    return out


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format="PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} {im.size} {im.mode}")


def web_splash_png(art: Image.Image) -> Image.Image:
    """HTML に埋め込む用。表示は最大 420px なので幅 600px・128色で足りる。"""
    width = 600
    height = max(1, round(art.height * width / art.width))
    small = art.resize((width, height), Image.Resampling.LANCZOS)
    # FASTOCTREE はアルファを残す（角が透過のまま）。
    return small.quantize(colors=128, method=Image.Quantize.FASTOCTREE)


def write_data_module(png_path: Path) -> None:
    """public/boot-splash.png のバイト列を data URI にする。SHA は PNG そのもの。"""
    raw = png_path.read_bytes()
    digest = sha256(raw).hexdigest()
    import base64

    uri = "data:image/png;base64," + base64.b64encode(raw).decode("ascii")
    out = ROOT / "theme/tokens/boot-splash-data.ts"
    out.write_text(
        f"""/**
 * theme/tokens/boot-splash-data.ts
 * ★自動生成（scripts/compose-boot-splash.py）。手で編集しない。
 *
 * 起動画面の絵（public/boot-splash.png）を data URI にしたもの。
 * app/+html.tsx が最初の描画に埋め込み、画像の取得を待たずに同じ絵を出す
 * （iOS のロックダウンモードでも外部リクエストに依存しない）。
 *
 * ★このファイルを import してよいのは app/+html.tsx だけ（Node 側の静的レンダリング専用）。
 * ★元の PNG を変えたら `python3 scripts/compose-boot-splash.py --data-only` を再実行する。
 *   pnpm check の gen-boot-mark-data --verify が SHA のずれを見る。
 */
export const BOOT_SPLASH_SOURCE_SHA256 = "{digest}";
export const BOOT_SPLASH_DATA_URI =
  "{uri}";
""",
        encoding="utf-8",
    )
    print(f"wrote {out.relative_to(ROOT)} uri {len(uri)} bytes sha {digest[:12]}")


def write_web_png(art: Image.Image) -> Path:
    path = ROOT / "public/boot-splash.png"
    web_splash_png(art).save(path, format="PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} {path.stat().st_size} bytes")
    return path


def main() -> None:
    data_only = "--data-only" in sys.argv
    web_png = ROOT / "public/boot-splash.png"
    if data_only:
        if not web_png.is_file():
            raise SystemExit(f"missing {web_png}")
        write_data_module(web_png)
        return

    for p in (WORDMARK, LINK, KITSUNE, TANUKI):
        if not p.is_file():
            raise SystemExit(f"missing art: {p}")

    art = compose_artwork()
    save_png(art, ROOT / "assets/images/splash-composition.png")
    write_web_png(art)
    write_data_module(ROOT / "public/boot-splash.png")
    save_png(compose_android_icon(), ROOT / "assets/images/splash-icon.png")

    splash_dir = ROOT / "public/splash"
    splash_dir.mkdir(parents=True, exist_ok=True)
    # 旧ハッシュ名は splash:sync が消す。ここではハッシュ無しの最新を置く。
    sizes = load_ios_startup_sizes()
    fallback = (1290, 2796)
    for w, h in sizes:
        screen = place_on_background(art, w, h)
        name = "ios-fallback.png" if (w, h) == fallback else f"ios-{w}x{h}.png"
        # fallback と表の 1290x2796 が同一なら両方に同じ絵が要る
        save_png(screen, splash_dir / f"ios-{w}x{h}.png")
        if (w, h) == fallback:
            save_png(screen, splash_dir / "ios-fallback.png")
    print(f"composition {art.size[0]}x{art.size[1]}")


if __name__ == "__main__":
    main()
