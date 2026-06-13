// components/ui/input.tsx
// v6.19: 統一されたフォーム入力コンポーネント

import { useState, useCallback, forwardRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Platform,
  Pressable,
  ScrollView,
  Keyboard,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color, shadows } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

// ==================== 型定義 ====================

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  /** 入力欄のスタイル（TextInput に渡す。color 等の TextStyle 可） */
  inputStyle?: ViewStyle | TextStyle;
  /** 入力欄のスタイル（TextInput に渡す） */
  style?: TextStyle;
  /** 無効化 */
  disabled?: boolean;
  /** 入力欄のサイズ */
  size?: "sm" | "md" | "lg";
  /** 複数行入力 */
  multiline?: boolean;
  /** 複数行の場合の行数 */
  numberOfLines?: number;
}

// ==================== サイズ定義 ====================

const sizeStyles = {
  sm: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    minHeight: 44,
    borderRadius: 10,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    minHeight: 48,
    borderRadius: 12,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 18,
    minHeight: 56,
    borderRadius: 14,
  },
};

// ==================== Input ====================

/**
 * 統一されたテキスト入力コンポーネント
 * 
 * @example
 * // 基本的な使い方
 * <Input 
 *   label="メールアドレス" 
 *   placeholder="example@email.com"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 * 
 * // エラー表示
 * <Input 
 *   label="パスワード" 
 *   secureTextEntry
 *   error="パスワードは8文字以上必要です"
 *   value={password}
 *   onChangeText={setPassword}
 * />
 * 
 * // アイコン付き
 * <Input 
 *   label="検索" 
 *   icon="search"
 *   placeholder="キーワードを入力"
 * />
 */
export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  hint,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  style: styleProp,
  disabled = false,
  size = "md",
  multiline = false,
  numberOfLines = 4,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const sizeStyle = sizeStyles[size];
  const { onFocus, onBlur } = props;

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const borderColor = error 
    ? color.danger 
    : isFocused 
      ? color.accentPrimary 
      : color.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <View 
        style={[
          styles.inputContainer,
          {
            borderColor,
            borderRadius: sizeStyle.borderRadius,
            minHeight: multiline ? sizeStyle.minHeight * numberOfLines * 0.5 : sizeStyle.minHeight,
          },
        ]}
      >
        {icon && (
          <MaterialIcons 
            name={icon} 
            size={20} 
            color={isFocused ? color.accentPrimary : color.textMuted} 
            style={styles.icon}
          />
        )}
        
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              paddingVertical: sizeStyle.paddingVertical,
              paddingHorizontal: icon ? 0 : sizeStyle.paddingHorizontal,
              fontSize: sizeStyle.fontSize,
            },
            multiline && styles.multilineInput,
            inputStyle,
            styleProp,
          ]}
          placeholderTextColor={color.textSubtle}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && (
          <MaterialIcons 
            name={rightIcon} 
            size={20} 
            color={color.textMuted} 
            style={styles.rightIcon}
            onPress={onRightIconPress}
          />
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={14} color={color.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {hint && !error && (
        <Text style={styles.hintText}>{hint}</Text>
      )}
    </View>
  );
});

Input.displayName = "Input";

// ==================== SearchInput ====================

export interface SearchInputProps extends Omit<InputProps, "icon" | "label"> {
  onSearch?: (text: string) => void;
  onClear?: () => void;
  /** サジェスト候補のリスト */
  suggestions?: string[];
  /** サジェスト候補をクリックしたとき */
  onSuggestionPress?: (suggestion: string) => void;
  /** デバウンス時間（ミリ秒）デフォルト: 0（デバウンスなし） */
  debounceMs?: number;
}

/**
 * デバウンスフック
 * 指定時間入力がなければコールバックを実行
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 検索入力コンポーネント（サジェスト機能付き）
 * 
 * @example
 * <SearchInput 
 *   placeholder="チャレンジを検索"
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   onSearch={handleSearch}
 *   suggestions={["ライブ", "生誕祭"]}
 *   onSuggestionPress={handleSuggestion}
 * />
 */
export function SearchInput({
  value,
  onChangeText,
  onSearch,
  onClear,
  suggestions,
  onSuggestionPress,
  debounceMs = 0,
  containerStyle,
  ...props
}: SearchInputProps) {
  const colors = useColors();
  const [localValue, setLocalValue] = useState(value ?? "");
  const [isFocused, setIsFocused] = useState(false);

  // デバウンス処理
  const debouncedValue = useDebounce(localValue, debounceMs);
  
  // デバウンス後に親コンポーネントに通知
  useEffect(() => {
    if (debounceMs > 0 && debouncedValue !== value && debouncedValue !== undefined) {
      onChangeText?.(debouncedValue);
    }
  }, [debouncedValue, debounceMs, onChangeText, value]);

  // 外部からvalueが変更された場合（クリア時など）
  useEffect(() => {
    if (value !== localValue && value === "") {
      setLocalValue("");
    }
  }, [value, localValue]);

  // サジェスト候補のフィルタリング
  const safeLocal = localValue ?? "";
  const filteredSuggestions = (suggestions || []).filter(
    (s) => safeLocal.length > 0 && s.toLowerCase().includes(safeLocal.toLowerCase()) && s !== safeLocal
  );

  // サジェストを表示するかどうか
  const shouldShowSuggestions = suggestions && isFocused && safeLocal.length > 0 && filteredSuggestions.length > 0;

  const handleLocalChange = useCallback((text: string) => {
    setLocalValue(text);
    if (debounceMs === 0) {
      onChangeText?.(text);
    }
  }, [debounceMs, onChangeText]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChangeText?.("");
    onClear?.();
  }, [onChangeText, onClear]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setLocalValue(suggestion);
    onChangeText?.(suggestion);
    Keyboard.dismiss();
    onSuggestionPress?.(suggestion);
  }, [onChangeText, onSuggestionPress]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  }, []);

  const handleSubmit = useCallback(() => {
    if (localValue) {
      onChangeText?.(localValue);
      onSearch?.(localValue);
    }
    Keyboard.dismiss();
  }, [localValue, onChangeText, onSearch]);

  return (
    <View style={[{ position: "relative", zIndex: 100 }, containerStyle]}>
      <Input
        icon="search"
        rightIcon={localValue ? "close" : undefined}
        onRightIconPress={handleClear}
        value={localValue}
        onChangeText={handleLocalChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        containerStyle={{ marginBottom: 0 }}
        {...props}
      />
      
      {/* サジェスト候補 */}
      {shouldShowSuggestions && (
        <View style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          borderRadius: 12,
          marginTop: 4,
          borderWidth: 1,
          borderColor: color.border,
          maxHeight: 200,
          ...shadows.md,
        }}>
          <ScrollView 
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {filteredSuggestions.map((suggestion, index) => (
              <Pressable
                key={suggestion}
                onPress={() => handleSuggestionPress(suggestion)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: index < filteredSuggestions.length - 1 ? 1 : 0,
                  borderBottomColor: color.border,
                }}
              >
                <MaterialIcons name="search" size={16} color={color.textSecondary} style={{ marginRight: 12 }} />
                <Text style={{ color: colors.foreground, fontSize: 14 }}>
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ==================== スタイル ====================

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: color.textWhite,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.surface,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
    padding: 4,
  },
  input: {
    flex: 1,
    color: color.textWhite,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      } as any,
    }),
  },
  multilineInput: {
    paddingTop: 12,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: color.danger,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 13,
    color: color.textMuted,
    marginTop: 6,
  },
});

export default Input;
