/**
 * 「この近くの乗りもの・トイレ」（nearby-ride-map と連携）の型。
 * api/nearby-ride.ts（中継）と hooks/use-nearby-ride.ts の両方が使う。
 */
export const NEARBY_RIDE_SITE = "https://nearby-ride-map.vercel.app";

/** 「地図で全部見る」の行き先。流入元が分かるよう utm を付ける（nearby-ride-map 側で inbound として計測） */
export const NEARBY_RIDE_OPEN_URL = `${NEARBY_RIDE_SITE}/?utm_source=surechigai&utm_medium=referral&utm_campaign=checkin`;

/**
 * 中継APIに渡す座標の丸め（小数3桁 ≒ 約100m）。
 * 同じ場所の問い合わせを CDN で1分まとめられる（上流への負荷と費用を抑える）。徒歩の分数は1分程度しか変わらない。
 */
export function roundForNearby(v: number): string {
  return v.toFixed(3);
}

export type NearbyRideItem = {
  kind: "ride" | "toilet";
  /** 表示名（ポート名・トイレ名） */
  name: string;
  /** 乗りもの: サービス名 / トイレ: 「公衆トイレ」など */
  sub: string;
  walkMin: number;
  /** 乗りもの: 空き台数（不明は null）。トイレは常に null */
  available: number | null;
};

export type NearbyRideResult = {
  rides: NearbyRideItem[];
  toilets: NearbyRideItem[];
  /** 公開データの無いサービス（LUUP など）のエリア名 */
  areas: string[];
  /** データの出典（画面に表示する。CC BY の条件） */
  credits: string[];
};

/** 上流（nearby-ride-map）の返り値から、画面に出す分だけを取り出す。純粋関数 */
export function pickNearbyRide(
  nearby: unknown,
  toilets: unknown,
  limit = 3,
): NearbyRideResult {
  const out: NearbyRideResult = { rides: [], toilets: [], areas: [], credits: [] };
  const n = (nearby ?? {}) as {
    spots?: Array<Record<string, unknown>>;
    labels?: Record<string, string>;
    credits?: string[];
  };
  const labels = n.labels ?? {};
  for (const s of n.spots ?? []) {
    if (s.kind === "area") {
      const label = labels[String(s.service)] ?? String(s.service);
      if (!out.areas.includes(label)) out.areas.push(label);
      continue;
    }
    if (typeof s.name !== "string" || typeof s.walkMin !== "number") continue;
    // 空きが0台のポートは後ろへ（行っても乗れない）
    out.rides.push({
      kind: "ride",
      name: s.name,
      sub: labels[String(s.service)] ?? String(s.service),
      walkMin: s.walkMin,
      available: typeof s.available === "number" ? s.available : null,
    });
  }
  out.rides = out.rides
    .map((r, i) => ({ r, i }))
    .sort((a, b) => Number(a.r.available === 0) - Number(b.r.available === 0) || a.i - b.i)
    .map((x) => x.r)
    .slice(0, limit);

  const t = (toilets ?? {}) as { toilets?: Array<Record<string, unknown>>; credits?: string[] };
  out.toilets = (t.toilets ?? [])
    .filter((x) => typeof x.walkMin === "number")
    .sort((a, b) => (a.walkMin as number) - (b.walkMin as number))
    .slice(0, limit)
    .map((x) => ({
      kind: "toilet" as const,
      name: typeof x.name === "string" && x.name ? x.name : x.kind === "borrow" ? "借りられるトイレ" : "公衆トイレ",
      sub: x.kind === "borrow" ? "ホテル・デパートなど" : "公衆トイレ",
      walkMin: x.walkMin as number,
      available: null,
    }));

  const hasRide = out.rides.length > 0;
  const hasToilet = out.toilets.length > 0;
  if (hasRide) out.credits.push(...(n.credits ?? []));
  if (hasToilet) out.credits.push(...(t.credits ?? []));
  return out;
}
