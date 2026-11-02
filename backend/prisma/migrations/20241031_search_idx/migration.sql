-- Create full-text search GIN index on places (name, description, address)
CREATE INDEX IF NOT EXISTS "places_search_fts_idx" ON "places" USING GIN (
  to_tsvector('english', "name" || ' ' || COALESCE("description", '') || ' ' || "address")
);

