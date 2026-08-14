/**
 * modules/encounter/api/encounter.ts
 *
 * encounter tRPC ルーター。
 * - encounter.checkIn
 * - encounter.list
 * - encounter.open
 * - encounter.react
 * - encounter.updateHitokoto
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../../server/_core/trpc.js";
import { getDb, requireDb } from "../../../server/db/connection.js";
import {
  toGrid,
  toH3Cell,
  toH3R7,
  toH3ParentCell,
  assertFiniteLatLng,
  H3_RES_7,
  H3_RES_5,
} from "../core/geo.js";
import { findMatches } from "../core/matching.js";
import { moderateText } from "../core/moderation.js";
import { reverseGeocodeWithTimeout } from "../core/geocoding.js";
import {
  isAcceptableAccuracy,
  isLocationRecordingPaused,
  resolveMunicipality,
  excludeSelfMatches,
} from "../core/checkin-guards.js";
import { reactions, users } from "../../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";
import {
  insertLocation,
  insertImportedLocation,
  hasNearbyLocationAt,
  getNearCandidates,
  getWideCandidates,
  getTimeshiftCandidates,
  getBlockSet,
  getTodayPairSet,
  insertEncountersIfNew,
  upsertVisitedArea,
  getMyEncounters,
  openEncounter,
  isEncounterParty,
  getUserSettings,
  upsertUserSettings,
  getMostFrequentNightH3R8,
} from "../db/queries.js";

/** 写真とりこみ: 1回で受ける最大枚数。クライアント側でも同じ数で止める。 */
const IMPORT_MAX_ITEMS = 20;
/**
 * 写真とりこみ: これより古い撮影時刻は壊れた EXIF とみなして弾く。
 * 2004-01-01。GPS 付きデジカメが一般化する前の日付は実質ありえない。
 */
const IMPORT_MIN_RECORDED_AT_MS = Date.UTC(2004, 0, 1);
/**
 * 写真とりこみ: 逆ジオコーディング全体の予算。
 * 1件2.5秒 × ユニークセル数だけ待つと関数のタイムアウトに当たるので、
 * ここで打ち切って「地名なしの足あと」として保存を続ける（保存自体は成立する）。
 */
const IMPORT_GEOCODE_BUDGET_MS = 6_000;
/** 写真とりこみ: 同じセルでこの分数以内に既存の足あとがあれば重複とみなす */
const IMPORT_DUPLICATE_WINDOW_MIN = 60;

export const encounterRouter = router({
  /**
   * チェックイン。唯一の位置送信口。
   * accuracy > 10000 は拒否。位置一時停止中は無視。
   * サーバーで即 h3 丸め。オンデマンドマッチング実行。
   */
  checkIn: protectedProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        accuracy: z.number().optional(),
        municipality: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // accuracy チェック
      if (!isAcceptableAccuracy(input.accuracy)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "位置精度が低すぎます (accuracy > 10000m)",
        });
      }

      // lat/lng バリデーション
      const latLng = assertFiniteLatLng(input.lat, input.lng);
      if (!latLng) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "無効な座標です" });
      }

      const db = await getDb();
      if (!db) {
        // DB未接続を「成功形(saved欠落)」で返すと足あと未保存のまま完了UIになる(P0-1)。
        // "Database not available" はクライアント toUserFriendlyError が
        // DATABASE_NOT_AVAILABLE(再試行可)に写す既知文言。
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { latGrid, lngGrid } = toGrid(latLng.lat, latLng.lng);
      const h3R8 = toH3Cell(latGrid, lngGrid, 8);
      // visitedAreas.h3R7（タイムシフト・直接計算）専用。候補絞り込み用ではない。
      const h3R7 = toH3R7(latGrid, lngGrid);
      // locations.h3R7 / h3R5（候補絞り込み専用。h3R8からのcellToParent由来で上記h3R7とは別値）
      const candidateH3R7 = toH3ParentCell(h3R8, H3_RES_7);
      const candidateH3R5 = toH3ParentCell(h3R8, H3_RES_5);

      const [settings, g] = await Promise.all([
        getUserSettings(db, userId),
        reverseGeocodeWithTimeout(latLng.lat, latLng.lng, 2_500),
      ]);
      if (isLocationRecordingPaused(settings?.locationPausedUntil)) {
        // 一時停止中の無言成功はキャッシュずれ経由のチェックインを「保存済み」と誤認させる(P1-3)。
        // 明示エラーで返し、クライアントはこの文言をそのまま表示する。
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "位置記録は一時停止中です。マイページで「灯を消す」を解除してからお試しください",
        });
      }

      let municipality = resolveMunicipality(input.municipality, g.municipality);
      const prefecture = g.prefecture;
      const areaName = g.areaName;
      const address = g.address;

      let locationId: number;
      try {
        const [insertedId] = await Promise.all([
          insertLocation(db, {
            userId,
            h3R8,
            latGrid,
            lngGrid,
            lat: latLng.lat,
            lng: latLng.lng,
            accuracyM: input.accuracy ?? null,
            municipality,
            prefecture,
            address,
          }),
          upsertVisitedArea(db, {
            userId,
            h3R7,
            municipality,
            prefecture,
          }),
        ]);
        locationId = insertedId;
      } catch (insertErr) {
        console.error("[encounter.checkIn] location insert failed:", insertErr);
        return {
          newEncounters: 0,
          prefecture,
          municipality,
          areaName,
          address,
          lat: latLng.lat,
          lng: latLng.lng,
          locationId: null,
          saved: false,
        };
      }

      getMostFrequentNightH3R8(db, userId).then((cell) => {
        upsertUserSettings(db, userId, { homeMaskCell: cell }).catch(() => {});
      }).catch(() => {});

      // ここで OGP 画像のウォームを投げてはいけない（2026-07-31 実機で障害を確認）。
      // Vercel の Serverless は未解決の Promise が残っていると関数を終了させないため、
      // .catch() を付けて投げっぱなしにしてもレスポンスがウォーム完了まで遅延する。
      // 画像生成は 5〜6 秒かかるので、チェックインの応答がそのぶん詰まる。
      // OGP のキャッシュは別経路（api/og-redirect の事前叩き等）で温めること。
      // 詳細は docs/investigation/ogp-card-latency-2026-07-30.md を参照。

      let nearCandidates: Awaited<ReturnType<typeof getNearCandidates>> = [];
      let timeshiftCandidates: Awaited<ReturnType<typeof getTimeshiftCandidates>> = [];
      let blockSet = new Set<string>();
      let todayPairSet = new Set<string>();
      try {
        [nearCandidates, timeshiftCandidates, blockSet, todayPairSet] = await Promise.all([
          getNearCandidates(db, userId, candidateH3R7),
          getTimeshiftCandidates(db, userId, h3R7),
          getBlockSet(db, userId),
          getTodayPairSet(db, userId),
        ]);
      } catch (matchErr) {
        console.error("[encounter.checkIn] matching/block query failed:", matchErr);
      }

      const selfLocation = {
        userId,
        latGrid,
        lngGrid,
        h3R8,
        recordedAt: new Date(),
      };

      const immediateMatches = excludeSelfMatches(
        findMatches({
          self: selfLocation,
          nearbyCandidates: nearCandidates,
          timeshiftCandidates,
          blockSet,
          todayPairSet,
        }),
      );

      // 過疎地対策ゲート: 近距離(Tier1-2)でマッチ0件 かつ 当日まだ1件もマッチしていない
      // ユーザーだけ、広域(Tier3-4)ステージを追加実行する。
      // 移植元設計: docs/matching-tier-redesign-DESIGN.md §3.1（旧surechigai-nicoの
      // 「直近24hマッチ0件のユーザーだけ範囲拡大」を、追加クエリ最小の同期処理に適合）
      let matchResults = immediateMatches;
      if (immediateMatches.length === 0 && todayPairSet.size === 0) {
        try {
          const wideCandidates = await getWideCandidates(db, userId, candidateH3R5);
          matchResults = excludeSelfMatches(
            findMatches({
              self: selfLocation,
              nearbyCandidates: [...nearCandidates, ...wideCandidates],
              timeshiftCandidates,
              blockSet,
              todayPairSet,
            }),
          );
        } catch (wideErr) {
          console.error("[encounter.checkIn] wide-stage matching query failed:", wideErr);
        }
      }

      // encounters INSERT（UNIQUE衝突は無視・1クエリでバルク挿入）
      // 旧実装はマッチ件数分だけ逐次 await insertEncounterIfNew するN+1ループだった
      // （Vercel⇄Railwayレイテンシ調査 2026-07-23 で発見）。
      let newEncounters = 0;
      if (matchResults.length > 0) {
        try {
          newEncounters = await insertEncountersIfNew(
            db,
            matchResults.map((m) => ({
              userAId: m.userAId,
              userBId: m.userBId,
              tier: m.tier,
              h3R7: m.h3R7,
              areaName,
              prefecture,
              occurredAt: m.occurredAt,
            })),
          );
        } catch (insertErr) {
          console.error("[encounter.checkIn] insertEncounters failed:", insertErr);
        }
      }

      // saved:true は「足あとの永続化が確定した」の明示。クライアントは saved !== true を全て失敗扱いにする(肯定形判定)
      return { newEncounters, prefecture, municipality, areaName, address, lat: latLng.lat, lng: latLng.lng, locationId, saved: true };
    }),

  /**
   * 写真の EXIF から取り込んだ「過去の足あと」をまとめて保存する（2026-08-14）。
   * 設計: docs/photo-import-and-viral-DESIGN.md C-3。
   *
   * checkIn と決定的に違う点（意図的な差。真似して揃えないこと）:
   *   1. **すれ違いマッチングを実行しない**。過去日付の在圏を遡ってマッチさせると
   *      タイムシフトマッチの意味論が壊れ、他人の写真で偽の在圏を作れてしまう。
   *   2. **visibility は private 固定**。勝手に公開しない（公開は本人が1件ずつ）。
   *   3. **recordedAt は撮影時刻**（now ではない）。epoch ms で受け取る
   *      （Date を直接受けると生SQL経路で事故った実績があるため数値で受ける）。
   *   4. accuracy を要求しない。写真の EXIF は水平精度を持たない。
   *
   * 返り値は肯定形のフィールドで返す（「保存されたはず」の誤認を作らない）。
   */
  importFootprints: protectedProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              lat: z.number(),
              lng: z.number(),
              /** 撮影時刻（epoch ms） */
              recordedAt: z.number(),
              /** EXIF 由来か、地図タップでの手動指定か */
              source: z.enum(["photo", "manual"]).default("photo"),
            })
          )
          .min(1)
          .max(IMPORT_MAX_ITEMS),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const settings = await getUserSettings(db, userId);
      if (isLocationRecordingPaused(settings?.locationPausedUntil)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "位置記録は一時停止中です。マイページで「灯を消す」を解除してからお試しください",
        });
      }

      // 1) 検証（座標・日時）。壊れた EXIF はここで落とす。
      type Prepared = {
        lat: number;
        lng: number;
        recordedAt: Date;
        source: "photo" | "manual";
        latGrid: number;
        lngGrid: number;
        h3R8: string;
        h3R7: string;
      };
      const prepared: Prepared[] = [];
      let rejected = 0;
      const now = Date.now();
      for (const item of input.items) {
        const latLng = assertFiniteLatLng(item.lat, item.lng);
        if (!latLng) {
          rejected += 1;
          continue;
        }
        if (
          !Number.isFinite(item.recordedAt) ||
          item.recordedAt < IMPORT_MIN_RECORDED_AT_MS ||
          item.recordedAt > now
        ) {
          // 未来日付・1970年など明らかに壊れた EXIF を弾く
          rejected += 1;
          continue;
        }
        const { latGrid, lngGrid } = toGrid(latLng.lat, latLng.lng);
        const h3R8 = toH3Cell(latGrid, lngGrid, 8);
        prepared.push({
          lat: latLng.lat,
          lng: latLng.lng,
          recordedAt: new Date(item.recordedAt),
          source: item.source,
          latGrid,
          lngGrid,
          h3R8,
          // visitedAreas 用の h3R7（直接計算）。locations.h3R7 とは別系統なので混ぜない
          h3R7: toH3R7(latGrid, lngGrid),
        });
      }

      if (prepared.length === 0) {
        return { imported: 0, skippedDuplicates: 0, rejected, newAreas: [] as string[] };
      }

      // 2) 逆ジオコーディングはユニークなグリッドセルごとに1回だけ。
      //    20枚が同じ街なら1回で済む。総予算を切って関数のタイムアウトを守る。
      const geoByCell = new Map<
        string,
        { municipality: string | null; prefecture: string | null; address: string | null }
      >();
      const uniqueCells = [...new Set(prepared.map((p) => `${p.latGrid},${p.lngGrid}`))];
      const geoDeadline = now + IMPORT_GEOCODE_BUDGET_MS;
      for (const cellKey of uniqueCells) {
        if (Date.now() > geoDeadline) break; // 予算切れ。残りは地名なしで保存する
        const target = prepared.find((p) => `${p.latGrid},${p.lngGrid}` === cellKey);
        if (!target) continue;
        try {
          const g = await reverseGeocodeWithTimeout(target.lat, target.lng, 2_500);
          geoByCell.set(cellKey, {
            municipality: g.municipality ?? null,
            prefecture: g.prefecture ?? null,
            address: g.address ?? null,
          });
        } catch {
          // 取れなくても足あと自体は成立する（海外の写真もここに落ちる）
        }
      }

      // 3) 保存。重複は skip。1件の失敗が他を巻き込まないよう件ごとに隔離する。
      let imported = 0;
      let skippedDuplicates = 0;
      const newAreas = new Set<string>();
      for (const p of prepared) {
        try {
          if (
            await hasNearbyLocationAt(db, {
              userId,
              h3R8: p.h3R8,
              recordedAt: p.recordedAt,
              windowMinutes: IMPORT_DUPLICATE_WINDOW_MIN,
            })
          ) {
            skippedDuplicates += 1;
            continue;
          }
          const geo = geoByCell.get(`${p.latGrid},${p.lngGrid}`) ?? {
            municipality: null,
            prefecture: null,
            address: null,
          };
          await insertImportedLocation(db, {
            userId,
            h3R8: p.h3R8,
            latGrid: p.latGrid,
            lngGrid: p.lngGrid,
            lat: p.lat,
            lng: p.lng,
            municipality: geo.municipality,
            prefecture: geo.prefecture,
            address: geo.address,
            recordedAt: p.recordedAt,
            source: p.source,
          });
          imported += 1;
          // 図鑑を埋める（過去の旅のぶんだけ街が増える＝取り込みの内発的な報酬）
          await upsertVisitedArea(db, {
            userId,
            h3R7: p.h3R7,
            municipality: geo.municipality,
            prefecture: geo.prefecture,
          });
          if (geo.municipality) newAreas.add(geo.municipality);
        } catch (err) {
          console.error("[encounter.importFootprints] insert failed:", err);
          rejected += 1;
        }
      }

      // ★マッチングは実行しない（上のコメント1参照）
      return { imported, skippedDuplicates, rejected, newAreas: [...newAreas] };
    }),

  /**
   * 封筒一覧。ブロック相手・停止ユーザー除外。
   * cursor = occurredAt ISO文字列（ページング）。
   */
  list: protectedProcedure
    .input(z.object({ cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const items = await getMyEncounters(db, ctx.user.id, input.cursor);

      // 24h以内のひとことのみ返す
      const now = new Date();
      return items.map((item) => {
        const hitokotoAge = item.partnerHitokotoUpdatedAt
          ? now.getTime() - item.partnerHitokotoUpdatedAt.getTime()
          : Infinity;
        return {
          ...item,
          partnerHitokoto:
            hitokotoAge < 24 * 60 * 60 * 1000 ? item.partnerHitokoto : null,
        };
      });
    }),

  /**
   * 開封（自分側の openedByX を now に）。
   */
  open: protectedProcedure
    .input(z.object({ encounterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await openEncounter(db, ctx.user.id, input.encounterId);
      if (result === "not_found") {
        throw new TRPCError({ code: "NOT_FOUND", message: "すれ違いが見つかりません" });
      }
      if (result === "forbidden") {
        throw new TRPCError({ code: "FORBIDDEN", message: "このすれ違いを開封する権限がありません" });
      }
      return { ok: true };
    }),

  /**
   * 一方向リアクション（1すれ違い1回）。
   */
  react: protectedProcedure
    .input(z.object({ encounterId: z.number(), emoji: z.string().max(8) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      const isParty = await isEncounterParty(db, input.encounterId, ctx.user.id);
      if (!isParty) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "すれ違いが見つからないか、リアクションする権限がありません",
        });
      }

      await db
        .insert(reactions)
        .values({
          encounterId: input.encounterId,
          senderId: ctx.user.id,
          emoji: input.emoji,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [reactions.encounterId, reactions.senderId],
          set: { emoji: input.emoji },
        });

      return { ok: true };
    }),

  /**
   * ひとこと更新（NGワードフィルタ通過必須）。
   */
  updateHitokoto: protectedProcedure
    .input(z.object({ text: z.string().max(140) }))
    .mutation(async ({ ctx, input }) => {
      const result = await moderateText(input.text, {
        groqApiKey: process.env.GROQ_API_KEY,
        geminiApiKey: process.env.GEMINI_API_KEY,
      });

      if (result.rejected) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `不適切なひとことです (${result.stage})`,
        });
      }

      const db = await requireDb();

      await db
        .update(users)
        .set({ hitokoto: input.text, hitokotoUpdatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      return { ok: true };
    }),
});
