-- CreateIndex (created before dropping the old unique index so the FK on
-- spotId always has a backing index — MySQL refuses to drop an index a
-- foreign key depends on otherwise)
CREATE INDEX `rental_bookings_spotId_date_idx` ON `rental_bookings`(`spotId`, `date`);

-- DropIndex
DROP INDEX `rental_bookings_spotId_date_key` ON `rental_bookings`;

-- AlterTable
ALTER TABLE `rental_bookings` ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `rental_spots` ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1;
