-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `paymentMethod` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `event_bookings` ADD COLUMN `paymentMethod` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `locations` ADD COLUMN `offlinePaymentEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `offlinePaymentInstructions` TEXT NULL,
    ADD COLUMN `stripeEnabled` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `rental_bookings` ADD COLUMN `paymentMethod` VARCHAR(191) NULL;
