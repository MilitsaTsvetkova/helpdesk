-- Drop the old UUID primary key and recreate as serial int.
-- fromName becomes NOT NULL (was nullable).

ALTER TABLE "ticket" DROP CONSTRAINT "ticket_pkey";
ALTER TABLE "ticket" DROP COLUMN "id";
ALTER TABLE "ticket" ADD COLUMN "id" SERIAL NOT NULL;
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_pkey" PRIMARY KEY ("id");

-- Make fromName NOT NULL (existing rows had NULL allowed; dev DB has no rows).
ALTER TABLE "ticket" ALTER COLUMN "fromName" SET NOT NULL;
