-- AlterTable
ALTER TABLE `events` ADD COLUMN `cardImageUrl` VARCHAR(191) NULL,
    ADD COLUMN `headerImageUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `excursions` ADD COLUMN `cardImageUrl` VARCHAR(191) NULL,
    ADD COLUMN `headerImageUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `rental_items` ADD COLUMN `cardImageUrl` VARCHAR(191) NULL,
    ADD COLUMN `headerImageUrl` VARCHAR(191) NULL;
