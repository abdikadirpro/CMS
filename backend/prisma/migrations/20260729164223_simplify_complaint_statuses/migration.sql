-- Simplify ComplaintStatus: remove UNDER_REVIEW, ASSIGNED, CLOSED.
-- Postgres can't drop enum values in place, so existing rows using the removed values must be
-- remapped to a surviving value *before* the column is retyped, or the retype fails outright.
--   ASSIGNED, UNDER_REVIEW  -> IN_PROGRESS  (still being actively worked)
--   CLOSED                  -> SOLVED       (a closed complaint was finalized/resolved)
BEGIN;

UPDATE "complaints" SET "status" = 'IN_PROGRESS' WHERE "status" IN ('ASSIGNED', 'UNDER_REVIEW');
UPDATE "complaints" SET "status" = 'SOLVED' WHERE "status" = 'CLOSED';

UPDATE "complaint_status_history" SET "toStatus" = 'IN_PROGRESS' WHERE "toStatus" IN ('ASSIGNED', 'UNDER_REVIEW');
UPDATE "complaint_status_history" SET "toStatus" = 'SOLVED' WHERE "toStatus" = 'CLOSED';
UPDATE "complaint_status_history" SET "fromStatus" = 'IN_PROGRESS' WHERE "fromStatus" IN ('ASSIGNED', 'UNDER_REVIEW');
UPDATE "complaint_status_history" SET "fromStatus" = 'SOLVED' WHERE "fromStatus" = 'CLOSED';

CREATE TYPE "ComplaintStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'WAITING', 'SOLVED', 'TRANSFERRED', 'REJECTED', 'ESCALATED');

ALTER TABLE "complaints" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "complaints" ALTER COLUMN "status" TYPE "ComplaintStatus_new" USING ("status"::text::"ComplaintStatus_new");
ALTER TABLE "complaints" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "complaint_status_history" ALTER COLUMN "toStatus" TYPE "ComplaintStatus_new" USING ("toStatus"::text::"ComplaintStatus_new");
ALTER TABLE "complaint_status_history" ALTER COLUMN "fromStatus" TYPE "ComplaintStatus_new" USING ("fromStatus"::text::"ComplaintStatus_new");

ALTER TYPE "ComplaintStatus" RENAME TO "ComplaintStatus_old";
ALTER TYPE "ComplaintStatus_new" RENAME TO "ComplaintStatus";
DROP TYPE "ComplaintStatus_old";

COMMIT;
