/**
 * CharacterDetailModal Component
 * キャラクター詳細を表示するモーダル
 */

import { View, Text, ScrollView, ImageSourcePropType } from "react-native";
import { Image } from "expo-image";
import { Modal } from "./modal";
import { Button } from "./button";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

export interface CharacterInfo {
  /** 一意の識別子 */
  id: string;
  /** キャラクター名 */
  name: string;
  /** キャラクターの性別 */
  gender?: "male" | "female";
  /** キャラクター画像 */
  image: ImageSourcePropType;
  /** キャラクターの説明 */
  description: string;
  /** キャラクターの特徴・性格 */
  personality?: string;
  /** キャラクターの好きなもの */
  likes?: string[];
  /** キャラクターのテーマカラー */
  themeColor: string;
  /** キャラクターの一言 */
  catchphrase?: string;
}

export interface CharacterDetailModalProps {
  /** モーダルの表示状態 */
  visible: boolean;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** 表示するキャラクター情報 */
  character: CharacterInfo | null;
}

/**
 * キャラクター詳細を表示するモーダル
 * 
 * @example
 * ```tsx
 * <CharacterDetailModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   character={{
 *     id: "link",
 *     name: "君斗りんく",
 *     image: require("@/assets/images/link.png"),
 *     description: "動員ちゃれんじのメインキャラクター",
 *     themeColor: palette.pink500,
 *   }}
 * />
 * ```
 */
export function CharacterDetailModal({
  visible,
  onClose,
  character,
}: CharacterDetailModalProps) {
  const colors = useColors();

  if (!character) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={character.name}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* キャラクター画像 */}
        <View style={{ 
          alignItems: "center", 
          marginBottom: 20,
          paddingTop: 8,
        }}>
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 4,
            borderColor: character.themeColor,
            overflow: "hidden",
            backgroundColor: `${character.themeColor}20`,
          }}>
            <Image
              source={character.image}
              style={{ width: 112, height: 112 }}
              contentFit="cover"
            />
          </View>
          {/* 性別表示 */}
          {character.gender && (
            <View style={{
              marginTop: 8,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: character.gender === "male" ? color.info : color.accentPrimary,
            }}>
              <Text style={{
                color: color.textWhite,
                fontSize: 12,
                fontWeight: "600",
              }}>
                {character.gender === "male" ? "♂ 男性" : "♀ 女性"}
              </Text>
            </View>
          )}
        </View>

        {/* キャッチフレーズ */}
        {character.catchphrase && (
          <View style={{
            backgroundColor: `${character.themeColor}15`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: character.themeColor,
          }}>
            <Text style={{
              color: colors.foreground,
              fontSize: 16,
              fontStyle: "italic",
              textAlign: "center",
              lineHeight: 24,
            }}>
              「{character.catchphrase}」
            </Text>
          </View>
        )}

        {/* 説明 */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            color: colors.foreground,
            fontSize: 14,
            lineHeight: 22,
          }}>
            {character.description}
          </Text>
        </View>

        {/* 性格・特徴 */}
        {character.personality && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              color: character.themeColor,
              fontSize: 13,
              fontWeight: "bold",
              marginBottom: 8,
            }}>
              性格・特徴
            </Text>
            <Text style={{
              color: colors.foreground,
              fontSize: 14,
              lineHeight: 22,
            }}>
              {character.personality}
            </Text>
          </View>
        )}

        {/* 好きなもの */}
        {character.likes && character.likes.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              color: character.themeColor,
              fontSize: 13,
              fontWeight: "bold",
              marginBottom: 8,
            }}>
              好きなもの
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {character.likes.map((like, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: `${character.themeColor}20`,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{
                    color: character.themeColor,
                    fontSize: 13,
                  }}>
                    {like}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 閉じるボタン */}
        <Button
          onPress={onClose}
          style={{
            backgroundColor: character.themeColor,
            marginTop: 8,
          }}
        >
          閉じる
        </Button>
      </ScrollView>
    </Modal>
  );
}
