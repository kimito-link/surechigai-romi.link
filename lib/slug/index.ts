/**
 * Slug Utilities
 * 
 * 外部共有URL用のslug生成・パース機能をエクスポート
 */

export {
  slugify,
  createProfileSlug,
  createEventSlug,
  extractIdFromSlug,
  getCanonicalProfileUrl,
  getCanonicalEventUrl,
  isCanonicalUrl,
} from "./slugify";
