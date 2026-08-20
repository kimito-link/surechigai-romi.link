/**
 * ライブ配信の「直行先」を選ぶ判断を守る。
 *
 * 背景（2026-08-21 ユーザー指摘「もっとすぐに、ダイレクトにつながるようなのがいい」）:
 * 従来は YouTube の検索結果ページへ飛ばしていた。利用者が一覧から自分で選ぶ必要があり、
 * 終了した配信も混ざっていた。押した瞬間に映像へ繋ぐよう直行方式に変えた。
 *
 * ★直行させる以上、こちらが中身に責任を持つ:
 *   検索1位が必ずその場所とは限らない。絞らないと**まったく関係ない場所の映像**へ
 *   飛ばしてしまう。検索結果ページなら利用者が見て選べたが、直行ではそれができない。
 *   よって「地名が確認できないものは採用しない」を固定する。
 *
 * ★ここで守りたい失敗:
 *   1. 地名が入っていない配信を掴んで、無関係な場所へ直行させる
 *   2. 接尾辞（市・県）のせいで正しい配信まで弾いてしまい、機能が死ぬ
 *   3. videoId が空の項目を掴んで、開けないURLを作る
 */
import { describe, it, expect, vi } from "vitest";

// external-links.ts は react-native を読むので、ここでも最小スタブが要る
// （live-camera-links.test.ts と同じ。無いと rollup が RN のソースで転ぶ）
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  Linking: { canOpenURL: vi.fn(), openURL: vi.fn() },
}));

import {
  pickLiveStream,
  matchesPlace,
  placeCore,
  type LiveCandidate,
} from "@/lib/live-camera/live-stream-pick";

function candidate(over: Partial<LiveCandidate> = {}): LiveCandidate {
  return { videoId: "abc123", title: "", channelTitle: "", ...over };
}

describe("placeCore（照合に使う地名の核）", () => {
  it("市区町村・都道府県の接尾辞を落とす", () => {
    // 配信名は「諏訪湖(茅野)ライブ」のように接尾辞なしで書かれることが多い。
    // 「茅野市」で完全一致を求めるとほぼ全て弾かれてしまう。
    expect(placeCore("茅野市")).toBe("茅野");
    expect(placeCore("長野県")).toBe("長野");
    expect(placeCore("渋谷区")).toBe("渋谷");
    expect(placeCore("京都府")).toBe("京都");
    expect(placeCore("北海道")).toBe("北海");
  });

  it("削ると短くなりすぎる場合は削らない（誤一致を防ぐ）", () => {
    // 1文字の核はどこにでも一致してしまう
    expect(placeCore("市川市").length).toBeGreaterThanOrEqual(2);
    expect(placeCore("原村")).toBe("原村");
  });

  it("前後の空白は無視する", () => {
    expect(placeCore("  茅野市  ")).toBe("茅野");
  });
});

describe("matchesPlace（その場所の配信か）", () => {
  it("タイトルに地名が入っていれば採用", () => {
    expect(
      matchesPlace(candidate({ title: "【LIVE】諏訪湖 茅野ライブカメラ" }), "茅野市"),
    ).toBe(true);
  });

  it("チャンネル名に地名があっても採用（タイトルが短い配信を落とさない）", () => {
    expect(
      matchesPlace(
        candidate({ title: "【LIVE】", channelTitle: "茅野市観光協会" }),
        "茅野市",
      ),
    ).toBe(true);
  });

  it("地名がどこにも無ければ不採用（無関係な場所へ直行させない）", () => {
    // これが最も避けたい失敗。押した先が全然違う場所の映像になる。
    expect(
      matchesPlace(
        candidate({ title: "沖縄 美ら海水族館 ライブカメラ", channelTitle: "沖縄観光" }),
        "茅野市",
      ),
    ).toBe(false);
  });

  it("地名が空なら不採用", () => {
    expect(matchesPlace(candidate({ title: "何かのライブ" }), "")).toBe(false);
  });
});

describe("pickLiveStream（直行先を1本選ぶ）", () => {
  it("地名が一致する候補の watch URL を返す", () => {
    const picked = pickLiveStream(
      [candidate({ videoId: "xyz789", title: "諏訪湖 茅野 ライブカメラ" })],
      "茅野市",
    );

    expect(picked).not.toBeNull();
    expect(picked!.url).toBe("https://www.youtube.com/watch?v=xyz789");
  });

  it("1位が無関係でも、後ろに当たりがあれば拾う", () => {
    // maxResults=5 で取っているのはこのため。1位固定だと取りこぼす。
    const picked = pickLiveStream(
      [
        candidate({ videoId: "no1", title: "沖縄 美ら海 ライブ" }),
        candidate({ videoId: "no2", title: "東京 渋谷スクランブル交差点" }),
        candidate({ videoId: "hit", title: "茅野 車山高原ライブカメラ" }),
      ],
      "茅野市",
    );

    expect(picked?.videoId).toBe("hit");
  });

  it("どれも地名が一致しなければ null（検索ページへ落とす）", () => {
    // null は「配信が無い」ではなく「自信を持って出せるものが無い」の意味。
    // 呼び出し側は従来どおり検索リンクを出すので、体験は今より悪くならない。
    const picked = pickLiveStream(
      [
        candidate({ videoId: "no1", title: "沖縄 美ら海 ライブ" }),
        candidate({ videoId: "no2", title: "東京 渋谷スクランブル交差点" }),
      ],
      "茅野市",
    );

    expect(picked).toBeNull();
  });

  it("候補が空なら null", () => {
    expect(pickLiveStream([], "茅野市")).toBeNull();
  });

  it("videoId が空の項目は採用しない（開けないURLを作らない）", () => {
    const picked = pickLiveStream(
      [candidate({ videoId: "", title: "茅野 ライブカメラ" })],
      "茅野市",
    );

    expect(picked).toBeNull();
  });

  it("返す URL は外部リンク許可リストを通る（無言 false を作らない）", async () => {
    // openExternalUrl は許可外ドメインで無言 false を返し、押しても何も起きない。
    // 過去に実際に踏んだ穴なので、生成側で固定する。
    const { getAllowedDomains } = await import("@/lib/navigation/external-links");
    const allowed = getAllowedDomains();

    const picked = pickLiveStream(
      [candidate({ videoId: "xyz789", title: "茅野 ライブカメラ" })],
      "茅野市",
    );
    const host = new URL(picked!.url).hostname;

    const ok = allowed.some(
      (d) => host === d || host === `www.${d}` || host.endsWith(`.${d}`),
    );
    expect(ok, `${host} が許可リストに無い`).toBe(true);
  });
});
