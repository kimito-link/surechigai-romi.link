/**
 * modules/encounter/api/visit.ts
 *
 * グループ内だけで使う訪問申告ルーター。
 * X投稿やログインに依存せず、共有グループコードを知っている人だけが
 * 同じ申告一覧・地図を見られる。
 */

import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../../../server/_core/trpc.js";
import { getDb } from "../../../server/db/connection.js";
import { assertFiniteLatLng, toGrid, toH3Cell } from "../core/geo.js";
import { reverseGeocode } from "../core/geocoding.js";
import {
  getGroupVisitStats,
  insertGroupVisitReport,
  listGroupVisitReports,
} from "../db/queries.js";

function normalizeGroupCode(input: string): string {
  return input.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function groupKeyFromCode(input: string): string {
  return createHash("sha256").update(normalizeGroupCode(input)).digest("hex");
}

function cleanText(input: string | undefined | null): string | null {
  const text = input?.normalize("NFKC").trim();
  return text ? text : null;
}

function assertValidLatLng(lat: number, lng: number) {
  const latLng = assertFiniteLatLng(lat, lng);
  if (!latLng || latLng.lat < -90 || latLng.lat > 90 || latLng.lng < -180 || latLng.lng > 180) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "無効な座標です" });
  }
  return latLng;
}

const groupCodeSchema = z.string().min(2).max(64);

export const visitRouter = router({
  /**
   * グループ訪問申告。ログイン不要。
   */
  report: publicProcedure
    .input(
      z.object({
        groupCode: groupCodeSchema,
        displayName: z.string().min(1).max(40),
        placeName: z.string().max(120).optional(),
        note: z.string().max(140).optional(),
        visitorToken: z.string().max(64).optional(),
        lat: z.number(),
        lng: z.number(),
        accuracy: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const groupCode = normalizeGroupCode(input.groupCode);
      if (groupCode.length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "グループコードを入力してください" });
      }

      const displayName = cleanText(input.displayName);
      if (!displayName) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "表示名を入力してください" });
      }

      if (input.accuracy !== undefined && input.accuracy > 10_000) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "位置精度が低すぎます (accuracy > 10000m)",
        });
      }

      const latLng = assertValidLatLng(input.lat, input.lng);
      const { latGrid, lngGrid } = toGrid(latLng.lat, latLng.lng);
      const h3R8 = toH3Cell(latGrid, lngGrid, 8);
      const groupKey = groupKeyFromCode(groupCode);

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "DB未接続です" });
      }

      const geocode = await reverseGeocode(latLng.lat, latLng.lng);
      const report = await insertGroupVisitReport(db, {
        groupKey,
        visitorToken: cleanText(input.visitorToken),
        displayName,
        placeName: cleanText(input.placeName),
        note: cleanText(input.note),
        lat: latLng.lat,
        lng: latLng.lng,
        accuracyM: input.accuracy ?? null,
        latGrid,
        lngGrid,
        h3R8,
        municipality: geocode.municipality,
        prefecture: geocode.prefecture,
        address: geocode.address,
      });

      const stats = await getGroupVisitStats(db, groupKey);
      return { report, stats };
    }),

  /**
   * グループコード単位の申告一覧・集計。ログイン不要。
   */
  list: publicProcedure
    .input(
      z.object({
        groupCode: groupCodeSchema,
        limit: z.number().int().min(1).max(300).optional(),
      })
    )
    .query(async ({ input }) => {
      const groupCode = normalizeGroupCode(input.groupCode);
      if (groupCode.length < 2) {
        return {
          reports: [],
          stats: {
            totalReports: 0,
            uniqueVisitors: 0,
            areaCount: 0,
            latestReportedAt: null,
          },
        };
      }

      const db = await getDb();
      if (!db) {
        return {
          reports: [],
          stats: {
            totalReports: 0,
            uniqueVisitors: 0,
            areaCount: 0,
            latestReportedAt: null,
          },
        };
      }

      const groupKey = groupKeyFromCode(groupCode);
      const [reports, stats] = await Promise.all([
        listGroupVisitReports(db, groupKey, input.limit ?? 120),
        getGroupVisitStats(db, groupKey),
      ]);

      return { reports, stats };
    }),
});
