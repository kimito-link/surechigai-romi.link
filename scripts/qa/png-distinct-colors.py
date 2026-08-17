#!/usr/bin/env python3
"""スクリーンショットに何色使われているかを数える。

用途: iOS 起動プローブで「アプリは落ちなかったが画面が真っ白」を検出する。
プロセスが生きていても描画されていなければ、審査は "Error on launch" と書いてくる
（2026-08-17 の Guideline 2.1(a) 却下）。

出力: 標準出力に色数を1行。読めなかった場合は -1。
    1   → 単色。何も描画されていない（真っ白/真っ黒）
    2以上 → 何かが描かれている

runner に Pillow がある保証がないので、標準ライブラリだけで PNG を読む。
simctl の screenshot は 8bit RGB / RGBA なので、その2つだけ扱えれば足りる。
"""

import sys
import struct
import zlib


def distinct_colors(path: str) -> int:
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        return -1

    pos = 8
    width = height = 0
    ctype = -1
    idat = b""
    while pos + 8 <= len(data):
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        chunk = data[pos + 4 : pos + 8]
        body = data[pos + 8 : pos + 8 + length]
        if chunk == b"IHDR":
            width, height, depth, ctype = struct.unpack(">IIBB", body[:10])
            # 8bit の truecolor / truecolor+alpha 以外は扱わない
            if depth != 8 or ctype not in (2, 6):
                return -1
        elif chunk == b"IDAT":
            idat += body
        elif chunk == b"IEND":
            break
        pos += 12 + length

    if not idat or width == 0 or height == 0:
        return -1

    raw = zlib.decompress(idat)
    channels = 4 if ctype == 6 else 3
    stride = width * channels

    colors = set()
    prev = bytearray(stride)
    offset = 0
    for y in range(height):
        if offset >= len(raw):
            break
        filter_type = raw[offset]
        offset += 1
        line = bytearray(raw[offset : offset + stride])
        offset += stride
        if len(line) < stride:
            break

        # PNG のフィルタを戻す（仕様どおり1バイトずつ）
        for x in range(stride):
            a = line[x - channels] if x >= channels else 0
            b = prev[x]
            c = prev[x - channels] if x >= channels else 0
            if filter_type == 1:
                line[x] = (line[x] + a) & 0xFF
            elif filter_type == 2:
                line[x] = (line[x] + b) & 0xFF
            elif filter_type == 3:
                line[x] = (line[x] + (a + b) // 2) & 0xFF
            elif filter_type == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pred) & 0xFF

        # 全画素を見るのは重い。20行 x 20画素ごとに間引く（単色判定にはこれで十分）
        if y % 20 == 0:
            for x in range(0, stride, channels * 20):
                colors.add(bytes(line[x : x + 3]))
        prev = line

    return len(colors)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(-1)
        sys.exit(0)
    try:
        print(distinct_colors(sys.argv[1]))
    except Exception:
        # プローブ本体を止めないため、読めなければ -1 を返して呼び出し側に判断させる
        print(-1)
