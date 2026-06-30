/**
 * サインイン共通レイアウト（kimitolink AuthPageShell 準拠）。
 * モバイル: CTA ファースト / lg 以上: 左説明・右 Clerk の2カラム。
 */
import { LinearGradient } from "expo-linear-gradient";
import Head from "expo-router/head";
import { ReactNode } from "react";
import { Platform, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { AuthPageIntro } from "@/components/auth/auth-page-intro";
import { AuthRedirectNotice } from "@/components/auth/auth-redirect-notice";
import { AuthSupportNotice } from "@/components/auth/auth-support-notice";
import { InAppBrowserNotice } from "@/components/auth/in-app-browser-notice";
import { SignInAuthHandoffOverlay } from "@/components/auth/sign-in-auth-handoff-overlay";
import { authProvidersHeadline } from "@/lib/auth-providers";
import { palette } from "@/theme/tokens";

type AuthPageShellProps = {
  variant: "sign-in" | "sign-up";
  children: ReactNode;
};

function AuthClerkCard({ variant, children }: { variant: "sign-in" | "sign-up"; children: ReactNode }) {
  return (
    <View
      style={{
        width: "100%",
        maxWidth: 448,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: "rgba(0,66,123,0.15)",
        backgroundColor: "rgba(255,255,255,0.95)",
        overflow: "hidden",
        shadowColor: palette.kimitoBlue,
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View
        style={{
          backgroundColor: palette.kimitoBlueSoft,
          paddingHorizontal: 16,
          paddingVertical: 12,
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#D1FAE5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#047857", fontSize: 12, fontWeight: "800" }}>✓</Text>
          </View>
          <Text
            style={{
              color: palette.kimitoBlue,
              fontSize: 14,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            {authProvidersHeadline(variant)}
          </Text>
        </View>
        <Text
          style={{
            marginTop: 6,
            color: palette.kimitoOrange,
            fontSize: 12,
            fontWeight: "800",
          }}
        >
          下のボタンを押すだけ ↓
        </Text>
      </View>
      <View style={{ padding: 14 }}>{children}</View>
    </View>
  );
}

export function AuthPageShell({ variant, children }: AuthPageShellProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;

  return (
    <View style={{ flex: 1 }}>
      {Platform.OS === "web" ? (
        <Head>
          <link rel="preconnect" href="https://clerk.kimito.link" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://x.com" />
          <link rel="dns-prefetch" href="https://api.x.com" />
          <link rel="dns-prefetch" href="https://abs.twimg.com" />
        </Head>
      ) : null}
      <SignInAuthHandoffOverlay />
      <LinearGradient
        colors={["rgba(226,237,247,0.8)", "#FFFFFF", "rgba(255,243,232,0.6)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingVertical: 32,
            paddingBottom: 48,
            maxWidth: 1152,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <View
            style={{
              flexDirection: isWide ? "row" : "column",
              alignItems: isWide ? "flex-start" : "stretch",
              justifyContent: "center",
              gap: isWide ? 48 : 24,
            }}
          >
            {isWide ? (
              <>
                <View style={{ width: "100%", flex: 1, maxWidth: 576 }}>
                  <AuthPageIntro variant={variant} />
                </View>
                <View
                  style={{
                    width: "100%",
                    flex: 1,
                    maxWidth: 448,
                    alignSelf: "flex-start",
                    gap: 16,
                  }}
                >
                  <InAppBrowserNotice />
                  <AuthClerkCard variant={variant}>{children}</AuthClerkCard>
                  <AuthRedirectNotice mode={variant} />
                  <AuthSupportNotice mode={variant} />
                </View>
              </>
            ) : (
              <>
                <View style={{ width: "100%", maxWidth: 448, alignSelf: "center", gap: 16 }}>
                  <InAppBrowserNotice />
                  <AuthClerkCard variant={variant}>{children}</AuthClerkCard>
                  <AuthRedirectNotice mode={variant} />
                  <AuthSupportNotice mode={variant} />
                </View>
                <View style={{ width: "100%", maxWidth: 576, alignSelf: "center" }}>
                  <AuthPageIntro variant={variant} />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
