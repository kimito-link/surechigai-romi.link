/**
 * TextDecoder のポリフィルを最初に適用する副作用モジュール。
 *
 * app/_layout.tsx の **一番上**で import すること。
 * h3-js はモジュールのトップレベルで new TextDecoder("utf-16le") を実行するため、
 * それより後に適用しても間に合わない（詳細は lib/polyfills/text-decoder-utf16.ts）。
 *
 * この1行が無いと、ネイティブ（Hermes）では起動した瞬間に
 * RangeError: Unknown encoding: utf-16le で abort する。
 */
import { installUtf16TextDecoderPolyfill } from "../polyfills/text-decoder-utf16.js";

installUtf16TextDecoderPolyfill();
