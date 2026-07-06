CREATE TABLE IF NOT EXISTS "db_stats_snapshots" (
  "id" serial PRIMARY KEY,
  "capturedAt" timestamp DEFAULT now() NOT NULL,
  "locationsBytes" bigint NOT NULL,
  "locationsRows" bigint NOT NULL,
  "totalDbBytes" bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS "db_stats_snapshots_capturedAt_idx"
  ON "db_stats_snapshots" ("capturedAt");

CREATE TABLE IF NOT EXISTS "sponsor_cards" (
  "id" serial PRIMARY KEY,
  "title" varchar(120) NOT NULL,
  "body" text NOT NULL,
  "imageUrl" text NOT NULL,
  "linkUrl" text NOT NULL,
  "prefecture" varchar(32),
  "municipality" text,
  "weight" integer DEFAULT 1 NOT NULL,
  "startsAt" timestamp DEFAULT now() NOT NULL,
  "endsAt" timestamp,
  "active" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "sponsor_cards_active_idx"
  ON "sponsor_cards" ("active");
CREATE INDEX IF NOT EXISTS "sponsor_cards_prefecture_idx"
  ON "sponsor_cards" ("prefecture");
CREATE INDEX IF NOT EXISTS "sponsor_cards_schedule_idx"
  ON "sponsor_cards" ("startsAt", "endsAt");

CREATE TABLE IF NOT EXISTS "sponsor_config" (
  "id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "slotFlags" json DEFAULT '{"checkin_complete": true, "zukan_feed": false, "mypage_stats": false}'::json NOT NULL,
  "dailyCap" integer DEFAULT 3 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ad_stats_daily" (
  "id" serial PRIMARY KEY,
  "cardId" integer NOT NULL,
  "date" date NOT NULL,
  "impressions" integer DEFAULT 0 NOT NULL,
  "clicks" integer DEFAULT 0 NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ad_stats_daily_card_date_uidx"
  ON "ad_stats_daily" ("cardId", "date");
CREATE INDEX IF NOT EXISTS "ad_stats_daily_date_idx"
  ON "ad_stats_daily" ("date");

CREATE TABLE IF NOT EXISTS "ad_user_daily_caps" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "date" date NOT NULL,
  "impressions" integer DEFAULT 0 NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ad_user_daily_caps_user_date_uidx"
  ON "ad_user_daily_caps" ("userId", "date");
CREATE INDEX IF NOT EXISTS "ad_user_daily_caps_date_idx"
  ON "ad_user_daily_caps" ("date");

INSERT INTO "sponsor_config" ("id", "enabled", "slotFlags", "dailyCap")
VALUES (1, true, '{"checkin_complete": true, "zukan_feed": false, "mypage_stats": false}'::json, 3)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "sponsor_cards" (
  "title",
  "body",
  "imageUrl",
  "linkUrl",
  "prefecture",
  "municipality",
  "weight",
  "startsAt",
  "endsAt",
  "active"
)
SELECT
  '足あとをXで届けよう',
  '会いたい君がいる現在地を、地図サムネ付きでXへ。正確な足あとをあとでたどれる形で残せます。',
  'https://surechigai.kimito.link/pwa-icon-512.png',
  'https://surechigai.kimito.link/mypage',
  NULL,
  NULL,
  1,
  now(),
  NULL,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM "sponsor_cards" WHERE "title" = '足あとをXで届けよう'
);
