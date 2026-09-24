-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `orderId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `event_bookings` ADD COLUMN `orderId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `rental_bookings` ADD COLUMN `orderId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `guestName` VARCHAR(191) NOT NULL,
    `guestEmail` VARCHAR(191) NOT NULL,
    `guestPhone` VARCHAR(191) NULL,
    `roomNumber` VARCHAR(191) NULL,
    `amountTotal` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paymentStatus` ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `stripePaymentIntentId` VARCHAR(191) NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `bookingCode` VARCHAR(191) NULL,
    `source` ENUM('DIRECT_WEBSITE', 'STAFF_ASSISTED', 'HOTEL_CONCIERGE', 'TRAVEL_AGENT', 'CRUISE') NOT NULL DEFAULT 'DIRECT_WEBSITE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_stripePaymentIntentId_key`(`stripePaymentIntentId`),
    UNIQUE INDEX `orders_bookingCode_key`(`bookingCode`),
    INDEX `orders_locationId_idx`(`locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `bookings_orderId_idx` ON `bookings`(`orderId`);

-- CreateIndex
CREATE INDEX `event_bookings_orderId_idx` ON `event_bookings`(`orderId`);

-- CreateIndex
CREATE INDEX `rental_bookings_orderId_idx` ON `rental_bookings`(`orderId`);

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_bookings` ADD CONSTRAINT `rental_bookings_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_bookings` ADD CONSTRAINT `event_bookings_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

