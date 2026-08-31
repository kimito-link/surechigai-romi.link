/** OSM タイル地図の純関数（PrecisionTileMap 本体を import せず使える軽量モジュール）。 */

export const TILE_SIZE = 256;
export const MAX_TILE_LAT = 85.05112878;

export type TrailPoint = {
  id: number;
  lat: number;
  lng: number;
  accuracyM: number | null;
  municipality: string | null;
  prefecture: string | null;
  /** 逆ジオコーディング由来の住所＝「事実」。ユーザーの自由入力を入れないこと。 */
  address: string | null;
  recordedAt: Date | string;
  visibility?: string | null;
  /**
   * 本人が付けた店名など＝「主張」。address と混ぜると地図上で事実と区別できなくなる
   * （docs/place-info-DESIGN.md 地雷4）。描画してよいのは FootprintSheet だけで、
   * 地図の情報パネル(precision-tile-map の formatPlace)は address のみを出し続ける。
   */
  placeName?: string | null;
  note?: string | null;
  noteUpdatedAt?: Date | string | null;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 押された点を「地図フレーム内のピクセル座標」に直す。
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ■ ★なぜ要るか（2026-09-01・本番のチェックインで実際に起きていた）
 *
 *   PC ブラウザでチェックイン →「地図をクリックして位置を修正」すると、
 *   保存時に赤いエラーが出ていた:
 *     "Invalid input: expected number, received NaN"（path: lat / lng）
 *
 *   ★真因: react-native-web の Pressable の onPress は、レスポンダー由来の
 *   合成イベントではなく**素の DOM MouseEvent** を渡す。
 *   locationX / locationY は合成イベントにしか無いプロパティなので undefined になる。
 *   （react-native-web/dist/modules/usePressEvents/PressResponder.js のコメントに
 *     onPress が click イベントから発火する旨が書かれている）
 *
 *   それが無検査で pixelToLatLng に入り、undefined + number = NaN が全式に伝播した。
 *   ★clamp は NaN を止めない（Math.min(Math.max(NaN,..)) = NaN）。実測で確認済み。
 *
 * ■ ★「押しても無反応」にはしない
 *   NaN を捨てるだけだと、PC で地図クリックが**何も起きない**画面になる。
 *   このリポには「押せなくする修正は却下より悪い」という教訓がある（iOS 520/529）。
 *   ★だから捨てる前に、正しい座標を取り直すのがこの関数の役割。
 *
 * ■ ★Platform で分岐しない
 *   ネイティブは locationX が有限なので1本目で確定し、rect には触れない。
 *   Web だけ clientX から算出する。★「値の有無」で分けるので、
 *   将来 react-native-web の実装が変わってもどちらでも動く。
 *
 * @param ne  押下イベントの nativeEvent（形が違う環境があるので緩く受ける）
 * @param rect 地図フレームの矩形（getBoundingClientRect の結果）。取れなければ null
 * @returns フレーム内座標。★どちらの方法でも決められなければ null（捨てる）
 * ───────────────────────────────────────────────────────────────────────────
 */
export function resolvePressPoint(
  ne: {
    locationX?: number | null;
    locationY?: number | null;
    clientX?: number | null;
    clientY?: number | null;
    // ★RN の NativeTouchEvent は clientX を型に持たないが、Web では実体に載っている。
    //   型を厳しくすると呼び出し側が通らないので、ここは緩く受けて実行時に確かめる。
    changedTouches?: ArrayLike<unknown>;
  } | null | undefined,
  rect: { left: number; top: number } | null | undefined,
): { x: number; y: number } | null {
  if (!ne) return null;

  // ① ネイティブ: View 相対の座標がそのまま来る
  if (Number.isFinite(ne.locationX) && Number.isFinite(ne.locationY)) {
    return { x: ne.locationX as number, y: ne.locationY as number };
  }

  // ② Web: ビューポート座標 - フレームの左上 で相対座標にする。
  //    ★タッチ（スマホWeb）は clientX がイベント直下に無く changedTouches に入る。
  const touch = (
    ne.changedTouches && ne.changedTouches.length > 0 ? ne.changedTouches[0] : null
  ) as { clientX?: number | null; clientY?: number | null } | null;
  const clientX = Number.isFinite(ne.clientX) ? ne.clientX : touch?.clientX;
  const clientY = Number.isFinite(ne.clientY) ? ne.clientY : touch?.clientY;

  if (rect && Number.isFinite(clientX) && Number.isFinite(clientY)) {
    return { x: (clientX as number) - rect.left, y: (clientY as number) - rect.top };
  }

  // ③ ★決められなかった。呼び出し側は捨てること（NaN を先へ流さない）。
  return null;
}

/** 地図上のクリック座標 → 緯度経度（PrecisionTileMap の projectPoint の逆変換） */
export function pixelToLatLng(
  x: number,
  y: number,
  topLeft: { x: number; y: number },
  zoom: number,
): { lat: number; lng: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const worldX = x + topLeft.x;
  const worldY = y + topLeft.y;
  const lng = (worldX / scale) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * worldY) / scale)));
  const lat = clamp((latRad * 180) / Math.PI, -MAX_TILE_LAT, MAX_TILE_LAT);
  return { lat, lng };
}

export function latLngToWorldPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const clampedLat = clamp(lat, -MAX_TILE_LAT, MAX_TILE_LAT);
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

/**
 * 複数の点がすべて収まる中心座標とズームを算出。
 */
export function fitCenterZoom(
  points: { lat: number; lng: number }[],
  mapW: number,
  mapH: number,
): { center: { lat: number; lng: number }; zoom: number } {
  if (points.length === 0) {
    return { center: { lat: 36.2048, lng: 138.2529 }, zoom: 5 };
  }
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  const center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
  if (points.length === 1) return { center, zoom: 14 };

  const mercY = (l: number) => Math.log(Math.tan(Math.PI / 4 + (l * Math.PI / 180) / 2));
  const worldLng = Math.max((maxLng - minLng) / 360, 1e-6);
  const worldLat = Math.max((mercY(maxLat) - mercY(minLat)) / (2 * Math.PI), 1e-6);
  const zoomLng = Math.log2(mapW / (TILE_SIZE * worldLng));
  const zoomLat = Math.log2(mapH / (TILE_SIZE * worldLat));
  const zoom = Math.floor(Math.min(zoomLng, zoomLat)) - 1;
  return { center, zoom: clamp(zoom, 5, 16) };
}
