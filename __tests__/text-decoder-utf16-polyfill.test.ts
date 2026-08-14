/**
 * Hermes に足りない TextDecoder("utf-16le") を補うポリフィルを守る。
 *
 * これが守る事故（2026-08-14・App Store build 495 / 499 連続却下の真因）:
 * h3-js はモジュールのトップレベルで new TextDecoder("utf-16le") を実行する
 * （node_modules/h3-js/dist/h3-js.js:368）。Hermes の TextDecoder は utf-8 しか
 * 受け付けないため RangeError を投げ、誰も catch せず abort() する。
 * h3-js はすれ違い判定の中核で起動時に必ず読まれるので、**起動した瞬間に落ちる**。
 *
 * シミュレータ実機で再現・確認済み:
 *   libc++abi: terminating due to uncaught exception of type facebook::jsi::JSError:
 *   Unhandled JS Exception: RangeError: Unknown encoding: utf-16le
 */
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { installUtf16TextDecoderPolyfill } from "@/lib/polyfills/text-decoder-utf16";

const RealTextDecoder = globalThis.TextDecoder;

/** Hermes の TextDecoder を模す: utf-8 だけ通し、他は RangeError */
class HermesLikeTextDecoder {
  readonly encoding: string;
  constructor(label = "utf-8") {
    const normalized = String(label).toLowerCase();
    if (normalized !== "utf-8" && normalized !== "utf8") {
      throw new RangeError(`Unknown encoding: ${label} (normalized: ${normalized})`);
    }
    this.encoding = "utf-8";
  }
  decode(input?: BufferSource): string {
    return new RealTextDecoder("utf-8").decode(input as ArrayBufferView);
  }
}

/** UTF-16LE のバイト列を作る */
function utf16leBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length * 2);
  for (let i = 0; i < s.length; i += 1) {
    const code = s.charCodeAt(i);
    out[i * 2] = code & 0xff;
    out[i * 2 + 1] = code >> 8;
  }
  return out;
}

afterEach(() => {
  globalThis.TextDecoder = RealTextDecoder;
});

describe("Hermes 相当の環境（utf-16le を投げる）", () => {
  beforeEach(() => {
    globalThis.TextDecoder = HermesLikeTextDecoder as unknown as typeof TextDecoder;
  });

  it("【真因の再現】ポリフィル前は h3-js と同じ呼び方で落ちる", () => {
    // h3-js:368 と同じ形。ここが落ちるのが却下の原因だった。
    expect(() => new TextDecoder("utf-16le")).toThrow(RangeError);
  });

  it("ポリフィル後は utf-16le を作れる（＝起動時に落ちない）", () => {
    installUtf16TextDecoderPolyfill();
    expect(() => new TextDecoder("utf-16le")).not.toThrow();
  });

  it("utf-16le を正しくデコードできる（日本語を含む）", () => {
    installUtf16TextDecoderPolyfill();
    const text = "君斗りんく hello";
    const decoded = new TextDecoder("utf-16le").decode(utf16leBytes(text));
    expect(decoded).toBe(text);
  });

  it("サロゲートペア（絵文字）も壊さない", () => {
    installUtf16TextDecoderPolyfill();
    const text = "足あと🐾ピン📍";
    expect(new TextDecoder("utf-16le").decode(utf16leBytes(text))).toBe(text);
  });

  it("utf-8 は従来どおり動く（既存の利用を壊さない）", () => {
    installUtf16TextDecoderPolyfill();
    const bytes = new RealTextEncoderCompat().encode("すれ違ひ通信");
    expect(new TextDecoder("utf-8").decode(bytes)).toBe("すれ違ひ通信");
  });

  it("多重適用しても壊れない（複数回 import されうる）", () => {
    installUtf16TextDecoderPolyfill();
    installUtf16TextDecoderPolyfill();
    expect(new TextDecoder("utf-16le").decode(utf16leBytes("ok"))).toBe("ok");
  });

  it("長い入力でも取りこぼさない（分割処理の境界）", () => {
    installUtf16TextDecoderPolyfill();
    const text = "あ".repeat(20_000);
    expect(new TextDecoder("utf-16le").decode(utf16leBytes(text))).toBe(text);
  });
});

describe("すでに utf-16le を扱える環境（Web）", () => {
  it("ネイティブ実装を差し替えない", () => {
    globalThis.TextDecoder = RealTextDecoder;
    installUtf16TextDecoderPolyfill();
    // Web の TextDecoder は utf-16le を持つので、そのまま残るのが正しい
    expect(globalThis.TextDecoder).toBe(RealTextDecoder);
  });
});

/** TextEncoder はテスト環境の実装をそのまま使う */
class RealTextEncoderCompat {
  encode(s: string): Uint8Array {
    return new TextEncoder().encode(s);
  }
}
