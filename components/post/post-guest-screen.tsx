/**
 * ポスト画面 — 未ログイン guest 向け軽量 UI。
 * LCP: ヘッダー + タグライン + CTA を初回 paint で同期描画。
 * 下部には「使うユーザーが見える」旅人ランキング・X絵札OGPプレビュー・ゆっくり掛け合いを同期描画し、
 * tRPC準備完了後は公開クエリ（activePrefectures / creatorsByPrefecture）の実データを重ねる。
 */
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import MaterialIcons from "@/lib/icons/material-icons";
import { loginCtaNote } from "@/lib/native-app-shell";
import { BrandTagline } from "@/components/molecules/brand-tagline";
import { MARKETING_URL } from "@/lib/site-urls";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { KimitoLoginCta } from "@/components/molecules/kimito-login-cta";
import { SIGN_IN_AUTO_X_HREF } from "@/lib/clerk-route";
import { RadarGuestPreview } from "@/components/organisms/one-tap-guest-previews";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { color, palette, touchTarget } from "@/theme/tokens";
import {
  GuestHomeShellHeader,
  GUEST_HOME_HEADER_HEIGHT,
} from "@/components/post/guest-home-shell-header";
import { navigate } from "@/lib/navigation";
import { GuestPlaceContext } from "@/components/molecules/guest-place-context";
import { useWebSideNavActive } from "@/components/organisms/web-side-nav";
import { WEB_APP_FOOTER_HEIGHT } from "@/components/organisms/web-app-footer";
import { useTrpcReady } from "@/lib/trpc-ready-context";
import { trpc } from "@/lib/trpc";
import { CATEGORY_LABELS, type CategoryId } from "@/modules/encounter/core/category";

const AVATAR_RINKU = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");
const AVATAR_KONTA = require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png");
const AVATAR_TANUNE = require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png");

const GUEST_HOME_BENEFITS = [
  {
    icon: "place",
    label: "足あと",
    sub: "正確に残す",
    href: "/(tabs)/checkin" as const,
  },
  {
    icon: "public",
    label: "さがす",
    sub: "みんなの県",
    href: "/(tabs)/zukan" as const,
  },
  {
    icon: "map",
    label: "軌跡",
    sub: "聖地をたどる",
    href: "/(tabs)/map" as const,
  },
] as const;

type ShowcaseTraveler = {
  id: string;
  rank: number;
  name: string;
  handle: string;
  prefecture: string;
  categoryLabel: string;
  scoreLabel: string;
  quote: string;
  avatarSource: number | { uri: string };
  shareSlug?: string | null;
  isLive?: boolean;
};

const FALLBACK_TRAVELERS: ShowcaseTraveler[] = [
  {
    id: "rinku",
    rank: 1,
    name: "君斗りんく",
    handle: "@kimitolink",
    prefecture: "東京都",
    categoryLabel: "#聖地巡礼 #配信・VTuber",
    scoreLabel: "48 pt · 19県",
    quote: "秋葉原と渋谷で聖地巡礼中！",
    avatarSource: AVATAR_RINKU,
    isLive: true,
  },
  {
    id: "konta",
    rank: 2,
    name: "こん太",
    handle: "@konta_tabi",
    prefecture: "大阪府",
    categoryLabel: "#推し活 #グルメ",
    scoreLabel: "36 pt · 14県",
    quote: "ライブ遠征の足あと記録中！",
    avatarSource: AVATAR_KONTA,
    isLive: true,
  },
  {
    id: "tanune",
    rank: 3,
    name: "たぬ姉",
    handle: "@tanunee_ch",
    prefecture: "愛知県",
    categoryLabel: "#聖地巡礼 #温泉・サウナ",
    scoreLabel: "29 pt · 11県",
    quote: "週末ドライブで全国図鑑埋め！",
    avatarSource: AVATAR_TANUNE,
    isLive: true,
  },
];

const FOLLOWER_LOOP_STEPS = [
  {
    step: "STEP 1",
    title: "推し活現場・聖地・街で1タップ記録",
    desc: "ライブ会場やアニメ聖地、旅先で現在地を刻むだけ。生座標＋H3セルであなたの軌跡が正確に積み上がります。",
    badge: "10秒で完了",
  },
  {
    step: "STEP 2",
    title: "30日タイムシフト＆𝕏絵札で同趣味と交差",
    desc: "同じ場所を通った人にすれ違ひ封筒が届き、𝕏にシェアした「顔アイコン入り地図絵札」からも仲間が見つかります。",
    badge: "すれ違ひ成立",
  },
  {
    step: "STEP 3",
    title: "普段の𝕏と興味タグが見えるからフォロワーが増える",
    desc: "取引履歴だけのアプリと違い、普段のポストや「#推し活 #聖地巡礼」が見えるから、気が合う人に安心フォローされます。",
    badge: "𝕏 フォロワー増加",
  },
] as const;

const YUKKURI_DIALOGUES = [
  {
    speaker: "りんく",
    role: "ナビゲーター",
    avatar: AVATAR_RINKU,
    accentColor: palette.kimitoBlue,
    bgTint: palette.kimitoBlueSoft,
    align: "left" as const,
    text: "「イベントや聖地に行ったのに、同じ趣味の人とつながらない…」ってことない？ すれ違ひ通信なら、歩いた場所がそのまま 𝕏 の名刺になるよ！",
  },
  {
    speaker: "こん太",
    role: "遠征・推し活",
    avatar: AVATAR_KONTA,
    accentColor: palette.kimitoOrangeText,
    bgTint: "#FFF3E8",
    align: "right" as const,
    text: "地図に自分の 𝕏 の丸アイコンが浮かんで「渋谷区にいるよ！」って絵札でシェアできるから、同じ界隈の人が「あ、いたいた！」ってフォローしてくれるんだね！",
  },
  {
    speaker: "たぬ姉",
    role: "全国図鑑マスター",
    avatar: AVATAR_TANUNE,
    accentColor: "#0F5338",
    bgTint: "#EAF6F0",
    align: "left" as const,
    text: "使えば使うほどすれ違ひランキングや都道府県図鑑も育って、同じ興味関心のフォロワーが集まるよ。新しいパスワード不要、𝕏 で1タップで始めよう！",
  },
] as const;

/** 分割ウィンドウ・タブレット・PC（>= 720px）では2カラムのダッシュボード構成に切り替える */
const SPLIT_LAYOUT_MIN_WIDTH = 720;

function GuestLiveRankingSection({ isSplitLayout }: { isSplitLayout: boolean }) {
  const trpcReady = useTrpcReady();
  if (!trpcReady) {
    return (
      <GuestRankingBoardView
        isSplitLayout={isSplitLayout}
        travelers={FALLBACK_TRAVELERS}
        topPrefectures={[
          { prefecture: "東京都", peopleCount: 18, liveCount: 5 },
          { prefecture: "大阪府", peopleCount: 11, liveCount: 3 },
          { prefecture: "愛知県", peopleCount: 8, liveCount: 2 },
        ]}
        totalPeople={37}
      />
    );
  }
  return <GuestLiveRankingSectionInner isSplitLayout={isSplitLayout} />;
}

function GuestLiveRankingSectionInner({ isSplitLayout }: { isSplitLayout: boolean }) {
  const { data: prefData } = trpc.zukan.activePrefectures.useQuery(undefined, {
    staleTime: 60_000,
    retry: 1,
  });

  const sortedPrefs = [...(prefData?.prefectures ?? [])].sort(
    (a, b) => b.peopleCount - a.peopleCount,
  );
  const topPrefName = sortedPrefs[0]?.prefecture ?? "東京都";

  const { data: creatorData } = trpc.zukan.creatorsByPrefecture.useQuery(
    { prefecture: topPrefName },
    {
      staleTime: 60_000,
      retry: 1,
    },
  );

  const liveCreators = creatorData?.creators ?? [];
  const mergedTravelers: ShowcaseTraveler[] = [];

  for (let i = 0; i < liveCreators.length && mergedTravelers.length < 3; i += 1) {
    const c = liveCreators[i];
    const catLabels =
      c.categories && c.categories.length > 0
        ? c.categories
            .slice(0, 2)
            .map((cat) => `#${CATEGORY_LABELS[cat as CategoryId] ?? cat}`)
            .join(" ")
        : "#聖地巡礼 #推し活";
    const fallbackAvatar =
      [AVATAR_RINKU, AVATAR_KONTA, AVATAR_TANUNE][i % 3] ?? AVATAR_RINKU;
    mergedTravelers.push({
      id: `live-${c.userId}`,
      rank: mergedTravelers.length + 1,
      name: c.displayName || c.twitterHandle || "旅人",
      handle: c.twitterHandle ? `@${c.twitterHandle.replace(/^@/, "")}` : "@traveler",
      prefecture: topPrefName,
      categoryLabel: catLabels,
      scoreLabel: c.isLive ? "LIVE 滞在中" : "公開足あと記録中",
      quote: `${topPrefName}で現在地を刻みました！`,
      avatarSource: c.profileImage ? { uri: c.profileImage } : fallbackAvatar,
      shareSlug: c.shareSlug,
      isLive: c.isLive,
    });
  }

  for (const fb of FALLBACK_TRAVELERS) {
    if (mergedTravelers.length >= 3) break;
    mergedTravelers.push({
      ...fb,
      rank: mergedTravelers.length + 1,
    });
  }

  const topPrefectures =
    sortedPrefs.length >= 3
      ? sortedPrefs.slice(0, 3)
      : [
          ...sortedPrefs,
          ...[
            { prefecture: "東京都", peopleCount: 18, liveCount: 5 },
            { prefecture: "大阪府", peopleCount: 11, liveCount: 3 },
            { prefecture: "愛知県", peopleCount: 8, liveCount: 2 },
          ].filter((d) => !sortedPrefs.some((s) => s.prefecture === d.prefecture)),
        ].slice(0, 3);

  const totalPeople =
    prefData?.totalPeople && prefData.totalPeople > 0 ? prefData.totalPeople : 37;

  return (
    <GuestRankingBoardView
      isSplitLayout={isSplitLayout}
      travelers={mergedTravelers}
      topPrefectures={topPrefectures}
      totalPeople={totalPeople}
    />
  );
}

function GuestRankingBoardView({
  isSplitLayout,
  travelers,
  topPrefectures,
  totalPeople,
}: {
  isSplitLayout: boolean;
  travelers: ShowcaseTraveler[];
  topPrefectures: { prefecture: string; peopleCount: number; liveCount: number }[];
  totalPeople: number;
}) {
  return (
    <View style={styles.sectionCard}>
      {/* セクションヘッダー */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Image
            source={AVATAR_RINKU}
            accessibilityLabel="りんく案内アイコン"
            style={styles.sectionMascotAvatar}
            contentFit="cover"
          />
          <View style={styles.sectionTitleWrap}>
            <View style={styles.sectionKickerRow}>
              <Text style={styles.sectionKickerText}>
                USER RANKING & ACTIVE TRAVELERS
              </Text>
              <View style={styles.liveCountPill}>
                <View style={styles.kickerDot} />
                <Text style={styles.liveCountPillText}>
                  いま {totalPeople}人が足あと公開中
                </Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>
              いま旅している 𝕏 ユーザー＆すれ違ひランキング
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="みんなの現在地・全国図鑑を見る"
          onPress={() => navigate.toTabPath("/(tabs)/zukan")}
          style={({ pressed }) => [
            styles.sectionActionBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.sectionActionBtnText}>全国図鑑を見る</Text>
          <MaterialIcons name="chevron-right" size={16} color={palette.kimitoBlue} />
        </Pressable>
      </View>

      <Text style={styles.sectionLeadText}>
        どんな人がどこを歩いているか一目でわかる！カードをタップすると旅人の図鑑や都道府県の足あとを見られます。
      </Text>

      {/* Part 1: 旅人タイル一覧（tsuioku-no-kirameki .tiles / .tile / .tava 準拠） */}
      <View style={[styles.travelerTilesGrid, isSplitLayout && styles.travelerTilesGridRow]}>
        {travelers.map((t) => {
          const rankStyle =
            t.rank === 1
              ? styles.rankBadgeGold
              : t.rank === 2
                ? styles.rankBadgeSilver
                : styles.rankBadgeBronze;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityLabel={`${t.rank}位 ${t.name} ${t.handle} ${t.prefecture}`}
              onPress={() => {
                navigate.toZukanPrefecture(t.prefecture);
              }}
              style={({ pressed, hovered }) => [
                styles.travelerTile,
                Platform.OS === "web" && (hovered as boolean) && styles.benefitItemHover,
                pressed && { opacity: 0.88 },
              ]}
            >
              <View style={styles.travelerTileTop}>
                <View style={styles.travelerAvatarWrap}>
                  <Image
                    source={t.avatarSource}
                    accessibilityLabel={`${t.name}のアイコン`}
                    style={styles.travelerAvatarImg}
                    contentFit="cover"
                  />
                  <View style={[styles.rankBadge, rankStyle]}>
                    <Text style={styles.rankBadgeText}>#{t.rank}</Text>
                  </View>
                </View>
                <View style={styles.travelerMetaCol}>
                  <View style={styles.travelerNameRow}>
                    <Text style={styles.travelerName} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <View style={styles.travelerPrefBadge}>
                      <Text style={styles.travelerPrefBadgeText} numberOfLines={1}>
                        {t.prefecture}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.travelerHandle} numberOfLines={1}>
                    {t.handle}
                  </Text>
                  <Text style={styles.travelerCategory} numberOfLines={1}>
                    {t.categoryLabel}
                  </Text>
                </View>
              </View>
              <View style={styles.travelerQuoteBox}>
                <Text style={styles.travelerQuoteText} numberOfLines={1}>
                  💬 「{t.quote}」
                </Text>
                <Text style={styles.travelerScoreText} numberOfLines={1}>
                  {t.scoreLabel}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Part 2: 3部門ランキングボード（tsuioku-no-kirameki 3カラム ol.rank 準拠） */}
      <View style={[styles.rankColumnsWrap, isSplitLayout && styles.rankColumnsWrapRow]}>
        {/* 列1: すれ違ひ成立ランキング */}
        <View style={styles.rankColCard}>
          <View style={styles.rankColHeader}>
            <MaterialIcons name="bolt" size={16} color={palette.kimitoOrangeText} />
            <Text style={styles.rankColTitle}>すれ違ひ成立数 TOP3</Text>
          </View>
          {[
            { rank: 1, name: "君斗りんく", handle: "@kimitolink", val: "48回" },
            { rank: 2, name: "こん太", handle: "@konta_tabi", val: "36回" },
            { rank: 3, name: "たぬ姉", handle: "@tanunee_ch", val: "29回" },
          ].map((row) => (
            <View key={row.rank} style={styles.rankRowItem}>
              <View
                style={[
                  styles.rankNumCircle,
                  row.rank === 1
                    ? styles.rankBadgeGold
                    : row.rank === 2
                      ? styles.rankBadgeSilver
                      : styles.rankBadgeBronze,
                ]}
              >
                <Text style={styles.rankNumText}>{row.rank}</Text>
              </View>
              <View style={styles.rankRowBody}>
                <Text style={styles.rankRowName} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.rankRowSub} numberOfLines={1}>
                  {row.handle}
                </Text>
              </View>
              <Text style={styles.rankRowVal}>{row.val}</Text>
            </View>
          ))}
        </View>

        {/* 列2: 同じ趣味でつながったカテゴリー TOP3 */}
        <View style={styles.rankColCard}>
          <View style={styles.rankColHeader}>
            <MaterialIcons name="favorite" size={16} color={palette.kimitoBlue} />
            <Text style={styles.rankColTitle}>人気の興味タグ TOP3</Text>
          </View>
          {[
            { rank: 1, name: "#推し活・ライブ遠征", handle: "会場すれ違ひ", val: "42%" },
            { rank: 2, name: "#聖地巡礼・アニメ", handle: "30日タイムシフト", val: "31%" },
            { rank: 3, name: "#配信・VTuber・旅", handle: "𝕏 絵札シェア", val: "27%" },
          ].map((row) => (
            <View key={row.rank} style={styles.rankRowItem}>
              <View
                style={[
                  styles.rankNumCircle,
                  row.rank === 1
                    ? styles.rankBadgeGold
                    : row.rank === 2
                      ? styles.rankBadgeSilver
                      : styles.rankBadgeBronze,
                ]}
              >
                <Text style={styles.rankNumText}>{row.rank}</Text>
              </View>
              <View style={styles.rankRowBody}>
                <Text style={styles.rankRowName} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.rankRowSub} numberOfLines={1}>
                  {row.handle}
                </Text>
              </View>
              <Text style={styles.rankRowVal}>{row.val}</Text>
            </View>
          ))}
        </View>

        {/* 列3: いま人が集まる都道府県 TOP3（実データ連動） */}
        <View style={styles.rankColCard}>
          <View style={styles.rankColHeader}>
            <MaterialIcons name="place" size={16} color={palette.kimitoBlue} />
            <Text style={styles.rankColTitle}>いま人が集まる県 TOP3</Text>
          </View>
          {topPrefectures.map((pref, idx) => (
            <Pressable
              key={pref.prefecture}
              accessibilityRole="button"
              accessibilityLabel={`${idx + 1}位 ${pref.prefecture} ${pref.peopleCount}人`}
              onPress={() => navigate.toZukanPrefecture(pref.prefecture)}
              style={({ pressed }) => [
                styles.rankRowItem,
                styles.rankRowPressable,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View
                style={[
                  styles.rankNumCircle,
                  idx === 0
                    ? styles.rankBadgeGold
                    : idx === 1
                      ? styles.rankBadgeSilver
                      : styles.rankBadgeBronze,
                ]}
              >
                <Text style={styles.rankNumText}>{idx + 1}</Text>
              </View>
              <View style={styles.rankRowBody}>
                <Text style={styles.rankRowName} numberOfLines={1}>
                  {pref.prefecture}
                </Text>
                <Text style={styles.rankRowSub} numberOfLines={1}>
                  タップして県の旅人を見る
                </Text>
              </View>
              <Text style={styles.rankRowVal}>{pref.peopleCount}人</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

/** LP .ofuda-card 再現: X タイムラインにシェアされる「顔アイコン入り現在地絵札」プレビュー */
function OfudaShareCardPreview() {
  return (
    <View style={styles.ofudaCard}>
      <View style={styles.ofudaTopRow}>
        <View style={styles.ofudaBrandBadge}>
          <Text style={styles.ofudaBrandBadgeText}>
            𝕏 絵札シェア（OGP実物プレビュー）
          </Text>
        </View>
        <Text style={styles.ofudaDomainText}>surechigai.kimito.link</Text>
      </View>

      <View style={styles.ofudaMapStage}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 360 150"
          preserveAspectRatio="xMidYMid slice"
        >
          <Rect x="0" y="0" width="360" height="150" fill="#081226" />
          {/* 経緯度グリッド */}
          <Line x1="0" y1="38" x2="360" y2="38" stroke="#162B4D" strokeWidth="1" />
          <Line x1="0" y1="75" x2="360" y2="75" stroke="#162B4D" strokeWidth="1" />
          <Line x1="0" y1="112" x2="360" y2="112" stroke="#162B4D" strokeWidth="1" />
          <Line x1="90" y1="0" x2="90" y2="150" stroke="#162B4D" strokeWidth="1" />
          <Line x1="180" y1="0" x2="180" y2="150" stroke="#162B4D" strokeWidth="1" />
          <Line x1="270" y1="0" x2="270" y2="150" stroke="#162B4D" strokeWidth="1" />
          {/* 日本列島シルエット風ポリゴン */}
          <Path
            d="M70 118 L112 96 L158 88 L204 72 L248 52 L288 30 L298 44 L256 68 L216 86 L166 102 L118 114 Z"
            fill="#12284C"
            stroke="#274C85"
            strokeWidth="1.5"
          />
          {/* 全国の光る足あとドット */}
          <Circle cx="122" cy="102" r="4" fill="#38BDF8" />
          <Circle cx="156" cy="92" r="4.5" fill="#38BDF8" />
          <Circle cx="256" cy="48" r="4" fill="#38BDF8" />
          {/* 現在地（東京・渋谷）の光輪 */}
          <Circle cx="204" cy="78" r="34" fill="#FF8C2426" stroke="#FF8C24" strokeWidth="1.5" />
          <Circle cx="204" cy="78" r="18" fill="#FF8C2444" />
        </Svg>

        {/* 中央に浮かぶ X 丸アイコン + 「渋谷区 にいるよ」吹き出し */}
        <View style={styles.ofudaPinOverlay} pointerEvents="none">
          <View style={styles.ofudaSpeechBubble}>
            <Text style={styles.ofudaSpeechText} numberOfLines={1}>
              渋谷区 にいるよ
            </Text>
          </View>
          <View style={styles.ofudaAvatarRing}>
            <Image
              source={AVATAR_RINKU}
              accessibilityLabel="絵札上のXアイコン"
              style={styles.ofudaAvatarImg}
              contentFit="cover"
            />
          </View>
          <View style={styles.ofudaHandlePill}>
            <Text style={styles.ofudaHandlePillText} numberOfLines={1}>
              @kimitolink · #聖地巡礼
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.ofudaBottomCaption}>
        <Text style={styles.ofudaBottomTitle}>
          地図に浮かぶ丸は、あなたの 𝕏 の顔。
        </Text>
        <Text style={styles.ofudaBottomSub}>
          ひと目で「誰が・どこに・何の趣味で」いるかがタイムラインに伝わり、同じ興味の人からフォローされます。
        </Text>
      </View>
    </View>
  );
}

export function PostGuestScreen() {
  const tabInset = useTabBarInset();
  const openLoginGuide = useLoginGuide();
  const { width, height } = useWindowDimensions();
  const sideNavActive = useWebSideNavActive();

  const isSplitLayout = width >= SPLIT_LAYOUT_MIN_WIDTH;
  const headerOffset = Platform.OS === "web" ? GUEST_HOME_HEADER_HEIGHT : 0;
  const bottomChrome = sideNavActive ? WEB_APP_FOOTER_HEIGHT + 16 : tabInset;
  const availableHeight = Math.max(480, height - headerOffset - bottomChrome);
  const mobileRadarHeight = Math.max(216, Math.min(248, Math.round(height * 0.28)));

  const xSuperpowerMiniStrip = (
    <View style={styles.xMiniStrip}>
      <View style={styles.xMiniAvatarStack}>
        <Image
          source={AVATAR_RINKU}
          accessibilityLabel="りんく"
          style={styles.xMiniAvatar}
          contentFit="cover"
        />
        <Image
          source={AVATAR_KONTA}
          accessibilityLabel="こん太"
          style={styles.xMiniAvatar}
          contentFit="cover"
        />
        <Image
          source={AVATAR_TANUNE}
          accessibilityLabel="たぬ姉"
          style={styles.xMiniAvatar}
          contentFit="cover"
        />
      </View>
      <View style={styles.xMiniTextCol}>
        <Text style={styles.xMiniTitle} numberOfLines={1}>
          使うほど同じ趣味の 𝕏 フォロワーが増える！
        </Text>
        <Text style={styles.xMiniSub} numberOfLines={1}>
          #推し活 #聖地巡礼 #配信 · 顔が見える絵札＆30日交差
        </Text>
      </View>
    </View>
  );

  const benefitCards = (
    <View style={[styles.benefits, isSplitLayout && styles.benefitsSplit]}>
      {GUEST_HOME_BENEFITS.map((benefit) => (
        <Pressable
          key={benefit.label}
          accessibilityRole="button"
          accessibilityLabel={`${benefit.label} — ${benefit.sub}`}
          onPress={() => navigate.toTabPath(benefit.href)}
          style={({ pressed, hovered }) => [
            styles.benefitItem,
            Platform.OS === "web" && (hovered as boolean) && styles.benefitItemHover,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.benefitIconBadge}>
            <MaterialIcons
              name={benefit.icon}
              size={18}
              color={palette.kimitoBlue}
            />
          </View>
          <Text style={styles.benefitText} numberOfLines={1}>
            {benefit.label}
          </Text>
          <Text style={styles.benefitSubText} numberOfLines={1}>
            {benefit.sub}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const ctaSection = (
    <View style={[styles.ctaBlock, isSplitLayout && styles.ctaBlockSplit]}>
      <KimitoLoginCta
        signInHref={SIGN_IN_AUTO_X_HREF}
        onPress={() => openLoginGuide({ returnTo: "/" })}
      />
      <Text style={styles.ctaNote}>{loginCtaNote()}</Text>
    </View>
  );

  const marketingLinkNode = (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="kimito.link 公式の紹介ページ"
      onPress={() => {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.location.assign(MARKETING_URL);
          return;
        }
      }}
      style={[styles.marketingLink, isSplitLayout && styles.marketingLinkSplit]}
    >
      <Text style={styles.marketingLinkText}>
        kimito.link 公式の紹介ページ
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <GuestHomeShellHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerOffset + (isSplitLayout ? 16 : 10),
            paddingBottom: bottomChrome + 24,
            minHeight: height,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ファーストビュー: レーダー上の顔アイコン ＋ 1タップXログイン */}
        {isSplitLayout ? (
          <View style={[styles.splitContainer, { minHeight: Math.min(540, availableHeight - 40) }]}>
            <View
              style={styles.splitMapPane}
              testID="guest-home-radar-preview"
            >
              <RadarGuestPreview />
            </View>
            <View style={styles.splitSidePane}>
              <View style={styles.heroSplit}>
                <View style={styles.kickerPill}>
                  <View style={styles.kickerDot} />
                  <Text style={styles.kickerText}>
                    𝕏 連携 · 歩くほど同じ趣味のフォロワーが増える
                  </Text>
                </View>
                <BrandTagline compact={false} align="left" lcpProminent />
                <Text style={styles.heroSubSplit}>
                  同じ聖地・イベント・街を歩いた「同じ興味関心」の 𝕏 ユーザーとすれ違ひ通信。使えば使うほど、気が合う仲間とフォロワーが自然に集まります。
                </Text>
              </View>
              {xSuperpowerMiniStrip}
              {ctaSection}
              {benefitCards}
              <GuestPlaceContext />
            </View>
          </View>
        ) : (
          <View style={styles.mobileContainer}>
            <View style={styles.hero}>
              <View style={styles.kickerPill}>
                <View style={styles.kickerDot} />
                <Text style={styles.kickerText}>
                  𝕏 連携 · 歩くほど同じ趣味のフォロワーが増える
                </Text>
              </View>
              <BrandTagline compact={false} align="center" lcpProminent />
              <Text style={styles.heroSub}>
                同じ聖地・街を歩いた 𝕏 仲間と交差してフォロワーが増える
              </Text>
            </View>
            <View
              style={[styles.previewWrap, { height: mobileRadarHeight }]}
              testID="guest-home-radar-preview"
            >
              <RadarGuestPreview />
            </View>
            {xSuperpowerMiniStrip}
            {ctaSection}
            {benefitCards}
            <GuestPlaceContext />
          </View>
        )}

        {/* セクション1: 旅人タイル＆3部門すれ違ひランキング（tsuioku-no-kirameki 準拠 ＋ 公開tRPC連動） */}
        <View style={styles.belowFoldWrapper}>
          <GuestLiveRankingSection isSplitLayout={isSplitLayout} />

          {/* セクション2: なぜ 𝕏 連携なのか？（絵札OGP実物プレビュー ＋ フォロワーが増える3ステップ） */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Image
                  source={AVATAR_KONTA}
                  accessibilityLabel="こん太案内アイコン"
                  style={styles.sectionMascotAvatar}
                  contentFit="cover"
                />
                <View style={styles.sectionTitleWrap}>
                  <Text style={styles.sectionKickerText}>
                    WHY X (TWITTER) INTEGRATION?
                  </Text>
                  <Text style={styles.sectionTitle}>
                    なぜ使うほど「同じ興味関心の 𝕏 フォロワー」が増えるのか？
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.xAdvantageGrid, isSplitLayout && styles.xAdvantageGridRow]}>
              <View style={styles.xAdvantageCol}>
                <OfudaShareCardPreview />
              </View>
              <View style={styles.xAdvantageCol}>
                {FOLLOWER_LOOP_STEPS.map((item) => (
                  <View key={item.step} style={styles.stepCard}>
                    <View style={styles.stepHeaderRow}>
                      <View style={styles.stepNumPill}>
                        <Text style={styles.stepNumText}>{item.step}</Text>
                      </View>
                      <View style={styles.stepBadgePill}>
                        <Text style={styles.stepBadgeText}>{item.badge}</Text>
                      </View>
                    </View>
                    <Text style={styles.stepTitleText}>{item.title}</Text>
                    <Text style={styles.stepDescText}>{item.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* セクション3: ゆっくり3姉妹の10秒ガイド（yukkuri-thread 掛け合い） */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Image
                  source={AVATAR_TANUNE}
                  accessibilityLabel="たぬ姉案内アイコン"
                  style={styles.sectionMascotAvatar}
                  contentFit="cover"
                />
                <View style={styles.sectionTitleWrap}>
                  <Text style={styles.sectionKickerText}>
                    10-SECOND YUKKURI GUIDE
                  </Text>
                  <Text style={styles.sectionTitle}>
                    10秒でわかる！りんく・こん太・たぬ姉のすれ違ひ通信ガイド
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.yukkuriThreadWrap}>
              {YUKKURI_DIALOGUES.map((d) => (
                <View
                  key={d.speaker}
                  style={[
                    styles.yukkuriRow,
                    d.align === "right" && styles.yukkuriRowRight,
                  ]}
                >
                  <View style={styles.yukkuriSpeakerCol}>
                    <View
                      style={[
                        styles.yukkuriAvatarRing,
                        { borderColor: d.accentColor },
                      ]}
                    >
                      <Image
                        source={d.avatar}
                        accessibilityLabel={`${d.speaker}のアイコン`}
                        style={styles.yukkuriAvatarImg}
                        contentFit="cover"
                      />
                    </View>
                    <Text style={[styles.yukkuriSpeakerName, { color: d.accentColor }]}>
                      {d.speaker}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.yukkuriBubble,
                      {
                        backgroundColor: d.bgTint,
                        borderColor: d.accentColor,
                      },
                    ]}
                  >
                    <Text style={styles.yukkuriRoleText}>{d.role}</Text>
                    <Text style={styles.yukkuriSpeechText}>{d.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.bottomCtaFooter}>
              {ctaSection}
              {marketingLinkNode}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.kimitoBg,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: "flex-start",
    gap: 18,
  },
  mobileContainer: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    gap: 10,
  },
  splitContainer: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 20,
  },
  splitMapPane: {
    flex: 1.25,
    minWidth: 320,
    minHeight: 420,
    position: "relative",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  splitSidePane: {
    flex: 1,
    maxWidth: 460,
    minWidth: 300,
    backgroundColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingHorizontal: 22,
    paddingVertical: 20,
    justifyContent: "center",
    gap: 14,
  },
  kickerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    marginBottom: 8,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.kimitoOrange,
  },
  kickerText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 2,
  },
  heroSplit: {
    alignItems: "flex-start",
    justifyContent: "center",
  },
  heroSub: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 380,
    marginTop: 6,
  },
  heroSubSplit: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "left",
    lineHeight: 22,
    marginTop: 8,
  },
  previewWrap: {
    width: "100%",
    minHeight: 216,
    alignSelf: "center",
    position: "relative",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  xMiniStrip: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFF3E8",
    borderWidth: 1,
    borderColor: palette.kimitoOrange,
  },
  xMiniAvatarStack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  xMiniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.white,
  },
  xMiniTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  xMiniTitle: {
    color: palette.kimitoOrangeText,
    fontSize: 12,
    fontWeight: "800",
  },
  xMiniSub: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  ctaNote: {
    color: color.textHint,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  benefits: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 8,
  },
  benefitsSplit: {
    marginTop: 2,
  },
  benefitItem: {
    flex: 1,
    minWidth: 0,
    minHeight: touchTarget.minSize,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 2,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  benefitItemHover: {
    borderColor: palette.kimitoBlue,
    backgroundColor: palette.kimitoBlueSoft,
  },
  benefitIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.kimitoBlueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  benefitText: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  benefitSubText: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  ctaBlock: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  ctaBlockSplit: {
    maxWidth: "100%",
  },
  marketingLink: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
    // 実測 174x36px で HIG 下限を割っていた（2026-08-19 本番実測・375px幅）。
    minHeight: 44,
    justifyContent: "center",
  },
  marketingLinkSplit: {
    alignSelf: "center",
    marginBottom: 0,
  },
  marketingLinkText: {
    color: color.textHint,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  belowFoldWrapper: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    gap: 18,
  },
  sectionCard: {
    width: "100%",
    backgroundColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 220,
  },
  sectionMascotAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: palette.kimitoBlue,
    backgroundColor: palette.kimitoBlueSoft,
    flexShrink: 0,
  },
  sectionTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  sectionKickerText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  liveCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#FFF3E8",
    borderWidth: 1,
    borderColor: palette.kimitoOrange,
  },
  liveCountPillText: {
    color: palette.kimitoOrangeText,
    fontSize: 12,
    fontWeight: "800",
  },
  sectionTitle: {
    color: color.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
  },
  sectionLeadText: {
    color: color.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  sectionActionBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  sectionActionBtnText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  travelerTilesGrid: {
    width: "100%",
    gap: 10,
  },
  travelerTilesGridRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  travelerTile: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    backgroundColor: palette.kimitoBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    padding: 12,
    gap: 8,
    justifyContent: "space-between",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  travelerTileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  travelerAvatarWrap: {
    width: 52,
    height: 52,
    position: "relative",
    flexShrink: 0,
  },
  travelerAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: palette.kimitoBlue,
    backgroundColor: palette.white,
  },
  rankBadge: {
    position: "absolute",
    bottom: -2,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: palette.white,
  },
  rankBadgeGold: {
    backgroundColor: "#B45309",
  },
  rankBadgeSilver: {
    backgroundColor: "#334155",
  },
  rankBadgeBronze: {
    backgroundColor: "#9A3412",
  },
  rankBadgeText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: "800",
  },
  travelerMetaCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  travelerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  travelerName: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
  },
  travelerPrefBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    flexShrink: 0,
  },
  travelerPrefBadgeText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  travelerHandle: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  travelerCategory: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  travelerQuoteBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: palette.white,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  travelerQuoteText: {
    color: color.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  travelerScoreText: {
    color: palette.kimitoOrangeText,
    fontSize: 12,
    fontWeight: "800",
    flexShrink: 0,
  },
  rankColumnsWrap: {
    width: "100%",
    gap: 10,
  },
  rankColumnsWrapRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  rankColCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: palette.kimitoBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    padding: 12,
    gap: 8,
  },
  rankColHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.kimitoBorderSoft,
  },
  rankColTitle: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  rankRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.white,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  rankRowPressable: {
    minHeight: 44,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  rankNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rankNumText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: "800",
  },
  rankRowBody: {
    flex: 1,
    minWidth: 0,
  },
  rankRowName: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  rankRowSub: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  rankRowVal: {
    color: palette.kimitoBlue,
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    flexShrink: 0,
  },
  xAdvantageGrid: {
    width: "100%",
    gap: 14,
  },
  xAdvantageGridRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  xAdvantageCol: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  ofudaCard: {
    flex: 1,
    backgroundColor: "#081226",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  ofudaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0D1E3A",
    gap: 8,
  },
  ofudaBrandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#16315C",
  },
  ofudaBrandBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  ofudaDomainText: {
    color: "#E2EDF7",
    fontSize: 12,
    fontWeight: "700",
  },
  ofudaMapStage: {
    width: "100%",
    height: 168,
    position: "relative",
    backgroundColor: "#081226",
    alignItems: "center",
    justifyContent: "center",
  },
  ofudaPinOverlay: {
    position: "absolute",
    top: 12,
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  ofudaSpeechBubble: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: palette.kimitoOrange,
  },
  ofudaSpeechText: {
    color: palette.kimitoBlue,
    fontSize: 13,
    fontWeight: "800",
  },
  ofudaAvatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: palette.kimitoOrange,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  ofudaAvatarImg: {
    width: 52,
    height: 52,
  },
  ofudaHandlePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#0D1E3A",
    borderWidth: 1,
    borderColor: "#38BDF8",
  },
  ofudaHandlePillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  ofudaBottomCaption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#0D1E3A",
    gap: 4,
  },
  ofudaBottomTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  ofudaBottomSub: {
    color: "#E2EDF7",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  stepCard: {
    backgroundColor: palette.kimitoBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 4,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stepNumPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: palette.kimitoBlue,
  },
  stepNumText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: "800",
  },
  stepBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#FFF3E8",
    borderWidth: 1,
    borderColor: palette.kimitoOrange,
  },
  stepBadgeText: {
    color: palette.kimitoOrangeText,
    fontSize: 12,
    fontWeight: "800",
  },
  stepTitleText: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  stepDescText: {
    color: color.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  yukkuriThreadWrap: {
    width: "100%",
    gap: 10,
  },
  yukkuriRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  yukkuriRowRight: {
    flexDirection: "row-reverse",
  },
  yukkuriSpeakerCol: {
    width: 60,
    alignItems: "center",
    gap: 3,
    flexShrink: 0,
  },
  yukkuriAvatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    backgroundColor: palette.white,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  yukkuriAvatarImg: {
    width: 44,
    height: 44,
  },
  yukkuriSpeakerName: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  yukkuriBubble: {
    flex: 1,
    minWidth: 0,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  yukkuriRoleText: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  yukkuriSpeechText: {
    color: color.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  bottomCtaFooter: {
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: palette.kimitoBorderSoft,
    alignItems: "center",
    gap: 6,
  },
});
