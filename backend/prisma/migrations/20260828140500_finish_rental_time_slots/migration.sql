-- CreateIndex (created before dropping the old index so the FK on spotId
-- always has a backing index — MySQL refuses to drop one a foreign key
-- depends on otherwise)
CREATE INDEX `rental_bookings_spotId_date_timeSlotId_idx` ON `rental_bookings`(`spotId`, `date`, `timeSlotId`);

-- DropIndex
DROP INDEX `rental_bookings_spotId_date_idx` ON `rental_bookings`;

-- AddForeignKey
ALTER TABLE `rental_bookings` ADD CONSTRAINT `rental_bookings_timeSlotId_fkey` FOREIGN KEY (`timeSlotId`) REFERENCES `rental_time_slots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
