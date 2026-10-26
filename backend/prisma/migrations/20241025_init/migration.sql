-- GeoBite — Initial Migration
-- Creates the places table with PostGIS geography support.
--
-- NOTE: This file is managed by Prisma Migrate. Do NOT edit manually
-- unless you understand the implications.
--
-- PostGIS note:
--   The `location` column is of type `geography(Point, 4326)`, which is a
--   PostGIS-specific type. Prisma marks it as `Unsupported(...)` and will
--   NOT read or write it through the ORM. It is populated via a raw SQL
--   trigger or manual UPDATE after inserts, and queried through $queryRaw.
--   A GiST index is created on this column for efficient spatial lookups.

-- Enable PostGIS extension (requires superuser, safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum for place categories
CREATE TYPE "PlaceCategory" AS ENUM ('restaurant', 'cafe', 'viewpoint', 'attraction');

-- Create places table
CREATE TABLE "places" (
    "id"                    TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name"                  TEXT NOT NULL,
    "description"           TEXT,
    "category"              "PlaceCategory" NOT NULL,
    "latitude"              DOUBLE PRECISION NOT NULL,
    "longitude"             DOUBLE PRECISION NOT NULL,
    "address"               TEXT NOT NULL,
    "averageRating"         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "priceLevel"            TEXT NOT NULL DEFAULT 'moderate',
    "estimatedVisitMinutes" INTEGER NOT NULL DEFAULT 30,
    "isActive"              BOOLEAN NOT NULL DEFAULT true,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- PostGIS geography column (Point, WGS 84 / EPSG:4326)
    -- Prisma does not manage this column; it is included here so the
    -- migration creates it alongside the rest of the table.
    "location"              geography(Point, 4326),

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- Regular indexes (Prisma-managed)
CREATE INDEX "places_category_idx"   ON "places"("category");
CREATE INDEX "places_isActive_idx"   ON "places"("isActive");
CREATE INDEX "places_lat_lng_idx"    ON "places"("latitude", "longitude");

-- Unique constraint used by the seed upsert
CREATE UNIQUE INDEX "places_name_address_key" ON "places"("name", "address");

-- GiST spatial index for PostGIS geography queries (ST_DWithin, ST_Distance, etc.)
CREATE INDEX "places_location_gist_idx" ON "places" USING GIST ("location");

-- Trigger function: keep `updatedAt` current on every row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "places_set_updated_at"
BEFORE UPDATE ON "places"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger function: auto-populate `location` from latitude/longitude on insert or update
CREATE OR REPLACE FUNCTION sync_place_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW."location" = ST_SetSRID(ST_MakePoint(NEW."longitude", NEW."latitude"), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "places_sync_location"
BEFORE INSERT OR UPDATE OF "latitude", "longitude" ON "places"
FOR EACH ROW EXECUTE FUNCTION sync_place_location();
