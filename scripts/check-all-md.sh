#!/bin/bash
# md全体監視システム
# すべてのmdファイルのチェックボックスをスキャンし、未実装項目を検出

set -e

echo "🔍 md全体監視システムを開始..."

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# カウンター
TOTAL_ITEMS=0
COMPLETED_ITEMS=0
PENDING_ITEMS=0
ERRORS=0

# 一時ファイル
PENDING_FILE=$(mktemp)
COMPLETED_FILE=$(mktemp)

# クリーンアップ
trap "rm -f $PENDING_FILE $COMPLETED_FILE" EXIT

echo ""
echo "=========================================="
echo "📋 mdファイル全体をスキャン中..."
echo "=========================================="

# docsディレクトリ内のすべてのmdファイルをスキャン
for md_file in docs/*.md; do
  if [ ! -f "$md_file" ]; then
    continue
  fi
  
  filename=$(basename "$md_file")
  
  # チェックボックスを含む行を抽出
  # [ ] は未完了、[x] は完了
  pending_count=$(grep -c "^[[:space:]]*- \[ \]" "$md_file" 2>/dev/null || true)
  completed_count=$(grep -c "^[[:space:]]*- \[x\]" "$md_file" 2>/dev/null || true)
  
  # grepが何も見つからない場合は0にする
  if [ -z "$pending_count" ]; then
    pending_count=0
  fi
  if [ -z "$completed_count" ]; then
    completed_count=0
  fi
  
  if [ "$pending_count" -gt 0 ] || [ "$completed_count" -gt 0 ]; then
    echo ""
    echo -e "${BLUE}📄 $filename${NC}"
    echo "   未完了: $pending_count 件 | 完了: $completed_count 件"
    
    # 未完了項目を抽出
    if [ "$pending_count" -gt 0 ]; then
      grep "^[[:space:]]*- \[ \]" "$md_file" | while read -r line; do
        # チェックボックスを除去してテキストのみ抽出
        item=$(echo "$line" | sed 's/^[[:space:]]*- \[ \] //')
        echo "[$filename] $item" >> "$PENDING_FILE"
        echo -e "   ${YELLOW}⏳ $item${NC}"
      done
    fi
    
    # 完了項目を抽出（詳細は表示しない）
    if [ "$completed_count" -gt 0 ]; then
      grep "^[[:space:]]*- \[x\]" "$md_file" | while read -r line; do
        item=$(echo "$line" | sed 's/^[[:space:]]*- \[x\] //')
        echo "[$filename] $item" >> "$COMPLETED_FILE"
      done
    fi
    
    TOTAL_ITEMS=$((TOTAL_ITEMS + pending_count + completed_count))
    PENDING_ITEMS=$((PENDING_ITEMS + pending_count))
    COMPLETED_ITEMS=$((COMPLETED_ITEMS + completed_count))
  fi
done

echo ""
echo "=========================================="
echo "📊 スキャン結果サマリー"
echo "=========================================="
echo ""
echo "合計項目数: $TOTAL_ITEMS 件"
echo -e "${GREEN}✅ 完了: $COMPLETED_ITEMS 件${NC}"
echo -e "${YELLOW}⏳ 未完了: $PENDING_ITEMS 件${NC}"

if [ "$TOTAL_ITEMS" -gt 0 ]; then
  completion_rate=$((COMPLETED_ITEMS * 100 / TOTAL_ITEMS))
  echo ""
  echo "進捗率: ${completion_rate}%"
fi

# 未完了項目の詳細リスト
if [ "$PENDING_ITEMS" -gt 0 ]; then
  echo ""
  echo "=========================================="
  echo "⏳ 未完了項目の詳細"
  echo "=========================================="
  echo ""
  
  # ファイルごとにグループ化して表示
  current_file=""
  counter=1
  while IFS= read -r line; do
    file=$(echo "$line" | sed 's/^\[\(.*\)\] .*/\1/')
    item=$(echo "$line" | sed 's/^\[.*\] //')
    
    if [ "$file" != "$current_file" ]; then
      echo ""
      echo -e "${BLUE}📄 $file${NC}"
      current_file="$file"
    fi
    
    echo -e "   ${counter}. ${item}"
    counter=$((counter + 1))
  done < "$PENDING_FILE"
fi

echo ""
echo "=========================================="
echo "🎯 次のアクション"
echo "=========================================="

if [ "$PENDING_ITEMS" -eq 0 ]; then
  echo -e "${GREEN}✅ すべての項目が完了しています！${NC}"
  echo ""
  echo "おめでとうございます！すべてのmdファイルのチェックリストが完了しました。"
  exit 0
else
  echo -e "${YELLOW}⚠️  未完了の項目があります${NC}"
  echo ""
  echo "以下のコマンドで未完了項目を実装してください："
  echo ""
  echo "  1. 各mdファイルを確認して実装する"
  echo "  2. 実装後、mdファイルのチェックボックスを [ ] → [x] に変更"
  echo "  3. 再度このスクリプトを実行して確認"
  echo ""
  echo "または、AIに以下のように指示してください："
  echo "  「すべてのmdファイルの未完了項目を実装してください」"
  
  # GitHub Actionsでは警告として扱う（エラーにはしない）
  if [ "${CI:-false}" = "true" ]; then
    echo ""
    echo "⚠️  CI環境: 未完了項目がありますが、デプロイは継続します"
    exit 0
  else
    # ローカル環境では情報として表示
    exit 0
  fi
fi
