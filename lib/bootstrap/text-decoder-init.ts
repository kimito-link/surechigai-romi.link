/**
 * TextDecoder のポリフィルを最初に適用する副作用モジュール。
 *
 * ★読み込むのは index.js（アプリの入口）。expo-router より前に走らせること。
 *   h3-js はモジュールのトップレベルで new TextDecoder("utf-16le") を実行するため、
 *   それより後に適用しても間に合わない（詳細は lib/polyfills/text-decoder-utf16.ts）。
 *   app/_layout.tsx の先頭では**間に合わない**。expo-router は起動時に
 *   getRoutes() で app/ 配下を全部 require するので、_layout.tsx より先に
 *   別のルートが h3-js を引き込みうる（実測: iPad は起動したが iPhone は落ちた）。
 *
 * この1行が無いと、ネイティブ（Hermes）では起動した瞬間に
 * RangeError: Unknown encoding: utf-16le で abort する。
 */
import { installUtf16TextDecoderPolyfill } from "../polyfills/text-decoder-utf16.js";

installUtf16TextDecoderPolyfill();
