import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useAuthHandoff } from "@/lib/auth-handoff-context";
import { buildSignInAutoXHref } from "@/lib/clerk-route";
import { navigateReplace } from "@/lib/navigation";
import { color, palette } from "@/theme/tokens";

export default function KimitoLinkAuthGuideScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();
  const { showHandoff } = useAuthHandoff();

  useEffect(() => {
    if (!isAuthReadyForUI) return;
    showHandoff("x");
    if (isAuthenticated) {
      navigateReplace.toHomeRoot();
    } else {
      navigateReplace.withUrl(buildSignInAutoXHref("/"));
    }
  }, [isAuthenticated, isAuthReadyForUI, showHandoff]);

  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      <ActivityIndicator color={palette.kimitoBlue} />
      <Text style={styles.text}>X に接続中…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: palette.kimitoBg,
  },
  text: {
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
});
