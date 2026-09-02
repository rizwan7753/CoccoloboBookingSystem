-- AlterTable
ALTER TABLE `locations` ADD COLUMN `stripePublishableKey` VARCHAR(191) NULL,
    ADD COLUMN `stripeSecretKey` VARCHAR(191) NULL,
    ADD COLUMN `stripeWebhookSecret` VARCHAR(191) NULL;
