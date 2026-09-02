-- AlterTable
ALTER TABLE `locations` ADD COLUMN `nmiEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nmiSecurityKey` VARCHAR(191) NULL,
    ADD COLUMN `nmiTokenizationKey` VARCHAR(191) NULL;
