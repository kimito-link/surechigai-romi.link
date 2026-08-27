/**
 * 写真から思い出をとりこむ画面。
 *
 * 設計: docs/photo-import-and-viral-DESIGN.md A章・C-5。
 *
 * ★この機能の売りは「写真をアップロードしないこと」。
 *   画面上でもそれを最初に言う（信頼が機能そのものなので、小さく添えない）。
 *
 * ★EXIF が取れない写真でも成立させること。位置なしの写真は
 *   「地図で指定する」に合流させる。ここを削ると、スクショや
 *   SNS保存画像しか持っていない人にとって「何も起きないアプリ」になる
 *   （会議の批判役が刺した穴。DESIGN.md D章）。
 *
 * ★exifr の動的 import はハンドラ内だけ（lib/photo-exif.ts 側で担保）。
 *   import したチャンクを描画に使わない（React19 無限再レンダリング OOM の実績）。
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { trpc } from "@/lib/trpc";
import { useTrpcReady } from "@/lib/trpc-ready-context";
import { color } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import type { PhotoExifResult } from "@/lib/photo-exif";

/** 1回に扱う上限。サーバー側の IMPORT_MAX_ITEMS と一致させること。 */
const MAX_PHOTOS = 20;

type PhotoRow = PhotoExifResult & {
  /** とりこむ対象に含めるか */
  selected: boolean;
  /** 位置が無い写真に本人が指定した座標 */
  manualLat: number | null;
  manualLng: number | null;
  /** 位置が無い写真に本人が指定した日付（YYYY-MM-DD） */
  manualDate: string;
};

function formatWhen(d: Date | null): string {
  if (!d) return "撮影日時なし";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

/** 取り込める状態か（座標と日時が揃っているか） */
function isReady(row: PhotoRow): boolean {
  const hasCoord = row.lat != null || (row.manualLat != null && row.manualLng != null);
  const hasWhen = row.takenAt != null || row.manualDate.length === 10;
  return hasCoord && hasWhen;
}

/**
 * 外側のガード。
 *
 * ★tRPC を呼ぶコンポーネントは、Provider が用意できるまで**マウントしない**こと
 *   （2026-08-14 実ブラウザで発覚。ゲストWebは tRPC Provider を defer する経路があり、
 *    その窓で `trpc.*` に触ると "Unable to find tRPC Context" で画面全体が
 *    ErrorBoundary に落ちる）。`enabled: false` では防げない＝
 *    呼び出しコンポーネント自体を出さないのが唯一の回避策
 *    （nav-live-prefecture-panel.tsx / premium.tsx と同じ型）。
 */
export function PhotoImportScreen() {
  const { isAuthenticated, isAuthReady } = useAuth();
  /* ★login() を直に呼ばない（Guideline 4.8）。
     provider 省略の login() は既定の "x" に直行し、Apple を選ぶ隙が無くなる。
     build 524 の却下はこの形が11画面にあったことが原因だった。
     useLoginGuide なら X と Apple が並ぶ /sign-in へ送られる。 */
  const openLoginGuide = useLoginGuide();
  const trpcReady = useTrpcReady();

  // 未ログインはここで止める（足あとは本人のものなので）。
  // ここは tRPC を触らないので Provider の有無に関係なく描画できる。
  if (isAuthReady && !isAuthenticated) {
    return (
      <ScreenContainer style={{ backgroundColor: color.bg }} edges={["top", "bottom"]}>
        <View style={{ padding: 24, gap: 16, maxWidth: 560, alignSelf: "center", width: "100%" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: color.textPrimary }}>
            写真から思い出をとりこむ
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 23, color: color.textSecondary }}>
            過去に撮った写真の場所を、あなたの足あととして地図に灯します。
            ログインするとご利用いただけます。
          </Text>
          <Pressable
            onPress={() => openLoginGuide()}
            accessibilityRole="button"
            style={{
              minHeight: 48,
              borderRadius: 8,
              backgroundColor: color.accentPrimary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: color.textOnAccent, fontSize: 16, fontWeight: "800" }}>
              ログインして続ける
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // ネイティブは v1.2。落とさず案内する（設計 地雷7）
  if (Platform.OS !== "web") {
    return (
      <ScreenContainer style={{ backgroundColor: color.bg }} edges={["top", "bottom"]}>
        <View style={{ padding: 24, gap: 12, maxWidth: 560, alignSelf: "center", width: "100%" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: color.textPrimary }}>
            写真から思い出をとりこむ
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 23, color: color.textSecondary }}>
            この機能は、いまはブラウザ版でご利用いただけます。
            アプリ版でも使えるように準備しています。
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // ここに来るのは「認証済み」または「認証の判定がまだ」のとき。
  // tRPC Provider が用意できるまで本体を出さない（触ると画面が落ちるため）。
  //
  // ★スピナーを出す条件を欲張らないこと（2026-08-14 実ブラウザで踏んだ）。
  //   最初 `!isAuthReady || !trpcReady` にしていたら、ゲストでは trpcReady が
  //   永遠に true にならず**無限スピナー**になり、上のログイン導線に
  //   一生たどり着かなかった。ログイン判定を先に済ませ、ここでは
  //   Provider の有無だけを見る。
  if (!trpcReady) {
    return (
      <ScreenContainer style={{ backgroundColor: color.bg }} edges={["top", "bottom"]}>
        <View style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator color={color.accentPrimary} />
        </View>
      </ScreenContainer>
    );
  }

  return <PhotoImportBody />;
}

/** tRPC を実際に呼ぶ本体。Provider が確実にある状態でのみマウントされる。 */
function PhotoImportBody() {
  /**
   * ★useToast は使わない（2026-08-14 実ブラウザで発覚）。
   *   ToastProvider は ClerkRootProvider の内側にしか無く、この画面は
   *   認証前でも描画されるため provider の外に出て
   *   「useToast must be used within a ToastProvider」で画面全体が落ちた。
   *   エラーは画面内に自前で出す（依存を増やさない）。
   */
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const showError = useCallback((msg: string) => setErrorMsg(msg), []);
  // -----------------------------------------------------------------------
  // 画面の状態（選んだ写真の一覧・解析中か・取り込み結果）
  // -----------------------------------------------------------------------
  const [rows, setRows] = useState<PhotoRow[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState<null | {
    imported: number;
    skippedDuplicates: number;
    rejected: number;
    newAreas: string[];
  }>(null);
  const rowsRef = useRef<PhotoRow[]>([]);
  rowsRef.current = rows;

  const importMutation = trpc.encounter.importFootprints.useMutation();

  // ObjectURL を放置するとメモリを食う（20枚のHEIC）。画面を出るときに必ず解放する。
  useEffect(() => {
    return () => {
      void import("@/lib/photo-exif").then((m) => m.revokePreviewUrls(rowsRef.current));
    };
  }, []);

  // -----------------------------------------------------------------------
  // 写真を選ぶ → EXIF を読む（アップロードはしない。端末内で完結）
  // -----------------------------------------------------------------------
  const onPickFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      if (files.length > MAX_PHOTOS) {
        showError(`一度にとりこめるのは${MAX_PHOTOS}枚までです`);
      }
      setAnalyzing(true);
      setDone(null);
      setErrorMsg(null);
      try {
        // ★ここで動的 import。結果はデータとしてだけ使う（描画に使わない）
        const { extractPhotoExifBatch } = await import("@/lib/photo-exif");
        const results = await extractPhotoExifBatch(files.slice(0, MAX_PHOTOS));
        setRows(
          results.map((r) => ({
            ...r,
            selected: true,
            manualLat: null,
            manualLng: null,
            manualDate: "",
          })),
        );
      } catch {
        showError("写真を読み取れませんでした。別の写真でお試しください");
      } finally {
        setAnalyzing(false);
      }
    },
    [showError],
  );

  const toggleRow = useCallback((index: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)),
    );
  }, []);

  const setRowField = useCallback(
    (index: number, patch: Partial<Pick<PhotoRow, "manualLat" | "manualLng" | "manualDate">>) => {
      setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    },
    [],
  );

  // -----------------------------------------------------------------------
  // 取り込みを実行する（選択済み・場所と日付が揃った行だけ送る）
  // -----------------------------------------------------------------------
  const onImport = useCallback(async () => {
    const targets = rowsRef.current.filter((r) => r.selected && isReady(r));
    if (targets.length === 0) {
      showError("とりこめる写真がありません。場所と日付を指定してください");
      return;
    }
    try {
      const res = await importMutation.mutateAsync({
        items: targets.map((r) => {
          const lat = r.lat ?? r.manualLat!;
          const lng = r.lng ?? r.manualLng!;
          const when = r.takenAt ?? new Date(`${r.manualDate}T12:00:00`);
          return {
            lat,
            lng,
            recordedAt: when.getTime(),
            source: (r.lat != null ? "photo" : "manual") as "photo" | "manual",
          };
        }),
      });
      setDone(res);
    } catch {
      showError("とりこみに失敗しました。時間をおいて再度お試しください");
    }
  }, [importMutation, showError]);


  const readyCount = rows.filter((r) => r.selected && isReady(r)).length;
  const noGpsCount = rows.filter((r) => r.lat == null).length;

  // -----------------------------------------------------------------------
  // 描画
  // -----------------------------------------------------------------------
  return (
    <ScreenContainer style={{ backgroundColor: color.bg }} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 56,
          gap: 16,
          maxWidth: 720,
          alignSelf: "center",
          width: "100%",
        }}
      >
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: color.textPrimary }}>
            写真から思い出をとりこむ
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 23, color: color.textSecondary }}>
            過去に撮った写真の
            <Text style={{ fontWeight: "800", color: color.textPrimary }}>場所と日時</Text>
            だけを読み取って、あなたの足あととして地図に灯します。
          </Text>
          {/* 信頼が機能そのものなので、目立つ位置に置く */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "flex-start",
              backgroundColor: color.surfaceEmphasis,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <MaterialIcons name="lock" size={18} color={color.accentPrimary} />
            <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: color.textSecondary }}>
              写真そのものは送信されません。読み取りはこの端末の中だけで行われ、
              保存されるのは場所と日時だけです。
            </Text>
          </View>
        </View>

        {/* 選ぶ */}
        <View style={{ gap: 8 }}>
          {/* React Native Web では input を直接置く。ネイティブには来ない経路。 */}
          {React.createElement("input", {
            type: "file",
            accept: "image/*",
            multiple: true,
            onChange: (e: { target: { files: FileList | null } }) => {
              const list = e.target.files;
              if (!list) return;
              void onPickFiles(Array.from(list));
            },
            style: {
              fontSize: 15,
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${color.border}`,
              background: color.surface,
              color: color.textPrimary,
              width: "100%",
            },
          })}
          <Text style={{ fontSize: 12, color: color.textMuted }}>
            一度に{MAX_PHOTOS}枚までとりこめます
          </Text>
        </View>

        {analyzing ? (
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <ActivityIndicator color={color.accentPrimary} />
            <Text style={{ fontSize: 14, color: color.textSecondary }}>写真を読み取っています…</Text>
          </View>
        ) : null}

        {errorMsg ? (
          <View
            style={{
              backgroundColor: color.surface,
              borderWidth: 1,
              borderColor: color.danger,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 14, lineHeight: 21, color: color.textPrimary }}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* 位置が取れなかった枚数を先に伝える（黙って減らさない） */}
        {rows.length > 0 && noGpsCount > 0 ? (
          <View
            style={{
              backgroundColor: color.surface,
              borderWidth: 1,
              borderColor: color.borderAlt,
              borderRadius: 8,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: color.textPrimary }}>
              {noGpsCount}枚は位置情報が入っていません
            </Text>
            <Text style={{ fontSize: 13, lineHeight: 20, color: color.textMuted }}>
              スクリーンショットや、SNSから保存した写真は位置情報が消えていることがあります。
              地図から場所を指定すれば、その写真もとりこめます。
            </Text>
          </View>
        ) : null}

        {/* 写真の一覧 */}
        {rows.map((row, index) => {
          const ready = isReady(row);
          return (
            <Pressable
              key={`${row.fileName}-${index}`}
              onPress={() => toggleRow(index)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: row.selected }}
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
                backgroundColor: color.surface,
                borderWidth: 1,
                borderColor: row.selected ? color.accentPrimary : color.borderAlt,
                borderRadius: 8,
                padding: 12,
                opacity: row.selected ? 1 : 0.55,
              }}
            >
              <MaterialIcons
                name={row.selected ? "check-box" : "check-box-outline-blank"}
                size={22}
                color={row.selected ? color.accentPrimary : color.textMuted}
              />
              {/* HEIC はブラウザが描画できないことがある。失敗しても崩れないようにする */}
              {row.previewUrl
                ? React.createElement("img", {
                    src: row.previewUrl,
                    alt: "",
                    style: {
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 6,
                      background: color.surfaceEmphasis,
                    },
                  })
                : null}
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: color.textPrimary }}>
                  {row.fileName || "写真"}
                </Text>
                <Text style={{ fontSize: 12, color: color.textMuted }}>
                  {formatWhen(row.takenAt)}
                </Text>
                <Text style={{ fontSize: 12, color: ready ? color.accentPrimary : color.accentOrange }}>
                  {row.lat != null
                    ? `📍 ${row.lat.toFixed(5)}, ${row.lng!.toFixed(5)}`
                    : "📍 位置情報なし（下で指定できます）"}
                </Text>

                {/*
                  ★足りないものだけを埋めさせる。
                    ここを削ると、EXIF が無い写真しか持っていない人にとって
                    「何も起きないアプリ」になる（会議の批判役が刺した穴）。
                */}
                {row.selected && (row.lat == null || row.takenAt == null) ? (
                  // 入力欄のタップで行の選択が外れないようにする
                  <View
                    style={{ gap: 6, marginTop: 6 }}
                    // @ts-expect-error react-native-web はDOMイベントを透過する
                    onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
                  >
                    {row.takenAt == null
                      ? React.createElement("input", {
                          type: "date",
                          value: row.manualDate,
                          max: new Date().toISOString().slice(0, 10),
                          onChange: (e: { target: { value: string } }) =>
                            setRowField(index, { manualDate: e.target.value }),
                          "aria-label": "撮影した日",
                          style: {
                            fontSize: 14,
                            padding: 8,
                            borderRadius: 6,
                            border: `1px solid ${color.borderAlt}`,
                            background: color.surface,
                            color: color.textPrimary,
                          },
                        })
                      : null}
                    {row.lat == null ? (
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {React.createElement("input", {
                          type: "number",
                          step: "0.00001",
                          placeholder: "緯度 例: 35.68",
                          value: row.manualLat ?? "",
                          onChange: (e: { target: { value: string } }) =>
                            setRowField(index, {
                              manualLat: e.target.value === "" ? null : Number(e.target.value),
                            }),
                          "aria-label": "緯度",
                          style: {
                            flex: 1,
                            minWidth: 0,
                            fontSize: 14,
                            padding: 8,
                            borderRadius: 6,
                            border: `1px solid ${color.borderAlt}`,
                            background: color.surface,
                            color: color.textPrimary,
                          },
                        })}
                        {React.createElement("input", {
                          type: "number",
                          step: "0.00001",
                          placeholder: "経度 例: 139.76",
                          value: row.manualLng ?? "",
                          onChange: (e: { target: { value: string } }) =>
                            setRowField(index, {
                              manualLng: e.target.value === "" ? null : Number(e.target.value),
                            }),
                          "aria-label": "経度",
                          style: {
                            flex: 1,
                            minWidth: 0,
                            fontSize: 14,
                            padding: 8,
                            borderRadius: 6,
                            border: `1px solid ${color.borderAlt}`,
                            background: color.surface,
                            color: color.textPrimary,
                          },
                        })}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}

        {/* とりこむ */}
        {rows.length > 0 && !done ? (
          <Pressable
            onPress={() => void onImport()}
            disabled={readyCount === 0 || importMutation.isPending}
            accessibilityRole="button"
            accessibilityState={{ disabled: readyCount === 0 || importMutation.isPending }}
            style={{
              minHeight: 48,
              borderRadius: 8,
              backgroundColor:
                readyCount === 0 || importMutation.isPending ? color.textDisabled : color.accentPrimary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: color.textOnAccent, fontSize: 16, fontWeight: "800" }}>
              {importMutation.isPending ? "とりこんでいます…" : `${readyCount}枚をとりこむ`}
            </Text>
          </Pressable>
        ) : null}

        {/* 結果。skip や reject も黙って消さずに必ず出す */}
        {done ? (
          <View
            style={{
              backgroundColor: color.surface,
              borderWidth: 1,
              borderColor: color.accentPrimary,
              borderRadius: 8,
              padding: 16,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: color.textPrimary }}>
              {done.imported}件の思い出を地図に灯しました
            </Text>
            {done.newAreas.length > 0 ? (
              <Text style={{ fontSize: 14, lineHeight: 21, color: color.textSecondary }}>
                図鑑に増えた街: {done.newAreas.join("、")}
              </Text>
            ) : null}
            {done.skippedDuplicates > 0 ? (
              <Text style={{ fontSize: 13, color: color.textMuted }}>
                {done.skippedDuplicates}件は、すでに灯っていました
              </Text>
            ) : null}
            {done.rejected > 0 ? (
              <Text style={{ fontSize: 13, color: color.textMuted }}>
                {done.rejected}件は、場所か日時を読み取れずとりこめませんでした
              </Text>
            ) : null}
            <Text style={{ fontSize: 13, lineHeight: 20, color: color.textMuted }}>
              とりこんだ足あとは、まずあなただけに見える状態です。
              公開したい足あとは、地図から1件ずつ選んで公開できます。
            </Text>
            <Pressable
              onPress={() => navigate.toMapTab()}
              accessibilityRole="button"
              style={{
                minHeight: 48,
                borderRadius: 8,
                backgroundColor: color.accentPrimary,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 4,
              }}
            >
              <Text style={{ color: color.textOnAccent, fontSize: 16, fontWeight: "800" }}>
                自分の軌跡マップで見る
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
