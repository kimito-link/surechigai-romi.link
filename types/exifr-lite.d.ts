/**
 * exifr の lite ビルドを直接指すための型宣言。
 *
 * なぜ既定の "exifr" ではなく dist/lite.esm.js を使うのか（2026-08-14 実障害）:
 * full ビルドは Node 用フォールバックとして
 *   import(/* webpackIgnore: true *\/ e).then(t)
 * を含み、Hermes のバイトコード変換がこれを受け付けない
 *   （main.jsbundle: error: Invalid expression encountered）。
 * その結果、iOS の Release ビルドが "Bundle React Native code and images" で失敗する。
 * Web ビルドは通るので、ネイティブをビルドするまで気づけない。
 *
 * lite は動的 import も require も持たず、GPS と DateTimeOriginal を含むので
 * 「場所と撮影時刻だけ読む」この用途には十分（44KB）。
 */
declare module "exifr/dist/lite.esm.js" {
  /** 必要なタグだけを拾うためのオプション（このプロジェクトで使う範囲のみ） */
  export interface ExifrParseOptions {
    gps?: boolean;
    pick?: string[];
  }
  /** 解析結果。タグ名は動的なので緩い型にする（呼び出し側で検証する） */
  export function parse(
    input: File | Blob | ArrayBuffer | Uint8Array,
    options?: ExifrParseOptions,
  ): Promise<Record<string, unknown> | undefined>;
}
