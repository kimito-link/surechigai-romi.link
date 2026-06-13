import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { color } from "@/theme/tokens";
import { useMemo, useState, useEffect } from "react";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  LinearTransition,
} from "react-native-reanimated";
import { Modal } from "@/components/ui/modal";

// 分割したモジュールからインポート
import { regions, Region, findRegionByPrefecture } from "./region-data";
import { getParticipantIcon, getHeatLevel, getHeatOpacity, getHeatBorderWidth } from "./heat-utils";
import { styles } from "./JapanRegionBlocks.styles";

export interface JapanRegionBlocksProps {
  prefectureCounts: { [key: string]: number };
  onPrefecturePress?: (prefecture: string) => void;
  onRegionPress?: (regionName: string, prefectures: string[]) => void;
  userPrefecture?: string; // ユーザーの都道府県（強調表示用）
}

export function JapanRegionBlocks({ prefectureCounts, onPrefecturePress, onRegionPress, userPrefecture }: JapanRegionBlocksProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  
  // ユーザーの地域を特定
  const userRegionId = useMemo(() => {
    if (!userPrefecture) return null;
    const region = findRegionByPrefecture(userPrefecture);
    return region?.id || null;
  }, [userPrefecture]);
  
  // パルスアニメーション用の値
  const pulseScale = useSharedValue(1);
  
  // ユーザーの地域がある場合、パルスアニメーションを開始
  useEffect(() => {
    if (userRegionId) {
      pulseScale.value = withTiming(1.03, { duration: 800 });
      const interval = setInterval(() => {
        pulseScale.value = withTiming(pulseScale.value === 1 ? 1.03 : 1, { duration: 800 });
      }, 800);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRegionId]);
  
  // パルスアニメーションスタイル
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // 統計情報を計算
  const stats = useMemo(() => {
    const totalPrefectures = Object.keys(prefectureCounts).filter(k => prefectureCounts[k] > 0).length;
    const totalParticipants = Object.values(prefectureCounts).reduce((a, b) => a + b, 0);
    const maxCount = Math.max(...Object.values(prefectureCounts), 0);
    const hotPrefecture = Object.entries(prefectureCounts).find(([_, count]) => count === maxCount)?.[0] || "";
    
    return { totalPrefectures, totalParticipants, maxCount, hotPrefecture };
  }, [prefectureCounts]);

  // 地域ごとの合計を計算
  const regionTotals = useMemo(() => {
    const totals: { [key: string]: number } = {};
    regions.forEach(region => {
      totals[region.id] = region.prefectures.reduce((sum, pref) => {
        return sum + (prefectureCounts[pref.name] || prefectureCounts[pref.short] || 0);
      }, 0);
    });
    return totals;
  }, [prefectureCounts]);
  
  // 地域ごとの最大参加者数（ヒートマップ計算用）
  const maxRegionCount = useMemo(() => {
    return Math.max(...Object.values(regionTotals), 0);
  }, [regionTotals]);
  
  // 地域ランキング（参加者数の多い順）
  const regionRanking = useMemo(() => {
    return regions
      .map(region => ({
        ...region,
        total: regionTotals[region.id] || 0,
      }))
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [regionTotals]);

  // レスポンシブ設定
  const blockSize = Math.floor((screenWidth - 48) / 3) - 8;
  const minBlockSize = 100;
  const actualBlockSize = Math.max(blockSize, minBlockSize);

  // 都道府県詳細モーダルを開く
  const handleRegionPress = (region: Region) => {
    setSelectedRegion(region);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setSelectedRegion(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗾 地域別参加者マップ</Text>
      </View>
      
      {/* 合計人数のメッセージ化 */}
      <View style={styles.totalMessage}>
        <Text style={styles.totalMessageText}>
          全国から <Text style={styles.totalMessageCount}>{stats.totalParticipants}人</Text> が参加中
        </Text>
        {stats.totalParticipants < 10 && (
          <Text style={styles.totalMessageSub}>まだ少ない今がチャンス！</Text>
        )}
      </View>

      {/* 6地域ブロック（2列×3行） */}
      <View style={styles.gridContainer}>
        {regions.map((region) => {
          const total = regionTotals[region.id];
          const hasParticipants = total > 0;
          const fireIcon = getParticipantIcon(total);
          const isUserRegion = region.id === userRegionId;
          
          // ヒートマップ色の計算
          const heatLevel = getHeatLevel(total, maxRegionCount);
          const heatOpacity = getHeatOpacity(heatLevel);
          const heatBorderWidth = getHeatBorderWidth(heatLevel);
          
          const blockContent = (
            <>
              {isUserRegion && (
                <View style={styles.userRegionBadge}>
                  <Text style={styles.userRegionBadgeText}>あなたの地域</Text>
                </View>
              )}
              {/* ヒートレベルインジケーター（最多の場合のみ表示） */}
              {heatLevel === 5 && (
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>HOT</Text>
                </View>
              )}
              <Text style={styles.regionEmoji}>{region.emoji}</Text>
              <Text style={[
                styles.regionName,
                { color: hasParticipants ? color.textWhite : color.textMuted }
              ]}>
                {region.shortName}
              </Text>
              <Text style={[
                styles.regionCount,
                { color: hasParticipants ? color.textWhite : color.textMuted }
              ]}>
                {total > 0 ? `${total}人` : "-"}
              </Text>
              {fireIcon && (
                <Text style={styles.fireIcon}>{fireIcon}</Text>
              )}
            </>
          );
          
          // ユーザーの地域はアニメーション付き
          if (isUserRegion) {
            return (
              <Animated.View key={region.id} style={pulseAnimatedStyle}>
                <Pressable
                  style={[
                    styles.regionBlock,
                    styles.userRegionBlock,
                    {
                      width: actualBlockSize,
                      height: actualBlockSize,
                      backgroundColor: region.color,
                      borderColor: color.accentPrimary,
                      borderWidth: 4,
                      opacity: heatOpacity,
                    },
                  ]}
                  onPress={() => handleRegionPress(region)}
                  
                >
                  {blockContent}
                </Pressable>
              </Animated.View>
            );
          }
          
          return (
            <Pressable
              key={region.id}
              style={[
                styles.regionBlock,
                {
                  width: actualBlockSize,
                  height: actualBlockSize,
                  backgroundColor: hasParticipants ? region.color : color.mapInactive,
                  borderColor: hasParticipants ? region.borderColor : color.border,
                  borderWidth: heatBorderWidth,
                  opacity: heatOpacity,
                },
              ]}
              onPress={() => handleRegionPress(region)}
              
            >
              {blockContent}
            </Pressable>
          );
        })}
      </View>

      {/* 統計サマリー */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalPrefectures}</Text>
          <Text style={styles.statLabel}>都道府県</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalParticipants}</Text>
          <Text style={styles.statLabel}>総参加者</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.maxCount}</Text>
          <Text style={styles.statLabel}>最多</Text>
        </View>
      </View>

      {/* ヒートマップ凡例 */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>色の濃さ = 参加者数</Text>
        <View style={styles.legendBar}>
          <View style={[styles.legendSegment, { backgroundColor: color.mapInactive, opacity: 0.3 }]} />
          <View style={[styles.legendSegment, { backgroundColor: color.accentPrimary, opacity: 0.5 }]} />
          <View style={[styles.legendSegment, { backgroundColor: color.accentPrimary, opacity: 0.65 }]} />
          <View style={[styles.legendSegment, { backgroundColor: color.accentPrimary, opacity: 0.8 }]} />
          <View style={[styles.legendSegment, { backgroundColor: color.accentPrimary, opacity: 0.9 }]} />
          <View style={[styles.legendSegment, { backgroundColor: color.accentPrimary, opacity: 1.0 }]} />
        </View>
        <View style={styles.legendLabels}>
          <Text style={styles.legendLabel}>少</Text>
          <Text style={styles.legendLabel}>多</Text>
        </View>
      </View>

      {/* 地域ランキング */}
      {regionRanking.length > 0 && (
        <View style={styles.rankingContainer}>
          <Text style={styles.rankingTitle}>🏆 地域ランキング</Text>
          {regionRanking.map((region, index) => {
            const rankEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`;
            const isUserRegion = region.id === userRegionId;
            const barWidth = maxRegionCount > 0 ? (region.total / maxRegionCount) * 100 : 0;
            
            return (
              <Animated.View 
                key={region.id} 
                layout={LinearTransition.springify().damping(15).stiffness(100)}
                entering={FadeIn.delay(index * 50).duration(300)}
                style={[
                  styles.rankingItem,
                  isUserRegion && styles.rankingItemHighlight
                ]}
              >
                <View style={styles.rankingLeft}>
                  <Animated.Text 
                    layout={LinearTransition.springify()}
                    style={styles.rankingRank}
                  >
                    {rankEmoji}
                  </Animated.Text>
                  <Text style={styles.rankingEmoji}>{region.emoji}</Text>
                  <Text style={[
                    styles.rankingName,
                    isUserRegion && styles.rankingNameHighlight
                  ]}>
                    {region.shortName}
                  </Text>
                </View>
                <View style={styles.rankingRight}>
                  <View style={styles.rankingBarContainer}>
                    <Animated.View 
                      layout={LinearTransition.springify().damping(12).stiffness(80)}
                      style={[
                        styles.rankingBar,
                        { 
                          width: `${barWidth}%`,
                          backgroundColor: region.color,
                        }
                      ]} 
                    />
                  </View>
                  <Animated.Text 
                    layout={LinearTransition.springify()}
                    style={styles.rankingCount}
                  >
                    {region.total}人
                  </Animated.Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* 熱い地域ハイライト */}
      {stats.hotPrefecture && stats.maxCount > 0 && (
        <View style={styles.hotHighlight}>
          <Text style={styles.hotIcon}>🔥</Text>
          <View>
            <Text style={styles.hotTitle}>{stats.hotPrefecture}が熱い！</Text>
            <Text style={styles.hotSubtitle}>{stats.maxCount}人が参加表明中</Text>
          </View>
        </View>
      )}

      {/* 地域タップで都道府県詳細モーダル */}
      <Modal
        visible={selectedRegion !== null}
        onClose={closeModal}
        type="bottom"
        title={selectedRegion?.name ?? ""}
        showCloseButton
        maxHeight="85%"
      >
        {selectedRegion && (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>{selectedRegion.emoji}</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              合計 {regionTotals[selectedRegion.id]}人
            </Text>
            <ScrollView style={styles.prefectureList}>
                    {/* 都道府県別ランキング（参加者数順） */}
                    {(() => {
                      // 参加者数でソート
                      const sortedPrefectures = [...selectedRegion.prefectures]
                        .map(pref => ({
                          ...pref,
                          count: prefectureCounts[pref.name] || prefectureCounts[pref.short] || 0
                        }))
                        .sort((a, b) => b.count - a.count);
                      
                      // 最大参加者数（プログレスバー用）
                      const maxPrefCount = Math.max(...sortedPrefectures.map(p => p.count), 1);
                      
                      return sortedPrefectures.map((pref, index) => {
                        const hasParticipants = pref.count > 0;
                        const rankEmoji = index === 0 && hasParticipants ? "🥇" : 
                                          index === 1 && hasParticipants ? "🥈" : 
                                          index === 2 && hasParticipants ? "🥉" : 
                                          hasParticipants ? `${index + 1}` : "-";
                        const barWidth = maxPrefCount > 0 ? (pref.count / maxPrefCount) * 100 : 0;
                        const isUserPref = pref.name === userPrefecture || pref.short === userPrefecture;
                        
                        return (
                          <Animated.View
                            key={pref.name}
                            entering={FadeIn.delay(index * 30).duration(200)}
                            layout={LinearTransition.springify().damping(15).stiffness(100)}
                          >
                            <Pressable
                              style={[
                                styles.prefectureRankItem,
                                isUserPref && styles.prefectureRankItemHighlight
                              ]}
                              onPress={() => {
                                closeModal();
                                onPrefecturePress?.(pref.name);
                              }}
                              
                            >
                              <View style={styles.prefectureRankLeft}>
                                <Text style={[
                                  styles.prefectureRankEmoji,
                                  !hasParticipants && { opacity: 0.4 }
                                ]}>
                                  {rankEmoji}
                                </Text>
                                <Text style={[
                                  styles.prefectureRankName,
                                  isUserPref && styles.prefectureRankNameHighlight
                                ]}>
                                  {pref.short}
                                </Text>
                                {isUserPref && (
                                  <View style={styles.prefectureUserBadge}>
                                    <Text style={styles.prefectureUserBadgeText}>あなた</Text>
                                  </View>
                                )}
                              </View>
                              <View style={styles.prefectureRankRight}>
                                <View style={styles.prefectureBarContainer}>
                                  <Animated.View
                                    layout={LinearTransition.springify().damping(12).stiffness(80)}
                                    style={[
                                      styles.prefectureBar,
                                      {
                                        width: `${barWidth}%`,
                                        backgroundColor: hasParticipants ? selectedRegion.color : color.borderAlt,
                                      }
                                    ]}
                                  />
                                </View>
                                <Text style={[
                                  styles.prefectureRankCount,
                                  !hasParticipants && { color: color.textMuted }
                                ]}>
                                  {hasParticipants ? `${pref.count}人` : "-"}
                                </Text>
                              </View>
                            </Pressable>
                          </Animated.View>
                        );
                      });
                    })()}
            </ScrollView>
            <Pressable
              style={[styles.viewAllButton, { backgroundColor: selectedRegion.color }]}
              onPress={() => {
                closeModal();
                onRegionPress?.(selectedRegion.name, selectedRegion.prefectures.map(p => p.name));
              }}
            >
              <Text style={styles.viewAllButtonText}>
                {selectedRegion.name}の参加者を見る
              </Text>
            </Pressable>
          </>
        )}
      </Modal>
    </View>
  );
}
