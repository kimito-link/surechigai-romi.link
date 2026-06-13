/**
 * TwitterSearchForm Component
 * Twitter検索フォーム（ユーザー名入力、検索、結果表示）
 */

import { View, Text, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { Input } from "@/components/ui";
import type { LookedUpProfile } from "../../types";
import { TwitterUserCompact, toTwitterUserData } from "@/components/molecules/twitter-user-card";

interface TwitterSearchFormProps {
  newCompanionName: string;
  setNewCompanionName: (value: string) => void;
  newCompanionTwitter: string;
  setNewCompanionTwitter: (value: string) => void;
  isLookingUpTwitter: boolean;
  lookupError: string | null;
  lookedUpProfile: LookedUpProfile | null;
  setLookedUpProfile: (value: LookedUpProfile | null) => void;
  setLookupError: (value: string | null) => void;
  onAdd: () => void;
  onCancel: () => void;
  onLookup: (input: string) => Promise<void>;
}

export function TwitterSearchForm({
  newCompanionName,
  setNewCompanionName,
  newCompanionTwitter,
  setNewCompanionTwitter,
  isLookingUpTwitter,
  lookupError,
  lookedUpProfile,
  setLookedUpProfile,
  setLookupError,
  onAdd,
  onCancel,
  onLookup,
}: TwitterSearchFormProps) {
  const colors = useColors();
  
  return (
    <View style={{
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: color.accentPrimary,
    }}>
      {/* Twitter検索入力 */}
      <TwitterInput
        value={newCompanionTwitter}
        onChange={(text) => {
          setNewCompanionTwitter(text);
          setLookedUpProfile(null);
          setLookupError(null);
        }}
        isLoading={isLookingUpTwitter}
        onSearch={() => onLookup(newCompanionTwitter)}
      />

      {/* エラー表示 */}
      {lookupError && (
        <Text style={{ color: color.danger, fontSize: 12, marginBottom: 8 }}>
          {lookupError}
        </Text>
      )}

      {/* 検索結果表示 */}
      {lookedUpProfile && (
        <LookedUpProfileDisplay profile={lookedUpProfile} />
      )}

      {/* 名前直接入力 */}
      <DirectNameInput
        value={newCompanionName}
        onChange={setNewCompanionName}
      />

      {/* ボタン */}
      <FormButtons
        onCancel={onCancel}
        onAdd={onAdd}
        isAddDisabled={!lookedUpProfile && !newCompanionName.trim()}
      />
    </View>
  );
}

// Twitter入力フィールド
function TwitterInput({
  value,
  onChange,
  isLoading,
  onSearch,
}: {
  value: string;
  onChange: (text: string) => void;
  isLoading: boolean;
  onSearch: () => void;
}) {
  const colors = useColors();
  
  return (
    <>
      <Input
        label="Twitterユーザー名またはURL"
        value={value}
        onChangeText={onChange}
        placeholder="@idolfunch または https://x.com/idolfunch"
        autoCapitalize="none"
        hint="@username または https://x.com/username"
        containerStyle={{ marginBottom: 8 }}
        inputStyle={{ flex: 1, color: color.twitter }}
      />
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={onSearch}
          disabled={isLoading || !value.trim()}
          style={{
            backgroundColor: isLoading || !value.trim() ? color.border : color.twitter,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
            {isLoading ? "..." : "検索"}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

// 検索結果表示（TwitterUserCompact で統一）
function LookedUpProfileDisplay({ profile }: { profile: LookedUpProfile }) {
  return (
    <View style={{
      backgroundColor: color.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: color.twitter,
    }}>
      <View style={{ flex: 1 }}>
        <TwitterUserCompact
          user={toTwitterUserData(profile)}
          size="medium"
        />
      </View>
      <MaterialIcons name="check-circle" size={24} color={color.success} />
    </View>
  );
}

// 名前直接入力
function DirectNameInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <Input
      label="または名前を直接入力"
      value={value}
      onChangeText={onChange}
      placeholder="友人の名前"
      containerStyle={{ marginTop: 8, marginBottom: 0 }}
    />
  );
}

// フォームボタン
function FormButtons({
  onCancel,
  onAdd,
  isAddDisabled,
}: {
  onCancel: () => void;
  onAdd: () => void;
  isAddDisabled: boolean;
}) {
  const colors = useColors();
  
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: color.border,
          borderRadius: 8,
          padding: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: color.textSecondary }}>キャンセル</Text>
      </Pressable>
      <Pressable
        onPress={onAdd}
        disabled={isAddDisabled}
        style={{
          flex: 1,
          backgroundColor: isAddDisabled ? color.border : color.accentPrimary,
          borderRadius: 8,
          padding: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.foreground, fontWeight: "bold" }}>追加</Text>
      </Pressable>
    </View>
  );
}
