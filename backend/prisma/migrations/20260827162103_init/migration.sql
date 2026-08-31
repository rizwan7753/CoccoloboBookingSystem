-- CreateTable
CREATE TABLE `locations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/St_Thomas',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `excursions` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `included` TEXT NULL,
    `excluded` TEXT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `meetingPoint` TEXT NULL,
    `mapUrl` VARCHAR(191) NULL,
    `whatToBring` TEXT NULL,
    `images` JSON NULL,
    `priceAdult` DECIMAL(10, 2) NOT NULL,
    `priceChild` DECIMAL(10, 2) NULL,
    `capacityDefault` INTEGER NOT NULL,
    `cutoffHoursBefore` INTEGER NOT NULL DEFAULT 0,
    `cutoffTime` VARCHAR(191) NOT NULL DEFAULT '21:00',
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'SOLD_OUT') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `excursions_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departure_times` (
    `id` VARCHAR(191) NOT NULL,
    `excursionId` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `daysOfWeek` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departure_slots` (
    `id` VARCHAR(191) NOT NULL,
    `excursionId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `bookedCount` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('OPEN', 'CLOSED', 'SOLD_OUT') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `departure_slots_excursionId_date_time_key`(`excursionId`, `date`, `time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `excursionId` VARCHAR(191) NOT NULL,
    `slotId` VARCHAR(191) NOT NULL,
    `guestName` VARCHAR(191) NOT NULL,
    `guestEmail` VARCHAR(191) NOT NULL,
    `guestPhone` VARCHAR(191) NULL,
    `roomNumber` VARCHAR(191) NULL,
    `specialRequests` TEXT NULL,
    `adultCount` INTEGER NOT NULL DEFAULT 0,
    `childCount` INTEGER NOT NULL DEFAULT 0,
    `totalGuests` INTEGER NOT NULL,
    `amountTotal` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paymentStatus` ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `stripePaymentIntentId` VARCHAR(191) NULL,
    `source` ENUM('DIRECT_WEBSITE', 'STAFF_ASSISTED', 'HOTEL_CONCIERGE', 'TRAVEL_AGENT', 'CRUISE') NOT NULL DEFAULT 'DIRECT_WEBSITE',
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookings_stripePaymentIntentId_key`(`stripePaymentIntentId`),
    INDEX `bookings_excursionId_idx`(`excursionId`),
    INDEX `bookings_slotId_idx`(`slotId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'LOCATION_MANAGER', 'BOOKING_STAFF') NOT NULL DEFAULT 'BOOKING_STAFF',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `excursions` ADD CONSTRAINT `excursions_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departure_times` ADD CONSTRAINT `departure_times_excursionId_fkey` FOREIGN KEY (`excursionId`) REFERENCES `excursions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departure_slots` ADD CONSTRAINT `departure_slots_excursionId_fkey` FOREIGN KEY (`excursionId`) REFERENCES `excursions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_excursionId_fkey` FOREIGN KEY (`excursionId`) REFERENCES `excursions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_slotId_fkey` FOREIGN KEY (`slotId`) REFERENCES `departure_slots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_users` ADD CONSTRAINT `admin_users_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
