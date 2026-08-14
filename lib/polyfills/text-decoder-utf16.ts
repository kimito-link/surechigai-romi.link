/**
 * Hermes に足りない TextDecoder の utf-16le / utf-16be を補う。
 *
 * ★なぜ必要か（2026-08-14・App Store build 495 / 499 連続却下の真因）:
 *   h3-js が読み込まれた瞬間に、モジュールのトップレベルで
 *     new TextDecoder("utf-16le")   ← node_modules/h3-js/dist/h3-js.js:368
 *   を実行する（Emscripten が吐く定型コード）。
 *   Hermes 内蔵の TextDecoder は **utf-8 しか受け付けない**ため、ここで
 *     RangeError: Unknown encoding: utf-16le
 *   を投げ、誰も catch しないまま libc++abi が abort() する。
 *
 *   h3-js はすれ違い判定の中核なので起動時に必ず読み込まれ、
 *   結果として**起動した瞬間に100%落ちる**。iPad 固有ではない
 *   （審査が iPad だっただけで、iPhone でも同じく落ちる。
 *     シミュレータ実機で iPhone 17 Pro / iPad Pro M4 の両方で再現確認済み）。
 *
 *   Web では標準の TextDecoder が utf-16le を持っているのでこの問題は出ない。
 *   ＝「Web版は動くのにアプリだけ起動しない」の説明もこれで付く。
 *
 * ★読み込み順序が重要:
 *   h3-js より先に走らせないと意味がない。app/_layout.tsx の
 *   **一番上**で import すること（他の import より前）。
 *
 * ★実装方針:
 *   既存の TextDecoder は壊さない。utf-8 はネイティブ実装に委ね、
 *   utf-16le / utf-16be を要求されたときだけ自前のデコーダを返す。
 *   これなら Hermes が将来 utf-16 に対応しても素直に上書きされない。
 */

type DecoderOptions = { fatal?: boolean; ignoreBOM?: boolean };

/** utf-16 のラベル（WHATWG Encoding 標準の別名を含む） */
const UTF16LE_LABELS = new Set([
  "utf-16le",
  "utf-16",
  "utf16le",
  "utf16",
  "ucs-2",
  "ucs2",
  "unicode",
  "unicodefeff",
  "csunicode",
  "iso-10646-ucs-2",
]);
const UTF16BE_LABELS = new Set(["utf-16be", "utf16be", "unicodefffe"]);

function normalizeLabel(label: unknown): string {
  return String(label ?? "utf-8")
    .trim()
    .toLowerCase();
}

/**
 * UTF-16 のバイト列を文字列へ。
 * サロゲートペアはそのまま String.fromCharCode で組み立てれば正しく復元される
 * （JS の文字列自体が UTF-16 のため、コードユニットを並べるだけでよい）。
 */
function decodeUtf16(bytes: Uint8Array, littleEndian: boolean, ignoreBOM: boolean): string {
  let offset = 0;
  // BOM の除去。ignoreBOM=true のときは「BOM を取り除かない」ではなく
  // 「BOM を特別扱いしない」の意味だが、実用上は先頭 BOM を落とす方が安全。
  if (bytes.length >= 2) {
    const first = littleEndian
      ? bytes[0]! | (bytes[1]! << 8)
      : (bytes[0]! << 8) | bytes[1]!;
    if (first === 0xfeff && !ignoreBOM) offset = 2;
  }

  // 長い入力でも fromCharCode の引数上限を超えないよう分割して連結する
  const CHUNK = 0x2000;
  let out = "";
  let units: number[] = [];
  for (let i = offset; i + 1 < bytes.length; i += 2) {
    units.push(littleEndian ? bytes[i]! | (bytes[i + 1]! << 8) : (bytes[i]! << 8) | bytes[i + 1]!);
    if (units.length >= CHUNK) {
      out += String.fromCharCode(...units);
      units = [];
    }
  }
  if (units.length > 0) out += String.fromCharCode(...units);
  return out;
}

function toUint8Array(input: unknown): Uint8Array {
  if (input == null) return new Uint8Array(0);
  if (input instanceof Uint8Array) return input;
  if (ArrayBuffer.isView(input)) {
    const view = input as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return new Uint8Array(0);
}

/** utf-16 を扱えない TextDecoder を、扱えるものに差し替える */
export function installUtf16TextDecoderPolyfill(): void {
  const g = globalThis as unknown as { TextDecoder?: unknown };
  const Native = g.TextDecoder as (new (label?: string, options?: DecoderOptions) => unknown) | undefined;

  // すでに utf-16le を扱えるなら何もしない（Web・将来の Hermes）
  if (typeof Native === "function") {
    try {
      new Native("utf-16le");
      return;
    } catch {
      // 落ちる＝差し替えが必要
    }
  }

  class PolyfilledTextDecoder {
    readonly encoding: string;
    readonly fatal: boolean;
    readonly ignoreBOM: boolean;
    /** utf-8 等はネイティブ実装に委譲する */
    private readonly inner: { decode(input?: unknown): string } | null = null;
    private readonly utf16: "le" | "be" | null = null;

    constructor(label?: string, options: DecoderOptions = {}) {
      const normalized = normalizeLabel(label);
      this.fatal = Boolean(options.fatal);
      this.ignoreBOM = Boolean(options.ignoreBOM);

      if (UTF16LE_LABELS.has(normalized)) {
        this.encoding = "utf-16le";
        this.utf16 = "le";
      } else if (UTF16BE_LABELS.has(normalized)) {
        this.encoding = "utf-16be";
        this.utf16 = "be";
      } else {
        this.encoding = normalized;
        if (typeof Native === "function") {
          this.inner = new Native(label, options) as { decode(input?: unknown): string };
        }
      }
    }

    decode(input?: unknown): string {
      if (this.utf16) {
        return decodeUtf16(toUint8Array(input), this.utf16 === "le", this.ignoreBOM);
      }
      if (this.inner) return this.inner.decode(input);
      // ネイティブが無い環境向けの最低限の utf-8 フォールバック
      const bytes = toUint8Array(input);
      let out = "";
      for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]!);
      return out;
    }
  }

  g.TextDecoder = PolyfilledTextDecoder;
}
