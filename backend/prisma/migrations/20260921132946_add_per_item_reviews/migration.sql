-- AlterTable
ALTER TABLE `reviews` ADD COLUMN `guestEmail` VARCHAR(191) NULL,
    ADD COLUMN `itemId` VARCHAR(191) NULL,
    ADD COLUMN `itemTitle` VARCHAR(191) NULL,
    ADD COLUMN `itemType` ENUM('EXCURSION', 'RENTAL', 'EVENT') NULL,
    MODIFY `title` VARCHAR(191) NULL,
    MODIFY `status` ENUM('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED') NOT NULL DEFAULT 'PUBLISHED';

-- CreateIndex
CREATE INDEX `reviews_itemType_itemId_status_idx` ON `reviews`(`itemType`, `itemId`, `status`);
