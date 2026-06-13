#!/usr/bin/env python3
"""
JSX属性内の色置換による構文エラーを修正するスクリプト
xxxColor=color.xxx を xxxColor={color.xxx} に修正
"""

import os
import re
from pathlib import Path

def fix_jsx_color_attributes(content: str) -> str:
    """JSX属性内の色を正しい形式に修正"""
    
    # 一般的なパターン: xxxColor=color.xxx → xxxColor={color.xxx}
    # または xxx=color.xxx → xxx={color.xxx}
    
    # 属性名のリスト
    attributes = [
        'color',
        'tintColor',
        'progressBackgroundColor',
        'fallbackColor',
        'fill',
        'stroke',
        'stopColor',
        'placeholderTextColor',
        'backgroundColor',
        'borderColor',
        'textColor',
        'iconColor',
        'activeColor',
        'inactiveColor',
        'underlayColor',
    ]
    
    for attr in attributes:
        # attr=color.xxx → attr={color.xxx}
        content = re.sub(
            rf'(\s){attr}=color\.(\w+)',
            rf'\1{attr}={{color.\2}}',
            content
        )
        # attr=palette.xxx → attr={palette.xxx}
        content = re.sub(
            rf'(\s){attr}=palette\.(\w+)',
            rf'\1{attr}={{palette.\2}}',
            content
        )
    
    return content

def process_file(filepath: Path) -> int:
    """ファイルを処理して修正数を返す"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    content = fix_jsx_color_attributes(content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        # 修正数をカウント（大まかな推定）
        return original_content.count('=color.') + original_content.count('=palette.')
    
    return 0

def main():
    base_dir = Path('/home/ubuntu/birthday-celebration')
    targets = [
        base_dir / 'components/organisms',
        base_dir / 'app',
    ]
    
    total_fixes = 0
    fixed_files = []
    
    for target_dir in targets:
        for filepath in target_dir.rglob('*.tsx'):
            count = process_file(filepath)
            if count > 0:
                rel_path = filepath.relative_to(base_dir)
                fixed_files.append((str(rel_path), count))
                total_fixes += count
    
    print(f"\n=== JSX属性修正完了 ===")
    print(f"修正ファイル数: {len(fixed_files)}")
    print(f"総修正数: {total_fixes}")
    if fixed_files:
        print(f"\n--- 詳細 ---")
        for name, count in sorted(fixed_files, key=lambda x: -x[1]):
            print(f"  {name}: {count}箇所")

if __name__ == '__main__':
    main()
