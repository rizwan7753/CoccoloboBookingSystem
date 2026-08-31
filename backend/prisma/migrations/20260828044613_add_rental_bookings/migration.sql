-- CreateTable
CREATE TABLE `rental_items` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `images` JSON NULL,
    `priceAdult` DECIMAL(10, 2) NOT NULL,
    `priceChild` DECIMAL(10, 2) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'SOLD_OUT') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rental_items_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_spots` (
    `id` VARCHAR(191) NOT NULL,
    `rentalItemId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `rental_spots_rentalItemId_code_key`(`rentalItemId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `rentalItemId` VARCHAR(191) NOT NULL,
    `spotId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `guestName` VARCHAR(191) NOT NULL,
    `guestEmail` VARCHAR(191) NOT NULL,
    `guestPhone` VARCHAR(191) NULL,
    `roomNumber` VARCHAR(191) NULL,
    `adultCount` INTEGER NOT NULL DEFAULT 1,
    `childCount` INTEGER NOT NULL DEFAULT 0,
    `amountTotal` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paymentStatus` ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `stripePaymentIntentId` VARCHAR(191) NULL,
    `source` ENUM('DIRECT_WEBSITE', 'STAFF_ASSISTED', 'HOTEL_CONCIERGE', 'TRAVEL_AGENT', 'CRUISE') NOT NULL DEFAULT 'DIRECT_WEBSITE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rental_bookings_stripePaymentIntentId_key`(`stripePaymentIntentId`),
    INDEX `rental_bookings_rentalItemId_date_idx`(`rentalItemId`, `date`),
    UNIQUE INDEX `rental_bookings_spotId_date_key`(`spotId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rental_items` ADD CONSTRAINT `rental_items_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_spots` ADD CONSTRAINT `rental_spots_rentalItemId_fkey` FOREIGN KEY (`rentalItemId`) REFERENCES `rental_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_bookings` ADD CONSTRAINT `rental_bookings_rentalItemId_fkey` FOREIGN KEY (`rentalItemId`) REFERENCES `rental_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_bookings` ADD CONSTRAINT `rental_bookings_spotId_fkey` FOREIGN KEY (`spotId`) REFERENCES `rental_spots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
