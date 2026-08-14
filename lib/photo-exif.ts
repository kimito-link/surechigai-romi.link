/**
 * 写真から「場所と撮影時刻だけ」を取り出す。写真そのものは端末から出さない。
 *
 * 設計: docs/photo-import-and-viral-DESIGN.md C-2。
 *
 * ★この機能の一番の売りは「写真をアップロードしない」こと。
 *   解析はすべてブラウザ内で完結し、サーバーへ送るのは lat/lng/撮影時刻だけ。
 *   画像ストレージを持たない＝UGCモデレーション義務もEXIF公開事故も構造的に起きない。
 *
 * ★exifr は必ず「呼ばれたときに」動的 import する（トップレベル import しない）。
 *   このリポジトリは過去に、動的 import したチャンクを描画パスに置いて
 *   React19 の無限 sync 再レンダリングで本番 OOM を起こしている。
 *   ここでは「ハンドラ内で解析してデータだけ返す」に徹し、import 結果を描画に使わない。
 *
 * ★1枚の失敗が全体を壊さないこと。EXIF が無い写真（スクショ・SNS保存画像・
 *   位置情報オフで撮影）はごく普通にあるので、失敗は「位置なし」として返し、
 *   呼び出し側で手動指定に合流させる（EXIF が 0 枚でも機能が成立する）。
 */

/** 1枚の写真から取れたもの。lat/lng/takenAt は取れなければ null（失敗ではない）。 */
export type PhotoExifResult = {
  fileName: string;
  /** 10進の緯度。EXIF に GPS が無ければ null */
  lat: number | null;
  /** 10進の経度 */
  lng: number | null;
  /** 撮影時刻。DateTimeOriginal → CreateDate の順で拾う */
  takenAt: Date | null;
  /**
   * プレビュー用の ObjectURL。呼び出し側が revokeObjectURL する責任を持つ。
   * HEIC は Chrome/Firefox が <img> で描画できないが、URL 自体は作れるので
   * 「描画できるか」は呼び出し側の onError で判定する（解析の成否とは独立）。
   */
  previewUrl: string | null;
};

/** 座標として妥当か。0,0（EXIF 破損でよく出る）も弾く。 */
function isUsableCoord(lat: unknown, lng: unknown): lat is number {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // 緯度経度ちょうど0は「取得できなかった」を意味することが多い（大西洋の海上）
  if (lat === 0 && lng === 0) return false;
  return true;
}

/** Date として妥当か。EXIF は壊れた日時を持つことがある。 */
function toValidDate(value: unknown): Date | null {
  if (!(value instanceof Date)) return null;
  const t = value.getTime();
  if (Number.isNaN(t)) return null;
  return value;
}

/**
 * 写真1枚から位置と撮影時刻を取り出す。
 * 例外は投げない（呼び出し側でカードごとに隔離する必要がないよう、ここで吸収する）。
 */
export async function extractPhotoExif(file: File): Promise<PhotoExifResult> {
  const base: PhotoExifResult = {
    fileName: file?.name ?? "",
    lat: null,
    lng: null,
    takenAt: null,
    previewUrl: null,
  };

  // プレビュー URL は解析の成否と無関係に作る（解析が失敗しても写真は見せたい）
  try {
    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      base.previewUrl = URL.createObjectURL(file);
    }
  } catch {
    // ObjectURL が作れなくても解析は続ける
  }

  try {
    // ★ここで動的 import。トップレベルに置かない（上のコメント参照）
    //
    // ★★"exifr" ではなく "exifr/dist/lite.esm.js" を指すこと（2026-08-14 実障害）。
    //    既定の full ビルドは Node 用のフォールバックとして
    //      import(/* webpackIgnore: true */ e).then(t)
    //    を含んでおり、これを Hermes のバイトコード変換が受け付けない:
    //      main.jsbundle: error: Invalid expression encountered
    //    → iOS の Release ビルドが "Bundle React Native code and images" で失敗する。
    //    Web ビルドは通るので、**ネイティブをビルドするまで気づけない**種類の罠。
    //    lite は動的 import も require も持たず、GPS と DateTimeOriginal を含むので
    //    この用途には十分（44KB）。
    const exifr = await import("exifr/dist/lite.esm.js");
    // parse は「GPS と日時だけ」を要求する。全部読むと HEIC で重くなる。
    const parsed = (await exifr.parse(file, {
      gps: true,
      pick: ["GPSLatitude", "GPSLongitude", "DateTimeOriginal", "CreateDate", "latitude", "longitude"],
    })) as Record<string, unknown> | undefined;

    if (parsed) {
      const lat = parsed.latitude;
      const lng = parsed.longitude;
      if (isUsableCoord(lat, lng)) {
        base.lat = lat as number;
        base.lng = lng as number;
      }
      base.takenAt = toValidDate(parsed.DateTimeOriginal) ?? toValidDate(parsed.CreateDate);
    }
  } catch {
    // EXIF が無い・壊れている・HEIC の解析に失敗した等。
    // すべて「位置なし」として扱い、呼び出し側の手動指定へ合流させる。
  }

  return base;
}

/**
 * 複数枚をまとめて解析する。1枚の失敗が他を止めないこと。
 * 枚数上限は呼び出し側（画面）とサーバーの両方で持つ。
 */
export async function extractPhotoExifBatch(files: File[]): Promise<PhotoExifResult[]> {
  const out: PhotoExifResult[] = [];
  for (const file of files) {
    out.push(await extractPhotoExif(file));
  }
  return out;
}

/** 呼び出し側の後片付け用。ObjectURL を放置するとメモリを食う。 */
export function revokePreviewUrls(results: Pick<PhotoExifResult, "previewUrl">[]): void {
  if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") return;
  for (const r of results) {
    if (r.previewUrl) {
      try {
        URL.revokeObjectURL(r.previewUrl);
      } catch {
        // noop
      }
    }
  }
}
