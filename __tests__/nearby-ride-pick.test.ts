import { describe, expect, it } from "vitest";
import { pickNearbyRide } from "@/lib/nearby-ride/types";

describe("pickNearbyRide", () => {
  const nearby = {
    spots: [
      { kind: "port", service: "docomo", name: "A", walkMin: 1, available: 0 },
      { kind: "port", service: "hello", name: "B", walkMin: 2, available: 3 },
      { kind: "port", service: "docomo", name: "C", walkMin: 3, available: null },
      { kind: "port", service: "docomo", name: "D", walkMin: 4, available: 1 },
      { kind: "area", service: "luup", name: "東京エリア" },
    ],
    labels: { docomo: "ドコモ・バイクシェア", hello: "HELLO CYCLING", luup: "LUUP" },
    credits: ["ドコモ（CC BY 4.0）"],
  };
  const toilets = {
    toilets: [
      { kind: "borrow", name: "", walkMin: 5 },
      { kind: "public", name: "駅前公衆トイレ", walkMin: 2 },
    ],
    credits: ["© OpenStreetMap contributors"],
  };

  it("空き0台は後ろに回し、近い順に3件まで", () => {
    const r = pickNearbyRide(nearby, toilets);
    expect(r.rides.map((x) => x.name)).toEqual(["B", "C", "D"]);
    expect(r.rides[0].sub).toBe("HELLO CYCLING");
  });

  it("エリアだけのサービスは名前だけ返す", () => {
    expect(pickNearbyRide(nearby, toilets).areas).toEqual(["LUUP"]);
  });

  it("トイレは近い順。名前が無ければ種類で呼ぶ", () => {
    const r = pickNearbyRide(nearby, toilets);
    expect(r.toilets.map((x) => x.name)).toEqual(["駅前公衆トイレ", "借りられるトイレ"]);
  });

  it("出したデータの出典だけを付ける", () => {
    expect(pickNearbyRide(nearby, null).credits).toEqual(["ドコモ（CC BY 4.0）"]);
    expect(pickNearbyRide(null, null)).toEqual({ rides: [], toilets: [], areas: [], credits: [] });
  });
});
