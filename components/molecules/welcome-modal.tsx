import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { color, palette } from "@/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Animated, Modal, Text, Pressable, View, Platform, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { navigate } from "@/lib/navigation/app-routes";
import { trpc } from "@/lib/trpc";

// キャラクター画像
const CHARACTER_IMAGE = "https://pbs.twimg.com/media/GrPNmKMbYAA0jyU?format=png&name=small";

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  userProfileImage?: string;
  prefecture?: string;
}

export function WelcomeModal({
  visible,
  onClose,
  userName,
  userProfileImage,
  prefecture,
}: WelcomeModalProps) {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  // ユーザーの参加チャレンジ数を取得
  const { data: participations } = trpc.participations.myParticipations.useQuery(
    undefined,
    { enabled: visible }
  );

  // ユーザーの主催チャレンジを取得
  const { data: hostedChallenges } = trpc.events.myEvents.useQuery(
    undefined,
    { enabled: visible }
  );

  const participationCount = participations?.length ?? 0;
  const hostedCount = hostedChallenges?.length ?? 0;
  const isHost = hostedCount > 0;

  // 総参加者数（主催チャレンジの合計）
  const totalParticipants = hostedChallenges?.reduce<number>(
    (sum, c) => sum + (c.currentValue ?? 0),
    0
  ) ?? 0;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, scaleAnim, visible]);

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleFindChallenge = () => {
    handleClose();
    navigate.toHome();
  };

  const handleCreateChallenge = () => {
    handleClose();
    navigate.toCreate();
  };

  const handleViewDashboard = () => {
    handleClose();
    if (hostedChallenges && hostedChallenges.length > 0) {
      navigate.toDashboard(hostedChallenges[0].id);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: palette.black + "CC",
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeAnim,
        }}
      >
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={handleClose}
        />

        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            width: "90%",
            maxWidth: 380,
            maxHeight: "85%",
          }}
        >
          <View
            style={{
              backgroundColor: color.surface,
              borderRadius: 24,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: color.border,
            }}
          >
            {/* ヘッダー */}
            <LinearGradient
              colors={[color.accentPrimary, color.accentAlt]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 20,
                paddingHorizontal: 20,
                alignItems: "center",
              }}
            >
              {/* キャラクターとユーザーアイコン */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Image
                  source={{ uri: CHARACTER_IMAGE }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    borderWidth: 2,
                    borderColor: color.textWhite,
                  }}
                />
                <View
                  style={{
                    marginHorizontal: 8,
                    backgroundColor: palette.white + "33",
                    borderRadius: 16,
                    padding: 6,
                  }}
                >
                  <MaterialIcons name="favorite" size={20} color={color.textWhite} />
                </View>
                {userProfileImage ? (
                  <Image
                    source={{ uri: userProfileImage }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: 2,
                      borderColor: color.textWhite,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: palette.white + "33",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: color.textWhite,
                    }}
                  >
                    <MaterialIcons name="person" size={30} color={color.textWhite} />
                  </View>
                )}
              </View>

              <Text
                style={{
                  color: color.textWhite,
                  fontSize: 20,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                おかえりなさい、{userName || "ゲスト"}さん！
              </Text>
            </LinearGradient>

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={{ padding: 20 }}>
                {/* あなたの地域 */}
                {prefecture && (
                  <View
                    style={{
                      backgroundColor: color.bg,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 16,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: color.accentPrimary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <FontAwesome5 name="map-marker-alt" size={18} color={color.accentPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: color.textMuted, fontSize: 12 }}>あなたの地域</Text>
                      <Text style={{ color: color.textPrimary, fontSize: 16, fontWeight: "600" }}>
                        {prefecture}
                      </Text>
                    </View>
                  </View>
                )}

                {/* ファン向けセクション */}
                <View
                  style={{
                    backgroundColor: color.bg,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <FontAwesome5 name="heart" size={16} color={color.danger} />
                    <Text
                      style={{
                        color: color.textPrimary,
                        fontSize: 14,
                        fontWeight: "600",
                        marginLeft: 8,
                      }}
                    >
                      ファンとして
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 12 }}>
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text style={{ color: color.accentPrimary, fontSize: 24, fontWeight: "bold" }}>
                        {participationCount}
                      </Text>
                      <Text style={{ color: color.textMuted, fontSize: 12 }}>参加中</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={handleFindChallenge}
                    style={({ pressed }) => [
                      {
                        backgroundColor: color.accentPrimary,
                        borderRadius: 8,
                        paddingVertical: 12,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                      },
                      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <FontAwesome5 name="search" size={14} color={color.textWhite} />
                    <Text
                      style={{
                        color: color.textWhite,
                        fontSize: 14,
                        fontWeight: "600",
                        marginLeft: 8,
                      }}
                    >
                      推しのチャレンジを探す
                    </Text>
                  </Pressable>
                </View>

                {/* 主催者向けセクション */}
                <View
                  style={{
                    backgroundColor: color.bg,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <FontAwesome5 name="crown" size={16} color={color.warning} />
                    <Text
                      style={{
                        color: color.textPrimary,
                        fontSize: 14,
                        fontWeight: "600",
                        marginLeft: 8,
                      }}
                    >
                      主催者として
                    </Text>
                  </View>

                  {isHost ? (
                    <>
                      <View style={{ flexDirection: "row", marginBottom: 12 }}>
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text style={{ color: color.warning, fontSize: 24, fontWeight: "bold" }}>
                            {hostedCount}
                          </Text>
                          <Text style={{ color: color.textMuted, fontSize: 12 }}>主催中</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text style={{ color: color.success, fontSize: 24, fontWeight: "bold" }}>
                            {totalParticipants}
                          </Text>
                          <Text style={{ color: color.textMuted, fontSize: 12 }}>総参加者</Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={handleViewDashboard}
                        style={({ pressed }) => [
                          {
                            backgroundColor: color.warning,
                            borderRadius: 8,
                            paddingVertical: 12,
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                          },
                          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                        ]}
                      >
                        <FontAwesome5 name="chart-bar" size={14} color={color.textWhite} />
                        <Text
                          style={{
                            color: color.textWhite,
                            fontSize: 14,
                            fontWeight: "600",
                            marginLeft: 8,
                          }}
                        >
                          ダッシュボードを見る
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Text
                        style={{
                          color: color.textMuted,
                          fontSize: 13,
                          textAlign: "center",
                          marginBottom: 12,
                          lineHeight: 20,
                        }}
                      >
                        あなたもチャレンジを作成して{"\n"}ファンを集めてみませんか？
                      </Text>

                      <Pressable
                        onPress={handleCreateChallenge}
                        style={({ pressed }) => [
                          {
                            backgroundColor: color.warning,
                            borderRadius: 8,
                            paddingVertical: 12,
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                          },
                          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                        ]}
                      >
                        <FontAwesome5 name="plus" size={14} color={color.textWhite} />
                        <Text
                          style={{
                            color: color.textWhite,
                            fontSize: 14,
                            fontWeight: "600",
                            marginLeft: 8,
                          }}
                        >
                          チャレンジを作成する
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>

                {/* 閉じるボタン */}
                <Pressable
                  onPress={handleClose}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 12,
                      alignItems: "center",
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={{ color: color.textMuted, fontSize: 14 }}>
                    閉じる
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
