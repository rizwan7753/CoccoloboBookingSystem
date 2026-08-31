-- AlterTable
ALTER TABLE `locations` ADD COLUMN `smtpFromEmail` VARCHAR(191) NULL,
    ADD COLUMN `smtpFromName` VARCHAR(191) NULL,
    ADD COLUMN `smtpHost` VARCHAR(191) NULL,
    ADD COLUMN `smtpPassword` VARCHAR(191) NULL,
    ADD COLUMN `smtpPort` INTEGER NULL,
    ADD COLUMN `smtpSecure` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `smtpUsername` VARCHAR(191) NULL;
