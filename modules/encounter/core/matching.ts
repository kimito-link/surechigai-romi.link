/**
 * modules/encounter/core/matching.ts
 *
 * 純粋関数 findMatches:
 *   自分の新規位置 + 周辺候補（他ユーザーの直近位置リスト）+
 *   タイムシフト候補（同h3R7のvisitedAreas）+ ブロックSet + 既存当日ペアSet
 *   を受け取り、生成すべき encounter のリストを返す。
 *
 * DB・認証・Express に非依存の純粋TS。
 * 移植元: surechigai-nico/server/src/cron/matcher.ts のコアロジック
 */

import { haversineMeters, kRing, toH3Cell, H3_RES_8 } from "./geo.js";
import { judgeTier, type TierNumber } from "./tiers.js";

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

/** チェックインしたユーザー（自分自身）の位置情報 */
export type SelfLocation = {
  userId: number;
  /** 500mグリッド丸め済み緯度 */
  latGrid: number;
  /** 500mグリッド丸め済み経度 */
  lngGrid: number;
  /** H3 res8 セル */
  h3R8: string;
  /** チェックイン日時 */
  recordedAt: Date;
};

/** 周辺候補ユーザーの直近位置（DBから取得済み想定） */
export type NearbyCandidate = {
  userId: number;
  latGrid: number;
  lngGrid: number;
  h3R8: string;
  recordedAt: Date;
};

/** タイムシフト候補（visitedAreas の同 h3R7 行） */
export type TimeshiftCandidate = {
  userId: number;
  h3R7: string;
  municipality?: string | null;
  prefecture?: string | null;
};

/** findMatches の入力 */
export type FindMatchesInput = {
  self: SelfLocation;
  /** 周辺候補（自分のh3R8のk-ring内にいる他ユーザー。DB側フィルタ推奨） */
  nearbyCandidates: NearbyCandidate[];
  /** タイムシフト候補（同 h3R7 を過去30日に訪問したユーザー） */
  timeshiftCandidates: TimeshiftCandidate[];
  /** ブロックセット: "min(a,b)-max(a,b)" 形式のキー */
  blockSet: Set<string>;
  /**
   * 当日既にマッチ済みのペアセット: "min(a,b)-max(a,b)" 形式。
   * UNIQUE(userAId, userBId, dayKey) に対応 — 同日は高ティアが既にあれば追加しない。
   */
  todayPairSet: Set<string>;
};

/** findMatches が返すマッチ結果1件 */
export type EncounterResult = {
  /** 常に userAId < userBId */
  userAId: number;
  userBId: number;
  tier: TierNumber;
  /** 代表点グリッド（中間点 or 自分の位置） */
  latGrid: number;
  lngGrid: number;
  /** H3 res7（表示用） */
  h3R7: string;
  occurredAt: Date;
};

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

// ---------------------------------------------------------------------------
// findMatches — メイン純粋関数
// ---------------------------------------------------------------------------

/**
 * すれ違いマッチング。
 *
 * 1. 即時マッチング（nearbyCandidates との Haversine + ティア判定）
 * 2. タイムシフトマッチング（timeshiftCandidates との h3R7 同一判定）
 *
 * 同一相手に対しては最高ティア（数値小）のみ1件を返す。
 * ブロック・当日済みペアは除外。
 */
export function findMatches(input: FindMatchesInput): EncounterResult[] {
  const { self, nearbyCandidates, timeshiftCandidates, blockSet, todayPairSet } = input;

  /** 相手 userId → 最良結果 */
  const bestPerOpponent = new Map<number, EncounterResult>();

  const selfH3R7 = toH3Cell(self.latGrid, self.lngGrid, 7);

  // -----------------------------------------------------------------------
  // 1. 即時マッチング
  // -----------------------------------------------------------------------
  for (const cand of nearbyCandidates) {
    if (cand.userId === self.userId) continue;

    const key = pairKey(self.userId, cand.userId);
    if (blockSet.has(key)) continue;
    if (todayPairSet.has(key)) continue;

    const distM = haversineMeters(
      { lat: self.latGrid, lng: self.lngGrid },
      { lat: cand.latGrid, lng: cand.lngGrid }
    );
    const tier = judgeTier(distM);
    if (tier === null) continue;

    const existing = bestPerOpponent.get(cand.userId);
    if (existing && existing.tier <= tier) continue; // 同一相手は最高ティアのみ

    const midLatGrid = (self.latGrid + cand.latGrid) / 2;
    const midLngGrid = (self.lngGrid + cand.lngGrid) / 2;
    const h3R7 = toH3Cell(midLatGrid, midLngGrid, 7);
    const occurredAt =
      self.recordedAt < cand.recordedAt ? self.recordedAt : cand.recordedAt;

    bestPerOpponent.set(cand.userId, {
      userAId: Math.min(self.userId, cand.userId),
      userBId: Math.max(self.userId, cand.userId),
      tier,
      latGrid: midLatGrid,
      lngGrid: midLngGrid,
      h3R7,
      occurredAt,
    });
  }

  // -----------------------------------------------------------------------
  // 2. タイムシフトマッチング（同 h3R7 を過去30日に訪問済み）
  // -----------------------------------------------------------------------
  for (const cand of timeshiftCandidates) {
    if (cand.userId === self.userId) continue;

    const key = pairKey(self.userId, cand.userId);
    if (blockSet.has(key)) continue;
    if (todayPairSet.has(key)) continue;

    // タイムシフトはティア5。即時マッチで ≤4 が成立している場合はスキップ
    const existing = bestPerOpponent.get(cand.userId);
    if (existing && existing.tier < 5) continue;
    if (existing && existing.tier === 5) continue; // 重複

    bestPerOpponent.set(cand.userId, {
      userAId: Math.min(self.userId, cand.userId),
      userBId: Math.max(self.userId, cand.userId),
      tier: 5,
      latGrid: self.latGrid,
      lngGrid: self.lngGrid,
      h3R7: cand.h3R7 ?? selfH3R7,
      occurredAt: self.recordedAt,
    });
  }

  return Array.from(bestPerOpponent.values());
}
