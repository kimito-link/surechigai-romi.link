/**
 * 描いた共有カードを Vercel Blob に置く。
 * 認証は BLOB_READ_WRITE_TOKEN か、Vercel の OIDC＋BLOB_STORE_ID（いまの Dashboard で
 * ストアをプロジェクトにつなぐと入るのはこちら。トークンは入らない）。
 * どちらも無い、またはアップロードに失敗したら null。
 * 呼び出し側は都道府県の静的画像へ落とす。トークンが無いだけでシェアは止めない。
 */
import { Buffer } from "node:buffer";
import type { ShareCardImage } from "./create-share-card.js";
import { SHARE_CARD_MAX_IMAGE_BYTES } from "./create-share-card.js";

const UPLOAD_TIMEOUT_MS = 2000;

function extensionFor(contentType: ShareCardImage["contentType"]): string {
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/png") return "png";
  return "jpg";
}

export async function uploadShareCardImage(
  id: string,
  image: ShareCardImage,
): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
  if (!token && !process.env.BLOB_STORE_ID?.trim()) return null;
  if (!/^[A-Za-z0-9]{8,16}$/.test(id)) return null;
  if (image.body.byteLength === 0 || image.body.byteLength > SHARE_CARD_MAX_IMAGE_BYTES) return null;

  try {
    const { put } = await import("@vercel/blob");
    const blob = await put(`share-cards/${id}.${extensionFor(image.contentType)}`, Buffer.from(image.body), {
      access: "public",
      token,
      contentType: image.contentType,
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000,
      abortSignal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });
    if (!blob.url.startsWith("https://")) return null;
    return blob.url;
  } catch {
    return null;
  }
}
