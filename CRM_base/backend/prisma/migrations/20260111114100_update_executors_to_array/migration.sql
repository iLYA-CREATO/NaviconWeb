-- AlterTable
ALTER TABLE "BidSpecification" ADD COLUMN "executorIds" INTEGER[];

-- Migrate data
UPDATE "BidSpecification"
SET "executorIds" = CASE
  WHEN "executorId" IS NOT NULL THEN ARRAY["executorId"] || "coExecutorIds"
  ELSE "coExecutorIds"
END;

-- DropForeignKey (if any, but since we removed the relation, no FK)
-- DropIndex (none)

-- AlterTable
ALTER TABLE "BidSpecification" DROP COLUMN "executorId",
DROP COLUMN "coExecutorIds";