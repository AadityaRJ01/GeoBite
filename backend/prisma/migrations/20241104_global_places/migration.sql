-- AlterTable: add cityName, externalId, source, lastSyncedAt to places
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "cityName" TEXT;
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'seed';
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "places_externalId_key" ON "places"("externalId");
CREATE INDEX IF NOT EXISTS "places_cityName_idx" ON "places"("cityName");
CREATE INDEX IF NOT EXISTS "places_source_idx" ON "places"("source");

-- Backfill existing places as Bengaluru
UPDATE "places" SET "cityName" = 'Bengaluru' WHERE "cityName" IS NULL;

