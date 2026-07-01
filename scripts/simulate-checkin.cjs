/**
 * Simulate encounter.checkIn DB steps locally (no auth).
 * Usage: node scripts/simulate-checkin.cjs [userId]
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

async function main() {
  const userId = Number(process.argv[2] || 0);
  const { getDb } = await import("../server/db/connection.js");
  const { toGrid, toH3Cell, toH3R7, assertFiniteLatLng } = await import(
    "../modules/encounter/core/geo.js"
  );
  const { reverseGeocode } = await import("../modules/encounter/core/geocoding.js");
  const { findMatches } = await import("../modules/encounter/core/matching.js");
  const q = await import("../modules/encounter/db/queries.js");

  const db = await getDb();
  if (!db) throw new Error("No DB");

  let uid = userId;
  if (!uid) {
    const { Client } = require("pg");
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const { rows } = await client.query(
      `SELECT id, name FROM users ORDER BY id LIMIT 5`,
    );
    console.log("Users:", rows);
    uid = rows[0]?.id;
    await client.end();
    if (!uid) throw new Error("No users");
  }

  const lat = Number(process.argv[3] || 36.0594389);
  const lng = Number(process.argv[4] || 138.0487431);
  console.log("Simulating checkIn for user", uid, "at", lat, lng);

  const latLng = assertFiniteLatLng(lat, lng);
  const { latGrid, lngGrid } = toGrid(latLng.lat, latLng.lng);
  const h3R8 = toH3Cell(latGrid, lngGrid, 8);
  const h3R7 = toH3R7(latGrid, lngGrid);

  console.log("Step: reverseGeocode...");
  const g = await reverseGeocode(latGrid, lngGrid);
  console.log("  geocode:", g);

  console.log("Step: insertLocation...");
  await q.insertLocation(db, {
    userId: uid,
    h3R8,
    latGrid,
    lngGrid,
    lat: latLng.lat,
    lng: latLng.lng,
    accuracyM: 50,
    municipality: g.municipality,
    prefecture: g.prefecture,
    address: g.address,
  });
  console.log("  OK");

  console.log("Step: upsertVisitedArea...");
  await q.upsertVisitedArea(db, {
    userId: uid,
    h3R7,
    municipality: g.municipality,
    prefecture: g.prefecture,
  });
  console.log("  OK");

  console.log("Step: matching candidates...");
  const [nearby, timeshift] = await Promise.all([
    q.getNearbyCandidates(db, uid, h3R8),
    q.getTimeshiftCandidates(db, uid, h3R7),
  ]);
  console.log("  nearby:", nearby.length, "timeshift:", timeshift.length);

  console.log("Step: blockSet + todayPairSet...");
  const [blockSet, todayPairSet] = await Promise.all([
    q.getBlockSet(db, uid),
    q.getTodayPairSet(db, uid),
  ]);
  console.log("  blocks:", blockSet.size, "todayPairs:", todayPairSet.size);

  console.log("Step: findMatches...");
  const matches = findMatches({
    self: { userId: uid, latGrid, lngGrid, h3R8, recordedAt: new Date() },
    nearbyCandidates: nearby,
    timeshiftCandidates: timeshift,
    blockSet,
    todayPairSet,
  });
  console.log("  matches:", matches.length);

  for (const m of matches.slice(0, 3)) {
    console.log("Step: insertEncounterIfNew...", m.userAId, m.userBId);
    await q.insertEncounterIfNew(db, {
      userAId: m.userAId,
      userBId: m.userBId,
      tier: m.tier,
      h3R7: m.h3R7,
      areaName: g.areaName,
      prefecture: g.prefecture,
      occurredAt: m.occurredAt,
    });
  }

  console.log("ALL STEPS OK");
  process.exit(0);
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
