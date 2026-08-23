#!/usr/bin/env python3
"""
ブランドアイコン一括生成。
- タブ favicon / PWA / ホーム画面: 君斗りんく アイドルキャラ（site-icon-source.png）
- ネイティブ App Store / スプラッシュ: 同上
"""
from __future__ import annotations

import json
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



def compose_splash_logo(size: int) -> Image.Image:
    """★ネイティブ起動画面用: 背景を焼き込まない透過ロゴ。

    ★なぜアプリアイコン(compose_site_icon)を流用してはいけないか（2026-08-23 実測）:
      expo-splash-screen は **288dp のキャンバスに画像を中央合成し、背景は自分で敷く**
      （node_modules/@expo/prebuild-config/.../withAndroidSplashImages.js:166）。
      そこへ「ネイビーの正方形」を渡すと 288dp 全面がネイビーで埋まり、
      ★Android 12+ が**円形にトリミング**するので「ネイビーの円」になる。
      実測: 生成物 drawable-xxxhdpi/splashscreen_logo.png の絵柄 bbox は 287x287dp、
      半対角 202.9dp に対し**安全円の半径は 96.0dp**（Android 公式: 288dp キャンバス /
      直径192dp の円 https://developer.android.com/develop/ui/views/launch/splash-screen ）。

    ★対策: 背景は透過にして backgroundColor に任せ、絵柄を安全円の内側へ収める。
      Expo 公式も「1024x1024 / PNG / **transparent background**」を明記している
      （https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/ ）。
    """
    if not SITE_ICON_SOURCE.is_file():
        raise FileNotFoundError(SITE_ICON_SOURCE)

    # ★完全透過のキャンバス（ここが app アイコンとの決定的な違い）
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    char = Image.open(SITE_ICON_SOURCE).convert("RGBA")
    pixels = char.load()
    for y in range(char.height):
        for x in range(char.width):
            r, g, b, a = pixels[x, y]
            if a > 0 and r < 28 and g < 28 and b < 28:
                pixels[x, y] = (r, g, b, 0)

    # ★安全円(直径192/288 = 66.7%)の内側に収める。
    #   正方形の絵を円に内接させるので、さらに 1/sqrt(2) を掛ける。
    safe_ratio = 192.0 / 288.0
    target = int(size * safe_ratio / (2 ** 0.5))
    char.thumbnail((target, target), Image.Resampling.LANCZOS)
    ox = (size - char.width) // 2
    oy = (size - char.height) // 2
    canvas.paste(char, (ox, oy), char)
    return canvas


def save_splash_logo(size: int, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    compose_splash_logo(size).save(out, format="PNG")
    print(f"  wrote {out.relative_to(ROOT)} ({size}x{size}, transparent)")


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
# 個別の画像+media queryが必要で、**解像度が一致しないものは iOS に無視される**。
#
# ★2026-08-16: この表を手で維持していたため公式20解像度のうち9件しか無く、
# iPhone 16/17 Pro Max (1320x2868) 等でスプラッシュが一度も出ていなかった（実機録画で確認）。
# 機種が出るたびに穴が空く構造だったので、**手書きをやめて公式仕様データ駆動**にした。
#   正本: scripts/data/ios-launch-sizes.json（手で編集しない）
#   由来: pwa-asset-generator (elegantapp) が Apple Human Interface Guidelines から
#         収集している apple-fallback-data.json（同ツールは毎日仕様変更を監視している）
#   更新: pnpm splash:sync（新機種が出たらこれを実行するだけ）
# 横向きを持たないのは manifest.json の orientation が portrait 固定のため。
def load_ios_startup_sizes() -> list:
    """公式仕様データ(縦向き)を読む。各要素は px / logical / dpr / device を持つ。"""
    raw = (ROOT / "scripts/data/ios-launch-sizes.json").read_text(encoding="utf-8")
    return json.loads(raw)["portrait"]


def save_ios_startup_image(width: int, height: int, out: Path) -> None:
    """単色背景（manifest.background_colorと同色）の中央にロゴを配置したsplash画像。

    ★背景は #E2EDF7 のまま変えない（2026-08-21）。
      これは manifest.background_color であり、アプリ本体の地色でもある。
      揃えておくとスプラッシュ→本体で色が変わらず、切り替わりが目立たない。

    ★compose_site_icon() は「ネイビーの正方形」を返す（アプリアイコン用に地を焼いている）。
      それを薄青の地にそのまま貼ると**濃紺の四角が浮いて見える**（実機PWAで確認）。
      アイコンとしては正しいが、スプラッシュでは角を丸めて「バッジ」に見せる。

    ★大きさ: 0.28 → 0.62（短辺比）。従来は画面高の約1/10しかなく、
      「スプラッシュがひどい」「ファーストビューを覆うぐらいにロゴとキャラを」
      という指摘に繋がっていた。短辺の 62% なら縦画面で高さの約29%を占め、
      左右にはしっかり余白が残る（端まで詰めると窮屈になるため詰めない）。
    """
    bg = (0xE2, 0xED, 0xF7, 255)  # manifest.json background_color と一致させる
    canvas = Image.new("RGBA", (width, height), bg)

    icon_size = int(min(width, height) * 0.62)
    icon = compose_site_icon(icon_size)

    # 角を丸める（iOS のアプリアイコンと同じ比率 ≒ 22.37%）。
    # 四角のまま貼ると薄青の地から浮くため。
    radius = int(icon_size * 0.2237)
    mask = Image.new("L", (icon_size, icon_size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, icon_size - 1, icon_size - 1], radius=radius, fill=255
    )
    icon.putalpha(mask)

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

    # ★600px で出す（2026-08-21）。app.config.ts の expo-splash-screen は
    #   imageWidth: 200 だが、これは**ポイント指定**。3x 端末では 600px で描画されるため、
    #   200px の素材だと 3 倍に引き伸ばされて輪郭が甘くなる。
    #   素材だけ 3x 相当にしておけば、imageWidth を変えずに（＝レイアウトを変えずに）
    #   実機での見え方だけが鮮明になる。
    # ★透過の 1024px で出す（2026-08-23 に方式変更）。
    #   旧: save_site_icon(600, ...) ＝ ネイビーの正方形を焼き込んでいた。
    #   これを Android 12+ が円形マスクして「ネイビーの円」になっていた（実測）。
    #   Expo 公式の推奨は 1024x1024・透過PNG。Android xxxhdpi は 4x なので
    #   imageWidth=150 なら 600px 必要 ＝ 1024 あればアップスケールが起きない。
    save_splash_logo(1024, ROOT / "assets/images/splash-icon.png")
    save_android_foreground(ROOT / "assets/images/android-icon-foreground.png")

    # iOS Safari PWA向けスプラッシュ（apple-touch-startup-image）
    for spec in load_ios_startup_sizes():
        w, h = spec["px"]
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
