#!/usr/bin/env python3
"""
画像最適化スクリプト
- 大きいJPG/PNG画像をWebP形式に変換
- 画像サイズを縮小
"""

import os
from PIL import Image
from pathlib import Path

# 最適化対象のディレクトリ
ASSETS_DIR = Path(__file__).parent.parent / "assets" / "images"

# 最適化設定
MAX_SIZE = (800, 800)  # 最大サイズ
QUALITY = 85  # WebP品質
SIZE_THRESHOLD = 100 * 1024  # 100KB以上のファイルを対象

def get_file_size(path):
    return os.path.getsize(path)

def optimize_image(input_path, output_path=None):
    """画像を最適化してWebPに変換"""
    if output_path is None:
        output_path = input_path.with_suffix('.webp')
    
    original_size = get_file_size(input_path)
    
    with Image.open(input_path) as img:
        # RGBAの場合はRGBに変換（WebP用）
        if img.mode in ('RGBA', 'P'):
            # 透過を維持
            img = img.convert('RGBA')
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # サイズが大きい場合はリサイズ
        if img.width > MAX_SIZE[0] or img.height > MAX_SIZE[1]:
            img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
        
        # WebPで保存
        img.save(output_path, 'WEBP', quality=QUALITY, optimize=True)
    
    new_size = get_file_size(output_path)
    reduction = (1 - new_size / original_size) * 100
    
    return original_size, new_size, reduction

def main():
    print("=== 画像最適化開始 ===\n")
    
    # 大きいファイルを検索
    large_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png']:
        for path in ASSETS_DIR.rglob(ext):
            # backupディレクトリはスキップ
            if 'backup' in str(path):
                continue
            size = get_file_size(path)
            if size > SIZE_THRESHOLD:
                large_files.append((path, size))
    
    # サイズ順にソート
    large_files.sort(key=lambda x: x[1], reverse=True)
    
    print(f"最適化対象: {len(large_files)} ファイル\n")
    
    total_original = 0
    total_new = 0
    
    for path, size in large_files:
        print(f"処理中: {path.name}")
        print(f"  元サイズ: {size / 1024:.1f} KB")
        
        try:
            # 元のファイルと同じ場所にWebPを作成
            webp_path = path.with_suffix('.webp')
            original_size, new_size, reduction = optimize_image(path, webp_path)
            
            print(f"  新サイズ: {new_size / 1024:.1f} KB ({reduction:.1f}% 削減)")
            print(f"  出力: {webp_path.name}")
            
            total_original += original_size
            total_new += new_size
        except Exception as e:
            print(f"  エラー: {e}")
        
        print()
    
    print("=== 最適化完了 ===")
    print(f"合計削減: {(total_original - total_new) / 1024:.1f} KB")
    print(f"削減率: {(1 - total_new / total_original) * 100:.1f}%")

if __name__ == "__main__":
    main()
