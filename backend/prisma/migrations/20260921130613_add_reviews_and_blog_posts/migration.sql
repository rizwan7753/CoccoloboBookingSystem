-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `quote` TEXT NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorInitials` VARCHAR(191) NULL,
    `authorMeta` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_posts` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `body` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `readMinutes` INTEGER NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_posts_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Grant the new content.view/content.manage permissions (see lib/permissions.ts)
-- to the two built-in roles that already manage editorial content, so
-- existing admins don't lose access the moment this ships — new roles
-- created after this migration already pick up the updated PERMISSIONS
-- list in code; only already-seeded role_permissions rows need backfilling.
INSERT INTO `role_permissions` (`id`, `roleId`, `permission`) VALUES
    ('SUPER_ADMIN_content.view', 'SUPER_ADMIN', 'content.view'),
    ('SUPER_ADMIN_content.manage', 'SUPER_ADMIN', 'content.manage'),
    ('LOCATION_MANAGER_content.view', 'LOCATION_MANAGER', 'content.view'),
    ('LOCATION_MANAGER_content.manage', 'LOCATION_MANAGER', 'content.manage');
