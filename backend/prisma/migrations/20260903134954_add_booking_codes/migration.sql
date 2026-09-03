-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `bookingCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `event_bookings` ADD COLUMN `bookingCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `rental_bookings` ADD COLUMN `bookingCode` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `booking_sequences` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `dateKey` VARCHAR(191) NOT NULL,
    `counter` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `bookings_bookingCode_key` ON `bookings`(`bookingCode`);

-- CreateIndex
CREATE UNIQUE INDEX `event_bookings_bookingCode_key` ON `event_bookings`(`bookingCode`);

-- CreateIndex
CREATE UNIQUE INDEX `rental_bookings_bookingCode_key` ON `rental_bookings`(`bookingCode`);
