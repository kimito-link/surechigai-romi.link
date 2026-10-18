import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, palette } from "@/theme/tokens";

const AVATAR_RINKU = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");
const AVATAR_KONTA = require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png");
const AVATAR_TANUNE = require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png");

const BLUE_06 = `${palette.kimitoBlue}0F`;
const BLUE_10 = `${palette.kimitoBlue}1A`;
const BLUE_18 = `${palette.kimitoBlue}2E`;
const BLUE_45 = `${palette.kimitoBlue}73`;
const ORANGE_14 = `${palette.kimitoOrange}24`;
const ROAD = palette.kimitoBorderSoft;
const BLOCK_FILL = palette.kimitoBg;

/** ヒーロー全面描画用。高さは親(hero)が決め、このSurfaceは常にabsoluteFillで埋める。 */
function PreviewSurface({ children }: { children: React.ReactNode }) {
  return <View style={styles.surface}>{children}</View>;
}

/** ポートレート基準の道路グリッド。slice方式でどのアスペクト比でも余白なく全面を埋める。 */
function RoadGrid({
  children,
  overlay,
}: {
  children: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <PreviewSurface>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 560"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect x="0" y="0" width="390" height="560" fill={palette.white} />
        {/* 街区ブロック（地図らしい面密度を出す） */}
        <Rect x="16" y="18" width="90" height="74" rx="6" fill={BLOCK_FILL} />
        <Rect x="130" y="16" width="110" height="68" rx="6" fill={BLOCK_FILL} />
        <Rect x="262" y="20" width="112" height="62" rx="6" fill={BLOCK_FILL} />
        <Rect x="20" y="132" width="98" height="142" rx="6" fill={BLOCK_FILL} />
        <Rect x="242" y="118" width="128" height="164" rx="6" fill={BLOCK_FILL} />
        <Rect x="28" y="330" width="112" height="114" rx="6" fill={BLOCK_FILL} />
        <Rect x="234" y="340" width="134" height="96" rx="6" fill={BLOCK_FILL} />
        {/* 主要幹線道路 */}
        <Line x1="60" y1="0" x2="150" y2="560" stroke={ROAD} strokeWidth="6" />
        <Line x1="220" y1="0" x2="180" y2="560" stroke={ROAD} strokeWidth="5" />
        <Line x1="340" y1="0" x2="290" y2="560" stroke={ROAD} strokeWidth="3" />
        <Line x1="0" y1="112" x2="390" y2="92" stroke={ROAD} strokeWidth="5" />
        <Line x1="0" y1="304" x2="390" y2="322" stroke={ROAD} strokeWidth="6" />
        <Line x1="0" y1="468" x2="390" y2="448" stroke={ROAD} strokeWidth="4" />
        {/* 鉄道ライン（破線） */}
        <Line
          x1="12"
          y1="210"
          x2="378"
          y2="178"
          stroke={BLUE_18}
          strokeWidth="2"
          strokeDasharray="6,6"
        />
        {children}
      </Svg>
      {overlay}
    </PreviewSurface>
  );
}

export function CheckinGuestPreview() {
  return (
    <RoadGrid
      overlay={
        <>
          <View style={styles.mapPinCenterWrap} pointerEvents="none">
            <View style={styles.speechBubbleOrange}>
              <Text style={styles.speechBubbleOrangeText} numberOfLines={1}>
                「渋谷区 にいるよ！」
              </Text>
            </View>
            <View style={[styles.avatarPinRing, styles.avatarPinRingOrange]}>
              <Image
                source={AVATAR_RINKU}
                accessibilityLabel="りんくのアイコン"
                style={styles.avatarPinImg}
                contentFit="cover"
              />
            </View>
            <View style={styles.pinHandlePill}>
              <Text style={styles.pinHandleText} numberOfLines={1}>
                @kimitolink · #聖地巡礼
              </Text>
            </View>
          </View>
          <View style={styles.checkinCardOverlay}>
            <View style={styles.checkinBadgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.checkinMetaText}>
                GPS固定 · 𝕏 絵札OGPで同じ趣味に届く
              </Text>
            </View>
            <Text style={styles.checkinPlaceTitle}>渋谷区道玄坂・東京都</Text>
            <Text style={styles.checkinCoordText}>
              35.6595°N, 139.7005°E · H3 r8 · 同じ場所の 𝕏 仲間と交差
            </Text>
          </View>
        </>
      }
    >
      <Circle cx="195" cy="250" r="108" fill={BLUE_06} stroke={BLUE_18} strokeWidth="1" />
      <Circle cx="195" cy="250" r="68" fill={BLUE_10} stroke={BLUE_45} strokeWidth="1.5" />
      <Circle cx="195" cy="250" r="32" fill={ORANGE_14} />
      <Circle cx="128" cy="198" r="6" fill={palette.kimitoBlue} />
      <Circle cx="268" cy="308" r="6" fill={palette.kimitoBlue} />
    </RoadGrid>
  );
}

export function TrailGuestPreview() {
  return (
    <RoadGrid
      overlay={
        <>
          <View style={styles.trailFloatingUsers} pointerEvents="none">
            <View style={styles.trailUserChip}>
              <Image
                source={AVATAR_KONTA}
                accessibilityLabel="こん太のアイコン"
                style={styles.trailUserAvatar}
                contentFit="cover"
              />
              <Text style={styles.trailUserText} numberOfLines={1}>
                「東京駅で交差！」 @konta_tabi
              </Text>
            </View>
            <View style={styles.trailUserChip}>
              <Image
                source={AVATAR_TANUNE}
                accessibilityLabel="たぬ姉のアイコン"
                style={styles.trailUserAvatar}
                contentFit="cover"
              />
              <Text style={styles.trailUserText} numberOfLines={1}>
                「聖地巡礼中！」 @tanunee_ch
              </Text>
            </View>
          </View>
          <View style={styles.trailCardOverlay}>
            <View style={styles.trailBadgeRow}>
              <MaterialIcons name="timeline" size={14} color={palette.kimitoBlue} />
              <Text style={styles.trailOverlayTitle}>
                今日の軌跡 · 4地点で 3人の 𝕏 旅人と交差
              </Text>
            </View>
            <Text style={styles.trailOverlaySub}>
              秋葉原 → 神田 → 東京駅 → 有楽町（#聖地巡礼 #推し活）
            </Text>
          </View>
        </>
      }
    >
      <Polyline
        points="90,420 145,350 175,260 235,220 280,150"
        fill="none"
        stroke={BLUE_18}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="90,420 145,350 175,260 235,220 280,150"
        fill="none"
        stroke={palette.kimitoBlue}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[90, 145, 175, 235].map((x, idx) => (
        <Circle
          key={x}
          cx={x}
          cy={[420, 350, 260, 220][idx]}
          r="7"
          fill={palette.white}
          stroke={palette.kimitoBlue}
          strokeWidth="2.5"
        />
      ))}
      <Circle cx="280" cy="150" r="56" fill={BLUE_10} stroke={BLUE_45} strokeWidth="1.5" />
      <Circle cx="280" cy="150" r="12" fill={palette.white} />
      <Circle cx="280" cy="150" r="8" fill={palette.kimitoOrange} />
    </RoadGrid>
  );
}

export function RadarGuestPreview() {
  return (
    <PreviewSurface>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 480 340"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect x="0" y="0" width="480" height="340" fill={palette.white} />
        {/* 街区ブロック（地図の密度と現在地らしさ） */}
        <Rect x="16" y="16" width="110" height="72" rx="6" fill={BLOCK_FILL} />
        <Rect x="148" y="14" width="136" height="64" rx="6" fill={BLOCK_FILL} />
        <Rect x="308" y="18" width="152" height="70" rx="6" fill={BLOCK_FILL} />
        <Rect x="14" y="112" width="96" height="112" rx="6" fill={BLOCK_FILL} />
        <Rect x="358" y="114" width="106" height="110" rx="6" fill={BLOCK_FILL} />
        <Rect x="22" y="246" width="124" height="78" rx="6" fill={BLOCK_FILL} />
        <Rect x="328" y="248" width="134" height="76" rx="6" fill={BLOCK_FILL} />

        {/* 周辺道路グリッド */}
        <Line x1="136" y1="0" x2="118" y2="340" stroke={ROAD} strokeWidth="5" />
        <Line x1="296" y1="0" x2="318" y2="340" stroke={ROAD} strokeWidth="5" />
        <Line x1="0" y1="98" x2="480" y2="86" stroke={ROAD} strokeWidth="5" />
        <Line x1="0" y1="236" x2="480" y2="244" stroke={ROAD} strokeWidth="5" />
        <Line
          x1="0"
          y1="166"
          x2="480"
          y2="152"
          stroke={BLUE_18}
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* 過去の移動軌跡ライン */}
        <Polyline
          points="86,248 148,196 196,168 240,148"
          fill="none"
          stroke={palette.kimitoBlue}
          strokeWidth="3"
          strokeDasharray="4,4"
          strokeOpacity="0.65"
        />
        <Circle cx="86" cy="248" r="4.5" fill={palette.white} stroke={palette.kimitoBlue} strokeWidth="2" />
        <Circle cx="148" cy="196" r="4.5" fill={palette.white} stroke={palette.kimitoBlue} strokeWidth="2" />

        {/* レーダー同心円と精度円 */}
        <Circle cx="240" cy="148" r="118" fill="none" stroke={BLUE_18} strokeWidth="1.2" />
        <Circle cx="240" cy="148" r="80" fill={BLUE_06} stroke={BLUE_18} strokeWidth="1.5" />
        <Circle cx="240" cy="148" r="42" fill={BLUE_10} stroke={BLUE_45} strokeWidth="1.5" />

        {/* 十字走査線とスキャンライン */}
        <Line x1="240" y1="22" x2="240" y2="274" stroke={ROAD} strokeWidth="1" />
        <Line x1="94" y1="148" x2="386" y2="148" stroke={ROAD} strokeWidth="1" />
        <Line
          x1="240"
          y1="148"
          x2="344"
          y2="82"
          stroke={palette.kimitoBlue}
          strokeWidth="2.5"
          strokeOpacity="0.5"
        />
      </Svg>

      {/* 左上: 現在地・測位精度バッジ */}
      <View style={styles.radarPlaceBadge}>
        <MaterialIcons name="my-location" size={14} color={palette.kimitoBlue} />
        <Text style={styles.radarPlaceText} numberOfLines={1}>
          秋葉原電気街・東京都
        </Text>
        <Text style={styles.radarAccuracyText} numberOfLines={1}>
          ±8m
        </Text>
      </View>

      {/* 右上: 未開封のすれ違ひ封筒バッジ */}
      <View style={styles.envelope}>
        <MaterialIcons name="mail" size={15} color={palette.kimitoOrangeText} />
        <Text style={styles.envelopeBadgeText} numberOfLines={1}>
          すれ違ひ 3通
        </Text>
      </View>

      {/* 地図上に浮かぶ「使うユーザーの顔・吹き出し・@handle」（LP .basho-meguri + .ofuda-card 準拠） */}
      <View style={styles.radarCharacterStage} pointerEvents="none">
        {/* 左: こん太（#推し活） */}
        <View style={[styles.radarUserNode, styles.radarUserLeft]}>
          <View style={styles.speechBubbleWhite}>
            <Text style={styles.speechBubbleText} numberOfLines={1}>
              どこかな？
            </Text>
          </View>
          <View style={[styles.radarAvatarCircle, styles.radarAvatarBlue]}>
            <Image
              source={AVATAR_KONTA}
              accessibilityLabel="こん太のアイコン"
              style={styles.radarAvatarImg}
              contentFit="cover"
            />
          </View>
          <View style={styles.radarHandleTag}>
            <Text style={styles.radarHandleTagText} numberOfLines={1}>
              #推し活
            </Text>
          </View>
        </View>

        {/* 中央: りんく（現在地・あなた） */}
        <View style={[styles.radarUserNode, styles.radarUserCenter]}>
          <View style={styles.speechBubbleOrange}>
            <Text style={styles.speechBubbleOrangeText} numberOfLines={1}>
              秋葉原にいるよ
            </Text>
          </View>
          <View style={[styles.radarAvatarCircleLarge, styles.radarAvatarOrange]}>
            <Image
              source={AVATAR_RINKU}
              accessibilityLabel="りんくのアイコン"
              style={styles.radarAvatarImgLarge}
              contentFit="cover"
            />
          </View>
          <View style={styles.radarHandleTagPrimary}>
            <Text style={styles.radarHandleTagPrimaryText} numberOfLines={1}>
              @kimitolink
            </Text>
          </View>
        </View>

        {/* 右: たぬ姉（#配信・聖地） */}
        <View style={[styles.radarUserNode, styles.radarUserRight]}>
          <View style={styles.speechBubbleWhite}>
            <Text style={styles.speechBubbleText} numberOfLines={1}>
              いたいた！
            </Text>
          </View>
          <View style={[styles.radarAvatarCircle, styles.radarAvatarBlue]}>
            <Image
              source={AVATAR_TANUNE}
              accessibilityLabel="たぬ姉のアイコン"
              style={styles.radarAvatarImg}
              contentFit="cover"
            />
          </View>
          <View style={styles.radarHandleTag}>
            <Text style={styles.radarHandleTagText} numberOfLines={1}>
              #聖地巡礼
            </Text>
          </View>
        </View>
      </View>

      {/* 下部: 受信したすれ違ひ＆Xフォロワー増加の実感カード */}
      <View style={styles.radarBottomCard}>
        <View style={styles.radarSignalRow}>
          <View style={styles.radarBottomAvatarWrap}>
            <Image
              source={AVATAR_KONTA}
              accessibilityLabel="すれ違ひ相手のアイコン"
              style={styles.radarBottomAvatar}
              contentFit="cover"
            />
          </View>
          <View style={styles.radarSignalBody}>
            <View style={styles.radarSignalTitleRow}>
              <Text style={styles.radarSignalTitle} numberOfLines={1}>
                こん太 @konta_tabi と秋葉原で交差！
              </Text>
              <View style={styles.followerGainBadge}>
                <Text style={styles.followerGainText} numberOfLines={1}>
                  𝕏 同趣味 +1
                </Text>
              </View>
            </View>
            <Text style={styles.radarSignalSub} numberOfLines={1}>
              #推し活 #聖地巡礼 · 同じ場所を歩く人同士でフォロワーが増える
            </Text>
          </View>
        </View>
      </View>
    </PreviewSurface>
  );
}

export function MypageGuestPreview() {
  return (
    <PreviewSurface>
      <View style={styles.mypagePreviewCenter}>
        <View style={styles.profileMock}>
          <View style={styles.avatarGhost}>
            <MaterialIcons name="person" size={44} color={color.textHint} />
          </View>
          <View style={styles.skeletonStack}>
            <View style={[styles.skeleton, { width: "68%" }]} />
            <View style={[styles.skeleton, { width: "92%" }]} />
            <View style={[styles.skeleton, { width: "78%" }]} />
          </View>
        </View>
        <View style={styles.settingsMock}>
          {["公開範囲", "一時停止", "X連携"].map((label) => (
            <View key={label} style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>{label}</Text>
              <View style={styles.settingsPill} />
            </View>
          ))}
        </View>
      </View>
    </PreviewSurface>
  );
}

export function EventsGuestPreview() {
  return null;
}

const styles = StyleSheet.create({
  surface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.kimitoOrange,
  },
  checkinCardOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 64,
    backgroundColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  checkinBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkinMetaText: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  checkinPlaceTitle: {
    color: palette.kimitoBlue,
    fontSize: 15,
    fontWeight: "800",
  },
  checkinCoordText: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  trailCardOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 64,
    backgroundColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
  },
  trailBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trailOverlayTitle: {
    color: palette.kimitoBlue,
    fontSize: 13,
    fontWeight: "800",
  },
  trailOverlaySub: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  radarPlaceBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    maxWidth: "62%",
  },
  radarPlaceText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
    flexShrink: 1,
  },
  radarAccuracyText: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  envelope: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  envelopeBadgeText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  radarBottomCard: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  radarSignalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radarBottomAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: palette.kimitoOrange,
    backgroundColor: palette.white,
    overflow: "hidden",
    flexShrink: 0,
  },
  radarBottomAvatar: {
    width: 32,
    height: 32,
  },
  radarSignalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.kimitoBlueSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radarSignalBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  radarSignalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  radarSignalTitle: {
    color: color.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  followerGainBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#FFF3E8",
    borderWidth: 1,
    borderColor: palette.kimitoOrange,
    flexShrink: 0,
  },
  followerGainText: {
    color: palette.kimitoOrangeText,
    fontSize: 12,
    fontWeight: "800",
  },
  radarSignalTime: {
    color: palette.kimitoOrangeText,
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 0,
  },
  radarSignalSub: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  radarCharacterStage: {
    position: "absolute",
    top: 44,
    left: 8,
    right: 8,
    bottom: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  radarUserNode: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  radarUserLeft: {
    marginTop: 8,
  },
  radarUserCenter: {
    marginTop: -6,
  },
  radarUserRight: {
    marginTop: 14,
  },
  speechBubbleWhite: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.kimitoBlue,
  },
  speechBubbleText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  speechBubbleOrange: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#FFF3E8",
    borderWidth: 1.5,
    borderColor: palette.kimitoOrange,
  },
  speechBubbleOrangeText: {
    color: palette.kimitoOrangeText,
    fontSize: 12,
    fontWeight: "800",
  },
  radarAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.white,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  radarAvatarCircleLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.white,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  radarAvatarBlue: {
    borderColor: palette.kimitoBlue,
  },
  radarAvatarOrange: {
    borderColor: palette.kimitoOrange,
  },
  radarAvatarImg: {
    width: 40,
    height: 40,
  },
  radarAvatarImgLarge: {
    width: 48,
    height: 48,
  },
  radarHandleTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  radarHandleTagText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  radarHandleTagPrimary: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: palette.kimitoBlue,
  },
  radarHandleTagPrimaryText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: "800",
  },
  mapPinCenterWrap: {
    position: "absolute",
    top: "26%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  avatarPinRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: palette.white,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarPinRingOrange: {
    borderColor: palette.kimitoOrange,
  },
  avatarPinImg: {
    width: 52,
    height: 52,
  },
  pinHandlePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  pinHandleText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  trailFloatingUsers: {
    position: "absolute",
    top: "24%",
    left: 16,
    right: 16,
    gap: 8,
    alignItems: "center",
  },
  trailUserChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.kimitoBlue,
  },
  trailUserAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  trailUserText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  mypagePreviewCenter: {
    flex: 1,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    justifyContent: "center",
  },
  profileMock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 28,
  },
  avatarGhost: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.kimitoBorderSoft,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.72,
  },
  skeletonStack: {
    flex: 1,
    gap: 10,
  },
  skeleton: {
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.kimitoBorderSoft,
  },
  settingsMock: {
    marginTop: 24,
    paddingHorizontal: 28,
    gap: 10,
  },
  settingsRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsLabel: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  settingsPill: {
    width: 42,
    height: 18,
    borderRadius: 999,
    backgroundColor: palette.kimitoBorderSoft,
  },
});
