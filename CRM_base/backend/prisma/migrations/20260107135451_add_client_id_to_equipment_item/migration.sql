/*
  Warnings:

  - You are about to drop the column `warehouseId` on the `EquipmentItem` table. All the data in the column will be lost.
  - Added the required column `clientId` to the `EquipmentItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EquipmentItem" DROP CONSTRAINT "EquipmentItem_warehouseId_fkey";

-- AlterTable
ALTER TABLE "EquipmentItem" DROP COLUMN "warehouseId",
ADD COLUMN     "clientId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "EquipmentItem" ADD CONSTRAINT "EquipmentItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
