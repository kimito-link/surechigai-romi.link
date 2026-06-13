/**
 * 検索バーコンポーネント
 * ホーム画面でチャレンジの検索に使用
 * - デバウンス処理: 入力が止まってから検索を実行
 * - サジェスト機能: 入力中に候補を表示
 * 
 * SearchInputコンポーネントをベースに実装
 */

import { View } from "react-native";
import { SearchInput } from "@/components/ui";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  /** サジェスト候補のリスト */
  suggestions?: string[];
  /** サジェスト候補をクリックしたとき */
  onSuggestionPress?: (suggestion: string) => void;
  /** デバウンス時間（ミリ秒）デフォルト: 500ms */
  debounceMs?: number;
}

// よく使われる検索キーワードのサジェスト候補
const DEFAULT_SUGGESTIONS = [
  "ライブ",
  "生誕祭",
  "配信",
  "フェス",
  "ファンミ",
  "リリイベ",
  "ワンマン",
  "グループ",
  "ソロ",
];

export function SearchBar({ 
  value, 
  onChangeText, 
  onClear,
  suggestions = DEFAULT_SUGGESTIONS,
  onSuggestionPress,
  debounceMs = 500,
}: SearchBarProps) {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 8 }}>
      <SearchInput
        value={value}
        onChangeText={onChangeText}
        onClear={onClear}
        suggestions={suggestions}
        onSuggestionPress={onSuggestionPress}
        debounceMs={debounceMs}
        placeholder="チャレンジを検索..."
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        textContentType="none"
        keyboardType="default"
        containerStyle={{ marginBottom: 0 }}
      />
    </View>
  );
}
