-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS', 'OTHER');

-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "category" "TicketCategory";

-- Backfill: categorise existing tickets by subject keywords
UPDATE "ticket" SET "category" = 'NETWORK'  WHERE LOWER("subject") LIKE '%vpn%'      OR LOWER("subject") LIKE '%network%'  OR LOWER("subject") LIKE '%connection%' OR LOWER("subject") LIKE '%internet%' OR LOWER("subject") LIKE '%wifi%';
UPDATE "ticket" SET "category" = 'ACCESS'   WHERE "category" IS NULL AND (LOWER("subject") LIKE '%log in%' OR LOWER("subject") LIKE '%login%' OR LOWER("subject") LIKE '%access%' OR LOWER("subject") LIKE '%password%' OR LOWER("subject") LIKE '%permission%');
UPDATE "ticket" SET "category" = 'SOFTWARE' WHERE "category" IS NULL AND (LOWER("subject") LIKE '%software%' OR LOWER("subject") LIKE '%install%' OR LOWER("subject") LIKE '%application%' OR LOWER("subject") LIKE '%adobe%' OR LOWER("subject") LIKE '%update%');
UPDATE "ticket" SET "category" = 'HARDWARE' WHERE "category" IS NULL AND (LOWER("subject") LIKE '%keyboard%' OR LOWER("subject") LIKE '%monitor%' OR LOWER("subject") LIKE '%printer%' OR LOWER("subject") LIKE '%screen%' OR LOWER("subject") LIKE '%hardware%' OR LOWER("subject") LIKE '%mouse%' OR LOWER("subject") LIKE '%cable%' OR LOWER("subject") LIKE '%headset%');
UPDATE "ticket" SET "category" = 'OTHER'    WHERE "category" IS NULL;
