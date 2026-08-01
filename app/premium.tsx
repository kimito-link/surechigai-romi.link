/**
 * app/premium.tsx — プレミアムのペイウォール兼管理画面。
 *
 * 設計は docs/monetization-DESIGN.md B-5。構成は上から:
 *   1. 「記録と再訪はずっと無料」を先に明記（無料の鉄則を売り文句の土台にする）
 *   2. 特典リスト
 *   3. 価格と購入ボタン
 *   4. 購入を復元（Apple 必須）
 *   5. 解約方法・自動更新の説明と規約/プライバシーへのリンク（Guideline 3.1.2 必須）
 *
 * ★価格・解約・自動更新の説明は平文で書く（法的ラベルに詩を混ぜない原則）。
 *
 * ★購入処理はネイティブのみ。Web は「アプリから購入してください」の案内に留める。
 *   Guideline 3.1.1 によりデジタル機能のアンロックは IAP 必須で、
 *   Web で外部決済に誘導すると反ステアリング規約に触れるため。
 *
 * ★このファイルに Clerk の React フック（useUser 等）を import しないこと。
 *   ClerkProvider は app/_layout.tsx で動的 import される設計のため、
 *   解決前に描画されるとアプリ全体が落ちる（2026-07-31 / 08-01 に2度発生）。
 *   認証状態は useAuth()（lib/auth-context 経由）で受け取る。
 *
 * ★色は semantic の color を使う（palette 直参照はコントラスト検証の外に出るため避ける）。
 */
import React, { useCallback } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
import Head from "expo-router/head";
import { useAuth } from "@/hooks/use-auth";
import { PREMIUM_FEATURES, useIsPremium } from "@/lib/premium-features";
import { useTrpcReady } from "@/lib/trpc-ready-context";
import { color } from "@/theme/tokens";
import { ScreenContainer } from "@/components/organisms/screen-container";

/** 解約導線。ストアの購読管理画面を開く（自前で解約させない＝ストアの規約どおり） */
const MANAGE_SUBSCRIPTION_URL = Platform.select({
  ios: "https://apps.apple.com/account/subscriptions",
  android: "https://play.google.com/store/account/subscriptions",
  default: "https://support.apple.com/ja-jp/HT202039",
}) as string;

/**
 * 購入導線を有効にするか。
 * RevenueCat SDK とストア商品の登録が済むまでは false（導線だけ用意して押させない）。
 * 設計 E-2 の順序どおり、SDK 導入後に true にする。
 */
const PURCHASE_AVAILABLE = false;

function Bullet({ label, description }: { label: string; description: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <Text style={{ color: color.accentOrange, fontSize: 15, fontWeight: "800", lineHeight: 22 }}>
        ・
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: color.textPrimary, lineHeight: 22 }}>
          {label}
        </Text>
        <Text style={{ marginTop: 2, fontSize: 13, color: color.textMuted, lineHeight: 19 }}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        width: "100%",
        maxWidth: 560,
        alignSelf: "center",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(0,66,123,0.15)",
        backgroundColor: color.surface,
        padding: 20,
        gap: 14,
      }}
    >
      {children}
    </View>
  );
}

function LinkText({ label }: { label: string }) {
  return (
    <Text
      style={{
        color: color.accentPrimary,
        fontSize: 14,
        fontWeight: "700",
        textDecorationLine: "underline",
      }}
    >
      {label}
    </Text>
  );
}

/**
 * 「いまのご利用状態」カード。
 *
 * ★tRPC フックを呼ぶのはこの中だけ。
 *   ゲストは tRPC Provider が defer される経路があり（guest-web-providers.tsx）、
 *   その窓で `trpc.*.useQuery` を呼ぶと "Unable to find tRPC Context" で
 *   画面全体が ErrorBoundary に落ちる。`enabled: false` では防げないため、
 *   呼び出しコンポーネント自体をマウントしないことで回避する
 *   （nav-live-prefecture-panel.tsx と同じ型）。
 */
function PremiumStatusCard() {
  const { isPremium, isLoading } = useIsPremium();
  return (
    <Card>
      <Text style={{ fontSize: 13, fontWeight: "800", color: color.textMuted }}>
        いまのご利用状態
      </Text>
      {isLoading ? (
        <ActivityIndicator color={color.accentPrimary} />
      ) : (
        <Text style={{ fontSize: 16, fontWeight: "800", color: color.textPrimary }}>
          {isPremium ? "プレミアムをご利用中です" : "無料でご利用中です"}
        </Text>
      )}
    </Card>
  );
}

export default function PremiumScreen() {
  const { isAuthenticated, isAuthReady, login } = useAuth();
  const trpcReady = useTrpcReady();
  // 購入ボタンの活性判定に使う。状態カードを出せないときは常に false（フェイルクローズ）
  const isPremium = false;

  const openManage = useCallback(() => {
    void Linking.openURL(MANAGE_SUBSCRIPTION_URL);
  }, []);

  /** 購入・復元。SDK 導入までは押せないので中身は空。 */
  const onPurchase = useCallback(() => {
    // RevenueCat 導入時にここで Purchases.purchasePackage / restorePurchases を呼ぶ。
  }, []);

  const showNativePurchase = Platform.OS !== "web" && isAuthenticated;

  return (
    <ScreenContainer style={{ backgroundColor: color.bg }} edges={["top", "bottom"]}>
      {Platform.OS === "web" ? (
        <Head>
          <title>プレミアム｜君斗りんくのすれ違ひ通信</title>
          <meta
            name="description"
            content="足あとの記録と再訪はずっと無料です。プレミアムは広告非表示と足あとの書き出しをまとめた、応援していただくための任意のプランです。"
          />
        </Head>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingVertical: 28,
          paddingBottom: 56,
          gap: 16,
        }}
      >
        <View style={{ width: "100%", maxWidth: 560, alignSelf: "center", gap: 6 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: color.textPrimary }}>
            プレミアム
          </Text>
          {/* 無料の鉄則を先に置く（設計 B-5 の1番目） */}
          <Text style={{ fontSize: 15, lineHeight: 23, color: color.textSecondary }}>
            足あとの記録と、思い出の場所への再訪は
            <Text style={{ fontWeight: "800", color: color.textPrimary }}>ずっと無料</Text>
            です。プレミアムはそこに何かを足すためではなく、
            このアプリを続けていくための任意のプランです。
          </Text>
        </View>

        {/* 現在の状態。tRPC が使える認証済みのときだけ出す */}
        {isAuthReady && isAuthenticated && trpcReady ? <PremiumStatusCard /> : null}

        {/* 特典 */}
        <Card>
          <Text style={{ fontSize: 16, fontWeight: "800", color: color.textPrimary }}>
            プレミアムでできること
          </Text>
          <View style={{ gap: 12 }}>
            {(Object.keys(PREMIUM_FEATURES) as (keyof typeof PREMIUM_FEATURES)[]).map((key) => {
              const feature = PREMIUM_FEATURES[key];
              return (
                <Bullet
                  key={key}
                  label={feature.shipped ? feature.label : `${feature.label}（準備中）`}
                  description={feature.description}
                />
              );
            })}
          </View>
          <Text style={{ fontSize: 12, color: color.textMuted, lineHeight: 18 }}>
            「準備中」の機能は今後のアップデートで順次ご利用いただけるようになります。
            いまご利用いただけるのは「広告を表示しない」と「足あとの書き出し」です。
          </Text>
        </Card>

        {/* 料金と購入 */}
        <Card>
          <Text style={{ fontSize: 16, fontWeight: "800", color: color.textPrimary }}>料金</Text>
          {/* 価格はストアAPIから取得する方針のため、確定前はハードコードしない */}
          <Text style={{ fontSize: 14, lineHeight: 21, color: color.textSecondary }}>
            月額の自動更新サブスクリプションです。価格はご利用のストアに表示される金額が正となります。
          </Text>

          {isAuthReady && !isAuthenticated ? (
            <Pressable
              onPress={() => void login()}
              accessibilityRole="button"
              style={{
                minHeight: 48,
                borderRadius: 14,
                backgroundColor: color.accentPrimary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: color.textOnAccent, fontSize: 16, fontWeight: "800" }}>
                ログインして続ける
              </Text>
            </Pressable>
          ) : Platform.OS === "web" ? (
            <View
              style={{
                borderRadius: 12,
                backgroundColor: color.surfaceEmphasis,
                padding: 14,
              }}
            >
              <Text style={{ fontSize: 14, lineHeight: 21, color: color.textSecondary }}>
                ご購入は iPhone / Android のアプリからお願いします。
                ウェブからのお申し込みは承っておりません。
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={onPurchase}
              disabled={!PURCHASE_AVAILABLE || isPremium}
              accessibilityRole="button"
              accessibilityState={{ disabled: !PURCHASE_AVAILABLE || isPremium }}
              style={{
                minHeight: 48,
                borderRadius: 14,
                backgroundColor:
                  !PURCHASE_AVAILABLE || isPremium ? color.textDisabled : color.accentPrimary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: color.textOnAccent, fontSize: 16, fontWeight: "800" }}>
                {isPremium
                  ? "ご利用中です"
                  : PURCHASE_AVAILABLE
                    ? "プレミアムに申し込む"
                    : "まもなくご利用いただけます"}
              </Text>
            </Pressable>
          )}

          {/* 購入の復元（Apple 必須）。ネイティブのみ */}
          {showNativePurchase ? (
            <Pressable
              onPress={onPurchase}
              disabled={!PURCHASE_AVAILABLE}
              accessibilityRole="button"
              style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}
            >
              <LinkText label="購入を復元する" />
            </Pressable>
          ) : null}
        </Card>

        {/* 法的説明（Guideline 3.1.2 必須・平文で書く） */}
        <Card>
          <Text style={{ fontSize: 16, fontWeight: "800", color: color.textPrimary }}>
            自動更新と解約について
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 20, color: color.textSecondary }}>
            本プランは月額の自動更新サブスクリプションです。期間終了の24時間前までに解約されない場合、
            同じ期間で自動的に更新され、ストアに登録されたお支払い方法に請求されます。
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 20, color: color.textSecondary }}>
            解約はいつでも可能です。解約後も、お支払い済みの期間が終わるまではプレミアムをご利用いただけます。
            解約のお手続きはアプリ内ではなく、ご利用のストアの購読管理画面から行っていただきます。
          </Text>

          <Pressable
            onPress={openManage}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <LinkText label="購読の管理・解約はこちら" />
          </Pressable>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 4 }}>
            <Link href={"/terms" as Href} style={{ minHeight: 44, justifyContent: "center" }}>
              <LinkText label="利用規約" />
            </Link>
            <Link href={"/privacy" as Href} style={{ minHeight: 44, justifyContent: "center" }}>
              <LinkText label="プライバシーポリシー" />
            </Link>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
