ALTER TABLE "Product"
ALTER COLUMN "brand" SET DEFAULT 'HyraLuxe';

UPDATE "Product"
SET "brand" = 'HyraLuxe'
WHERE LOWER(REPLACE("brand", ' ', '')) IN ('hyrafashion', 'hyrafashions', 'hyraluxe');
