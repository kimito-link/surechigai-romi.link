/**
 * /s/<id> のクローラー向けメタHTML。
 * 画像は保存済みの静的URLを指すだけなので、ここで描画しない。
 * 人間のブラウザは middleware がアプリ本体へリダイレクトする。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../../server/db/connection.js";
import { getShareCardById } from "../../server/db/share-cards.js";
import {
  buildShareCardDescription,
  buildShareCardMetaHtml,
  isStaticShareCardId,
  shareCardResponseHeaders,
  staticShareCardView,
  staticShareImageUrl,
  type ShareCardMetaInput,
} from "../../lib/ogp/share-card-meta.js";
import { toPublicPlace } from "../../lib/ogp/sanitize-public-place.js";

const APP_ORIGIN = "https://surechigai.kimito.link";

export async function resolveShareCardView(id: string): Promise<ShareCardMetaInput> {
  if (!/^[A-Za-z0-9]{1,16}$/.test(id) || isStaticShareCardId(id)) {
    return staticShareCardView(isStaticShareCardId(id) ? id : "default");
  }
  try {
    const db = await getDb();
    if (!db) return staticShareCardView("default");
    const row = await getShareCardById(db, id);
    if (!row) return staticShareCardView("default");
    const place = toPublicPlace({
      address: row.areaText,
      area: row.areaText,
      prefecture: row.areaText,
    });
    return {
      title: row.title,
      description: buildShareCardDescription(row.areaText),
      imageUrl: row.imageUrl,
      pageUrl: `${APP_ORIGIN}/s/${row.id}`,
      fallbackImageUrl: staticShareImageUrl(place.prefecture),
    };
  } catch {
    return staticShareCardView("default");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.id;
  const id = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const view = await resolveShareCardView(id);
  for (const [key, value] of Object.entries(shareCardResponseHeaders())) {
    res.setHeader(key, value);
  }
  res.status(200).send(buildShareCardMetaHtml(view));
}
