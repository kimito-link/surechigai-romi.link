/**
 * lib/live-camera/live-camera-links.ts
 *
 * 足あとの場所の「いまの様子」を見に行く導線。
 *
 * ★方式が「リンク」である理由（2026-08-15 に実測して確定）:
 *   - 国交省の河川カメラ**画像データのAPIは有償**（河川情報センター経由の実費配信）。
 *     無料で使える画像APIは存在しない → 画像を取り込まずリンクで見せる
 *   - 埋め込みは規約上グレー（公式ページに「各映像の視聴等は各管理団体へ
 *     お問い合わせ下さい」）。加えて CSP の frame-src 緩和が必要になる
 *     → 埋め込みはしない（セキュリティ境界を外部事業者の都合で広げない）
 *   - 公式一覧ページを普通にリンクする分には無料で制約もない
 *
 * ★載せない地方（実測の結果・推測ではない）:
 *   - 東北 (pdasv1.thr.mlit.go.jp) … curl で到達不能(000)
 *   - 北海道 / 中国 … http のみ。openExternalUrl は https しか通さないため、
 *     載せると「押しても無反応」になる。それは最悪の体験なので出さない
 *
 * 「無い場所のほうが多い」前提なので、対応していない県では導線ごと出さない。
 */

export type LiveCameraLink = {
  /** 開く先（https のみ。ホワイトリスト登録済みのホストであること） */
  url: string;
  /** ボタンに出す文言 */
  label: string;
};

/**
 * 都道府県 → 国交省の道路ライブカメラ一覧ページ。
 * すべて 2026-08-15 に HTTP 200 を実測して採用した。
 */
export const LIVE_CAMERA_LINKS: Record<string, LiveCameraLink> = (() => {
  const kanto: LiveCameraLink = {
    url: "https://www.ktr.mlit.go.jp/guide/guide00000012.html",
    label: "関東地方整備局のライブカメラ",
  };
  const hokuriku: LiveCameraLink = {
    url: "https://www.hrr.mlit.go.jp/top/live.html",
    label: "北陸地方整備局のライブカメラ",
  };
  const chubu: LiveCameraLink = {
    url: "https://www.cbr.mlit.go.jp/livecamera.htm",
    label: "中部地方整備局のライブカメラ",
  };
  const kinki: LiveCameraLink = {
    url: "https://www.kkr.mlit.go.jp/road/odekakejouhou/camera.html",
    label: "近畿地方整備局のライブカメラ",
  };
  const shikoku: LiveCameraLink = {
    url: "https://www.road-info-prvs.mlit.go.jp/roadinfo/index.php",
    label: "四国地方整備局のライブカメラ",
  };
  const kyushu: LiveCameraLink = {
    url: "https://www.qsr.mlit.go.jp/useful/road_livecam.html",
    label: "九州地方整備局のライブカメラ",
  };

  return {
    // 関東
    茨城県: kanto,
    栃木県: kanto,
    群馬県: kanto,
    埼玉県: kanto,
    千葉県: kanto,
    東京都: kanto,
    神奈川県: kanto,
    山梨県: kanto,
    // 北陸
    新潟県: hokuriku,
    富山県: hokuriku,
    石川県: hokuriku,
    // 中部
    長野県: chubu,
    岐阜県: chubu,
    静岡県: chubu,
    愛知県: chubu,
    三重県: chubu,
    // 近畿
    福井県: kinki,
    滋賀県: kinki,
    京都府: kinki,
    大阪府: kinki,
    兵庫県: kinki,
    奈良県: kinki,
    和歌山県: kinki,
    // 四国
    徳島県: shikoku,
    香川県: shikoku,
    愛媛県: shikoku,
    高知県: shikoku,
    // 九州
    福岡県: kyushu,
    佐賀県: kyushu,
    長崎県: kyushu,
    熊本県: kyushu,
    大分県: kyushu,
    宮崎県: kyushu,
    鹿児島県: kyushu,
  };
})();

/** 都道府県のライブカメラ一覧ページ。対応していなければ null（導線を出さない） */
export function liveCameraLinkFor(
  prefecture: string | null | undefined,
): LiveCameraLink | null {
  if (!prefecture) return null;
  return LIVE_CAMERA_LINKS[prefecture] ?? null;
}

/**
 * YouTube のライブ配信を地名で探す導線。
 *
 * 全国の任意地点を網羅する公式APIは無いが、観光地・河川・街頭のライブ配信が
 * 無料で多数公開されている。地点ごとのURLは持てないので「その地名で検索する」
 * 形にする。検索なので**どの場所でも必ず開ける**（国交省リンクと違い穴が無い）。
 *
 * youtube.com は外部リンクの許可リストに既に入っている。
 */
export function youtubeLiveSearchUrl(
  placeLabel: string | null | undefined,
): string | null {
  const place = placeLabel?.trim();
  if (!place) return null;

  // sp=EgJAAQ%3D%3D は YouTube の「ライブ」絞り込みフィルタ
  const q = encodeURIComponent(`${place} ライブカメラ`);
  return `https://www.youtube.com/results?search_query=${q}&sp=EgJAAQ%253D%253D`;
}
