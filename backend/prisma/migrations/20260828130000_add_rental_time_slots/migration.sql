-- CreateTable
CREATE TABLE `rental_time_slots` (
    `id` VARCHAR(191) NOT NULL,
    `rentalItemId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `rental_time_slots_rentalItemId_label_key`(`rentalItemId`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `rental_bookings` ADD COLUMN `timeSlotId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `rental_time_slots` ADD CONSTRAINT `rental_time_slots_rentalItemId_fkey` FOREIGN KEY (`rentalItemId`) REFERENCES `rental_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
