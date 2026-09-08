-- AlterTable
ALTER TABLE `restaurant_menus` DROP COLUMN `content`;

-- CreateTable
CREATE TABLE `restaurant_menu_sections` (
    `id` VARCHAR(191) NOT NULL,
    `menuId` VARCHAR(191) NOT NULL,
    `heading` VARCHAR(191) NOT NULL,
    `subheading` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `restaurant_menu_sections_menuId_idx`(`menuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurant_menu_items` (
    `id` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `restaurant_menu_items_sectionId_idx`(`sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `restaurant_menu_sections` ADD CONSTRAINT `restaurant_menu_sections_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `restaurant_menus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_menu_items` ADD CONSTRAINT `restaurant_menu_items_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `restaurant_menu_sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
