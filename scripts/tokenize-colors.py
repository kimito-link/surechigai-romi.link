#!/usr/bin/env python3
"""
organisms/ と app/ 内の直書き色をトークンに一括置換するスクリプト
GPTの推奨に基づいて作成
"""

import os
import re
from pathlib import Path

# 置換マッピング（頻度順）
COLOR_MAP = {
    # Primary/Accent
    '"#EC4899"': 'color.accentPrimary',
    '"#8B5CF6"': 'color.accentAlt',
    '"#DD6500"': 'color.hostAccentLegacy',
    
    # Text colors
    '"#D1D5DB"': 'color.textMuted',
    '"#CBD5E0"': 'color.textSubtle',
    '"#E5E7EB"': 'color.textPrimary',
    '"#ECEDEE"': 'color.textPrimary',
    '"#9CA3AF"': 'color.textSecondary',
    '"#9BA1A6"': 'color.textSecondary',
    '"#6B7280"': 'color.textHint',
    '"#4B5563"': 'color.textDisabled',
    '"#FFFFFF"': 'color.textWhite',
    '"#ffffff"': 'color.textWhite',
    '"#fff"': 'color.textWhite',
    
    # Surface/Background
    '"#1A1D21"': 'color.surface',
    '"#0D1117"': 'color.bg',
    '"#1E2022"': 'color.surface',
    '"#1F2937"': 'color.surfaceAlt',
    '"#161B22"': 'color.surfaceDark',
    '"#151718"': 'color.surfaceDark',
    
    # Border
    '"#2D3139"': 'color.border',
    '"#374151"': 'color.borderAlt',
    '"#334155"': 'color.borderAlt',
    '"#2D3748"': 'color.border',
    
    # Status
    '"#22C55E"': 'color.success',
    '"#10B981"': 'color.successDark',
    '"#4ADE80"': 'color.successLight',
    '"#EF4444"': 'color.danger',
    '"#F59E0B"': 'color.warning',
    '"#3B82F6"': 'color.info',
    
    # Social
    '"#1DA1F2"': 'color.twitter',
    '"#06C755"': 'color.line',
    
    # Rank
    '"#FFD700"': 'color.rankGold',
    '"#C0C0C0"': 'color.rankSilver',
    '"#CD7F32"': 'color.rankBronze',
    '"#FBBF24"': 'palette.amber400',
    
    # Additional colors
    '"#F472B6"': 'color.pink400',
    '"#A78BFA"': 'color.purple400',
    '"#34D399"': 'color.emerald400',
    '"#60A5FA"': 'color.blue400',
    '"#FB923C"': 'color.orange400',
    '"#F97316"': 'color.orange500',
    '"#FF6B6B"': 'color.coral',
    '"#FF6B9D"': 'color.hotPink',
}

# インポート文
IMPORT_LINE = 'import { color, palette } from "@/theme/tokens";'

def process_file(filepath: Path) -> tuple[int, bool]:
    """ファイルを処理して置換数とインポート追加の有無を返す"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    replacement_count = 0
    
    # 色の置換
    for old, new in COLOR_MAP.items():
        if old.lower() in content.lower():
            # 大文字小文字を区別しない置換
            pattern = re.compile(re.escape(old), re.IGNORECASE)
            matches = pattern.findall(content)
            if matches:
                replacement_count += len(matches)
                content = pattern.sub(new, content)
    
    # 変更があった場合のみ処理
    if content != original_content:
        # インポート文の追加（まだない場合）
        import_added = False
        if 'from "@/theme/tokens"' not in content and '@/theme/tokens' not in content:
            # 最初のimport文の後に追加
            import_match = re.search(r'^import .+?;?\n', content, re.MULTILINE)
            if import_match:
                insert_pos = import_match.end()
                content = content[:insert_pos] + IMPORT_LINE + '\n' + content[insert_pos:]
                import_added = True
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return replacement_count, import_added
    
    return 0, False

def main():
    base_dir = Path('/home/ubuntu/birthday-celebration')
    targets = [
        base_dir / 'components/organisms',
        base_dir / 'app',
    ]
    
    total_replacements = 0
    total_imports_added = 0
    processed_files = []
    
    for target_dir in targets:
        for filepath in target_dir.rglob('*.tsx'):
            count, import_added = process_file(filepath)
            if count > 0:
                rel_path = filepath.relative_to(base_dir)
                processed_files.append((str(rel_path), count, import_added))
                total_replacements += count
                if import_added:
                    total_imports_added += 1
    
    print(f"\n=== 一括置換完了 ===")
    print(f"処理ファイル数: {len(processed_files)}")
    print(f"総置換数: {total_replacements}")
    print(f"インポート追加数: {total_imports_added}")
    print(f"\n--- 詳細 ---")
    for name, count, import_added in sorted(processed_files, key=lambda x: -x[1]):
        import_mark = " (+import)" if import_added else ""
        print(f"  {name}: {count}箇所{import_mark}")

if __name__ == '__main__':
    main()
