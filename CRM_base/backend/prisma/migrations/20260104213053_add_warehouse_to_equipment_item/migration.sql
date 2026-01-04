-- AlterTable
ALTER TABLE "EquipmentItem" ADD COLUMN     "warehouseId" INTEGER;

-- AddForeignKey
ALTER TABLE "EquipmentItem" ADD CONSTRAINT "EquipmentItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
