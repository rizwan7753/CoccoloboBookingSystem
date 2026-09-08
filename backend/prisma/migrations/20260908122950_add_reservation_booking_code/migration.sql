-- AlterTable
ALTER TABLE `restaurant_reservations` ADD COLUMN `bookingCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `restaurant_reservations_bookingCode_key` ON `restaurant_reservations`(`bookingCode`);
