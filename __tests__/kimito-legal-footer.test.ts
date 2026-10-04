// LP 共通フッター（kimito-legal-footer.js）の契約テスト。
// 部品は web-ios-android/templates/web/legal-footer/ の無改変コピー（kit の check-drift PAIRS で同期を見る）。
// ここでは「文言・順序・安全性」と「LP が実際に部品を読み込んでいるか」を見る。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");
const FOOTER_JS = join(ROOT, "public/lp/kimito-legal-footer.js");

type Api = {
  buildHtml: (o: Record<string, string | undefined>) => string;
  safeUrl: (u: unknown) => string;
};

function load(): Api {
  const sandbox: { window: Record<string, unknown> } = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(FOOTER_JS, "utf8"), sandbox, { filename: FOOTER_JS });
  return sandbox.window.KimitoLegalFooter as Api;
}

describe("kimito-legal-footer", () => {
  it("運営表記が全サービス共通の文言で出る", () => {
    const html = load().buildHtml({ serviceName: "君斗りんくのすれ違ひ通信", terms: "/terms/", privacy: "/privacy/" });
    expect(html).toContain(
      "君斗りんくのすれ違ひ通信は、<a href=\"https://kimito-link.com/\" rel=\"noopener\">kimito-link.com</a>（Kimito-Link Project）と同じ運営による公式サービスです。",
    );
  });

  it("リンクは 利用規約 → プライバシーポリシー の順で、渡した分だけ出る", () => {
    const f = load();
    const html = f.buildHtml({ serviceName: "x", terms: "/terms/", privacy: "/privacy/" });
    expect(html.indexOf("利用規約")).toBeGreaterThan(0);
    expect(html.indexOf("プライバシーポリシー")).toBeGreaterThan(html.indexOf("利用規約"));
    expect(f.buildHtml({ serviceName: "x" })).not.toContain("<ul>");
  });

  it("危険なURL（javascript: / data: / // / http:）は描画しない", () => {
    const f = load();
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.example/", "http://insecure.example/"]) {
      expect(f.safeUrl(bad)).toBe("");
    }
  });

  it("サービス名のHTMLは無害化される", () => {
    expect(load().buildHtml({ serviceName: "<img src=x onerror=alert(1)>" })).not.toContain("<img");
  });
});

describe("public/lp/index.html", () => {
  const html = readFileSync(join(ROOT, "public/lp/index.html"), "utf8");

  it("LP が部品を読み込み、実在する法務ページを渡している", () => {
    expect(html).toMatch(/<script src="kimito-legal-footer\.js"[^>]*data-terms="\/terms\/"[^>]*data-privacy="\/privacy\/"/);
    expect(html).toContain('data-service-name="君斗りんくのすれ違ひ通信"');
  });

  it("背後が写真のLPなので、フッターの色を奥付と同じ紙色にしている（既定のままだと暗い風景の上で読めない）", () => {
    expect(html).toMatch(/--klf-bg:\s*var\(--washi\)/);
    expect(html).toMatch(/--klf-fg:\s*var\(--sumi-soft\)/);
  });
});
