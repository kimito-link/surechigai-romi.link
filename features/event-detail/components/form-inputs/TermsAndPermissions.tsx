/**
 * TermsAndPermissions Component
 * お約束・動画許可・メッセージ入力
 */

import { View, Text } from "react-native";
import { Checkbox, Input } from "@/components/ui";
import { color } from "@/theme/tokens";

interface TermsAndPermissionsProps {
  message: string;
  setMessage: (value: string) => void;
  allowVideoUse: boolean;
  setAllowVideoUse: (value: boolean) => void;
}

export function TermsAndPermissions({
  message,
  setMessage,
  allowVideoUse,
  setAllowVideoUse,
}: TermsAndPermissionsProps) {
  return (
    <View>
      {/* 応援メッセージ */}
      <MessageInput message={message} setMessage={setMessage} />

      {/* 参加条件・お約束 */}
      <TermsSection />

      {/* 動画利用許可チェックボックス */}
      <VideoPermissionCheckbox
        allowVideoUse={allowVideoUse}
        setAllowVideoUse={setAllowVideoUse}
      />
    </View>
  );
}

// 応援メッセージ入力
function MessageInput({
  message,
  setMessage,
}: {
  message: string;
  setMessage: (value: string) => void;
}) {
  return (
    <Input
      label="応援メッセージ（任意）"
      value={message}
      onChangeText={setMessage}
      placeholder="応援メッセージを書いてね"
      multiline
      numberOfLines={3}
      inputStyle={{ minHeight: 80 }}
    />
  );
}

// 参加条件・お約束
function TermsSection() {
  return (
    <View
      style={{
        backgroundColor: "transparent",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      {/* ヘッダー */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 16 }}>🌈</Text>
        <Text style={{ color: color.accentPrimary, fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
          みんなで楽しく応援するためのお約束
        </Text>
      </View>

      {/* メッセージ */}
      <View style={{ backgroundColor: color.surface, borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <Text style={{ color: color.textSecondary, fontSize: 12, lineHeight: 18 }}>
          りんくからのお願いだよ～！{"\n"}
          みんなで仲良く、楽しく応援していこうね♪
        </Text>
      </View>

      {/* ルールリスト */}
      <View style={{ gap: 8 }}>
        <TermsItem text="このサイトは「アイドル応援ちゃんねる」が愛情たっぷりで運営してるよ！" />
        <TermsItem text="素敵なコメントは、応援動画を作るときに使わせてもらうかも！" />
        <TermsItem text="アイドルちゃんを傷つけるコメントや、迷惑なコメントは絶対ダメだよ～！" />
        <TermsItem text="みんなの「応援のキモチ」で、アイドルちゃんたちをキラキラさせちゃおう！" />
      </View>
    </View>
  );
}

// ルールアイテム
function TermsItem({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <Text style={{ color: color.accentPrimary, marginRight: 8 }}>✱</Text>
      <Text style={{ color: color.textSecondary, fontSize: 11, flex: 1, lineHeight: 16 }}>
        {text}
      </Text>
    </View>
  );
}

// 動画利用許可チェックボックス
function VideoPermissionCheckbox({
  allowVideoUse,
  setAllowVideoUse,
}: {
  allowVideoUse: boolean;
  setAllowVideoUse: (value: boolean) => void;
}) {
  return (
    <View style={{ marginBottom: 20, padding: 12, backgroundColor: color.surface, borderRadius: 8, borderWidth: 1, borderColor: color.border }}>
      <Checkbox
        checked={allowVideoUse}
        onChange={setAllowVideoUse}
        label="応援動画への使用を許可する"
        description="あなたのコメントを応援動画に使用させていただく場合があります"
      />
    </View>
  );
}
