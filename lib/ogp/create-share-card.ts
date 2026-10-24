/**
 * シェアボタンのたびに凍結カードを1枚作る。
 * 描画・Blob・DBのどれが失敗しても、都道府県か既定の静的画像URLを返す。
 * 住所文字列はこの関数の外へ出さない。描画へ渡すのは公開ラベルだけ。
 */
import {
  staticShareCardId,
  staticShareImageUrl,
  buildShareCardTitle,
  APP_ORIGIN,
} from "./share-card-meta.js";
import { toPublicPlace } from "./sanitize-public-place.js";

/** 空タブを見たまま待たせない。クライアントの共有タイムアウト（8秒）より短く切る。 */
export const SHARE_CARD_BUDGET_MS = 3500;
export const SHARE_CARD_MAX_IMAGE_BYTES = 300 * 1024;

export type ShareCardRenderInput = {
  label: string | null;
};

export type ShareCardImage = {
  body: Uint8Array;
  contentType: "image/jpeg" | "image/png" | "image/webp";
};

export type FrozenShareCardInput = {
  userId: number;
  address?: string | null;
  area?: string | null;
  prefecture?: string | null;
  handle?: string | null;
};

export type ShareCardRow = {
  id: string;
  userId: number;
  areaText: string | null;
  title: string;
  imageUrl: string;
};

export type FrozenShareCardDeps = {
  renderImage: (input: ShareCardRenderInput) => Promise<ShareCardImage | null>;
  uploadImage: (id: string, image: ShareCardImage) => Promise<string | null>;
  /** 300KBを超えたときだけ呼ぶ。失敗したら静的画像に落とす。 */
  compressImage?: (image: ShareCardImage) => Promise<ShareCardImage | null>;
  insertCard: (row: ShareCardRow) => Promise<void>;
  newId: () => string;
  origin?: string;
  budgetMs?: number;
  now?: () => number;
};

export type FrozenShareCardResult = {
  id: string;
  url: string;
  areaLabel: string | null;
  imageUrl: string;
  fallback: boolean;
};

function safeHandle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const handle = raw.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
  return handle;
}

function withDeadline<T>(work: Promise<T>, ms: number): Promise<T | null> {
  if (ms <= 0) return Promise.resolve(null);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

function fitsBudget(image: ShareCardImage | null): image is ShareCardImage {
  return !!image && image.body.byteLength > 0 && image.body.byteLength <= SHARE_CARD_MAX_IMAGE_BYTES;
}

export async function createFrozenShareCard(
  input: FrozenShareCardInput,
  deps: FrozenShareCardDeps,
): Promise<FrozenShareCardResult> {
  const origin = deps.origin ?? APP_ORIGIN;
  const budgetMs = deps.budgetMs ?? SHARE_CARD_BUDGET_MS;
  const now = deps.now ?? Date.now;
  const started = now();
  const remaining = () => Math.max(0, budgetMs - (now() - started));

  const place = toPublicPlace({
    address: input.address,
    area: input.area,
    prefecture: input.prefecture,
  });
  const areaText = place.label;
  const title = buildShareCardTitle(safeHandle(input.handle), areaText);
  const fallbackImage = staticShareImageUrl(place.prefecture, origin);
  const fallbackId = staticShareCardId(place.prefecture);
  const id = deps.newId();

  let imageUrl = fallbackImage;
  let rendered = false;

  const drawn = await withDeadline(deps.renderImage({ label: areaText }), remaining());
  let image = fitsBudget(drawn) ? drawn : null;
  if (!image && drawn && drawn.body.byteLength > SHARE_CARD_MAX_IMAGE_BYTES && deps.compressImage) {
    const compressed = await withDeadline(deps.compressImage(drawn), remaining());
    if (fitsBudget(compressed)) image = compressed;
  }

  if (image) {
    const uploaded = await withDeadline(
      deps.uploadImage(id, image).catch(() => null),
      remaining(),
    );
    if (uploaded && uploaded.startsWith("https://")) {
      imageUrl = uploaded;
      rendered = true;
    }
  }

  const fallbackResult = (): FrozenShareCardResult => ({
    id: fallbackId,
    url: `${origin}/s/${fallbackId}`,
    areaLabel: areaText,
    imageUrl: fallbackImage,
    fallback: true,
  });

  try {
    await deps.insertCard({
      id,
      userId: input.userId,
      areaText,
      title,
      imageUrl,
    });
  } catch {
    return fallbackResult();
  }

  return {
    id,
    url: `${origin}/s/${id}`,
    areaLabel: areaText,
    imageUrl,
    fallback: !rendered,
  };
}
