/**
 * PatternSelector Component
 * パターン切り替えボタンとインジケーター
 */

import { View, Text } from "react-native";
import { Button } from "@/components/ui/button";
import { mypageText, mypageUI, mypageFont } from "../../ui/theme/tokens";
import { loginPatterns, getRandomPattern, type LoginPattern } from "./constants";

interface PatternSelectorProps {
  currentPattern: LoginPattern;
  onPatternChange: (pattern: LoginPattern) => void;
}

export function PatternSelector({ currentPattern, onPatternChange }: PatternSelectorProps) {
  return (
    <>
      {/* パターン切り替えボタン */}
      <Button
        variant="ghost"
        onPress={() => onPatternChange(getRandomPattern())}
        icon="refresh"
        style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          marginTop: 16,
        }}
      >
        <Text style={{ color: mypageText.muted, fontSize: mypageFont.meta, marginLeft: 6 }}>
          他のキャラクターのメッセージを見る
        </Text>
      </Button>

      {/* パターンインジケーター */}
      <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
        {loginPatterns.map((p) => (
          <Button
            key={p.id}
            variant="ghost"
            onPress={() => onPatternChange(p)}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: p.id === currentPattern.id ? mypageUI.patternActiveBg : mypageUI.patternInactiveBg,
              padding: 0,
              minHeight: 8,
            }}
          >
            {null}
          </Button>
        ))}
      </View>
    </>
  );
}
