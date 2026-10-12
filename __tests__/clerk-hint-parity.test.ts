/**
 * ログイン中ヒントの「ゲストでも Clerk が書くキー」を数えない件の、挙動テスト。
 *
 * 背景（2026-10-12 実機 moto g64y）:
 * ゲスト（__client_uat = 0）の端末にも localStorage の `__clerk_environment`（Clerk の環境設定のキャッシュ）が
 * 入っていて、「`clerk` を含むキーが1つでもあればログイン中」の判定がそれに反応していた。
 * 一度でも Clerk を読み込んだ端末が永久にログイン中扱いになり（Clerk を読む→キーが書かれる→次も真）、
 * ゲストなのに毎回 Clerk の chunk（約762KB）と clerk-js を読み、ベールも長引いた。
 *
 * 判定は2か所に独立して存在する（TypeScript の hasClerkSessionHint／+html.tsx のインラインスクリプト）。
 * 片方だけ直すと食い違う（2026-09-29 に実損あり）ので、**同じ入力で同じ答え**を返すことを、
 * インラインスクリプトを実際に実行して確かめる。
 *
 * ★安全側の約束: 未知の clerk キーは従来どおり「ヒントあり」（ログイン済みなのにゲスト画面を見せない側に倒す）。
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BOOT } from "../theme/tokens/boot";
import {
  hasClerkSessionHint,
  NON_SESSION_CLERK_STORAGE_KEYS,
  isClerkSessionStorageKey,
} from "../lib/clerk-public-routes";
import { hasClerkSessionInStorage } from "../lib/has-clerk-session";

const ROOT = resolve(__dirname, "..");
const HTML_SRC = readFileSync(resolve(ROOT, "app/+html.tsx"), "utf8");

type Scenario = { name: string; keys: string[]; cookie: string; user?: boolean; expected: boolean };

const SCENARIOS: Scenario[] = [
  { name: "ゲスト: __clerk_environment だけ（実機で確認した状態）", keys: ["__clerk_environment"], cookie: "__client_uat=0; __client_uat_ZGVu8CMk=0", expected: false },
  { name: "ゲスト: キーも cookie も無い", keys: [], cookie: "", expected: false },
  { name: "ゲスト: __client_uat が 0 の2件だけ", keys: [], cookie: "__client_uat_x=0; __client_uat=0", expected: false },
  { name: "ログイン済み: __client_uat が 0 以外", keys: ["__clerk_environment"], cookie: "__client_uat=1700000000", expected: true },
  { name: "ログイン済み: 接尾辞付きの 0 が先でも、接尾辞無しが 0 以外", keys: [], cookie: "__client_uat_x=0; __client_uat=1700000000", expected: true },
  { name: "ログイン済み: __session cookie", keys: ["__clerk_environment"], cookie: "__session=abc", expected: true },
  { name: "開発用インスタンスのセッション __clerk_db_jwt（環境キャッシュと併存でも真）", keys: ["__clerk_environment", "__clerk_db_jwt"], cookie: "", expected: true },
  { name: "★未知の clerk キーは安全側（ヒントあり）に倒す", keys: ["__clerk_something_new"], cookie: "", expected: true },
  { name: "旧方式の USER_INFO_KEY", keys: [], cookie: "", user: true, expected: true },
];

/** +html.tsx のインラインスクリプトを、テンプレートリテラルとして評価して取り出す。 */
function inlineScriptSource(): string {
  const start = HTML_SRC.indexOf("__html: `(function(){try{var h=false;");
  expect(start, "判定スクリプトが見つからない").toBeGreaterThan(-1);
  const from = start + "__html: `".length;
  const end = HTML_SRC.indexOf("})();`,", from);
  const literal = HTML_SRC.slice(from, end + "})();".length);
  // TS のテンプレートリテラルとして評価（\\s → \s の解釈、${…} の展開を、ビルドと同じに行う）
  return new Function("NON_SESSION_CLERK_STORAGE_KEYS", "BOOT", `return \`${literal}\`;`)(NON_SESSION_CLERK_STORAGE_KEYS, BOOT) as string;
}

/** インラインスクリプトを偽の window/document で実行し、ベールを掛けたか（= ヒントが真か）を返す。 */
function runInline(s: Scenario): boolean {
  let veil = false;
  const storage = {
    length: s.keys.length,
    key: (i: number) => s.keys[i] ?? null,
    getItem: (k: string) => (s.user && k === "manus-runtime-user-info" ? "{}" : null),
  };
  const win = {
    localStorage: storage,
    navigator: {},
    matchMedia: () => ({ matches: false }),
    setTimeout: () => 0,
  };
  const doc = {
    cookie: s.cookie,
    head: { appendChild: () => undefined },
    createElement: () => ({ setAttribute: () => undefined }),
    documentElement: {
      setAttribute: (k: string) => {
        if (k === "data-auth-boot") veil = true;
      },
      removeAttribute: () => undefined,
    },
  };
  new Function("window", "document", inlineScriptSource())(win, doc);
  return veil;
}

function runClient(s: Scenario): boolean {
  vi.stubGlobal("window", {
    localStorage: {
      length: s.keys.length,
      key: (i: number) => s.keys[i] ?? null,
      getItem: (k: string) => (s.user && k === "manus-runtime-user-info" ? "{}" : null),
    },
  });
  vi.stubGlobal("document", { cookie: s.cookie });
  return hasClerkSessionHint();
}

afterEach(() => vi.unstubAllGlobals());

describe("ログイン中ヒント: ゲストでも Clerk が書くキーを数えない", () => {
  it("除外リストに __clerk_environment が入っている", () => {
    expect(NON_SESSION_CLERK_STORAGE_KEYS).toContain("__clerk_environment");
    expect(isClerkSessionStorageKey("__clerk_environment")).toBe(false);
    expect(isClerkSessionStorageKey("__clerk_db_jwt")).toBe(true);
    expect(isClerkSessionStorageKey("__clerk_something_new")).toBe(true); // 未知は安全側
    expect(isClerkSessionStorageKey(null)).toBe(false);
  });

  describe.each(SCENARIOS)("$name", (s) => {
    it(`TypeScript の hasClerkSessionHint() が ${s.expected}`, () => {
      expect(runClient(s)).toBe(s.expected);
    });

    it(`+html.tsx のインラインスクリプト（実際に実行）が ${s.expected}（クライアント側と同じ答え）`, () => {
      expect(runInline(s)).toBe(s.expected);
    });
  });

  it("公開 /u/* 用の hasClerkSessionInStorage() も、__clerk_environment だけでは真にならない", () => {
    vi.stubGlobal("window", { localStorage: { __clerk_environment: "{}" } });
    expect(hasClerkSessionInStorage()).toBe(false);
    vi.stubGlobal("window", { localStorage: { __clerk_environment: "{}", __clerk_db_jwt: "x" } });
    expect(hasClerkSessionInStorage()).toBe(true);
  });

  it("PWA(standalone) 起動ではヒントが無くてもベールを掛ける（既存の挙動を壊していない）", () => {
    let veil = false;
    const doc = {
      cookie: "",
      head: { appendChild: () => undefined },
      createElement: () => ({ setAttribute: () => undefined }),
      documentElement: { setAttribute: (k: string) => { if (k === "data-auth-boot") veil = true; }, removeAttribute: () => undefined },
    };
    const win = {
      localStorage: { length: 1, key: () => "__clerk_environment", getItem: () => null },
      navigator: {},
      matchMedia: (q: string) => ({ matches: String(q).includes("display-mode: standalone") }),
      setTimeout: () => 0,
    };
    new Function("window", "document", inlineScriptSource())(win, doc);
    expect(veil).toBe(true);
  });
});
