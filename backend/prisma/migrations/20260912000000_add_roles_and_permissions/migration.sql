-- Replaces the fixed AdminRole enum with admin-managed Role/RolePermission
-- tables. Ordered so every FK target exists before it's referenced:
--   1) create roles + role_permissions tables
--   2) seed the 5 built-in roles (same ids the old enum used) and their
--      permissions, matching what was previously hardcoded per-route
--      (VIEW_ROLES/EDIT_ROLES/CANCEL_ROLES/MANAGE_ROLES constants)
--   3) only then repoint admin_users.role at roles.id — existing values
--      already match a seeded id, so no data remapping is needed.

CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permission` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `role_permissions_roleId_permission_key`(`roleId`, `permission`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `roles` (`id`, `name`, `isSystem`) VALUES
    ('SUPER_ADMIN', 'Super Admin', true),
    ('LOCATION_MANAGER', 'Location Manager', true),
    ('BOOKING_STAFF', 'Booking Staff', true),
    ('FINANCE', 'Finance', true),
    ('TRAVEL_AGENT', 'Travel Agent', true);

INSERT INTO `role_permissions` (`id`, `roleId`, `permission`) VALUES
    ('SUPER_ADMIN_dashboard.view', 'SUPER_ADMIN', 'dashboard.view'),
    ('SUPER_ADMIN_excursions.view', 'SUPER_ADMIN', 'excursions.view'),
    ('SUPER_ADMIN_excursions.manage', 'SUPER_ADMIN', 'excursions.manage'),
    ('SUPER_ADMIN_rentals.view', 'SUPER_ADMIN', 'rentals.view'),
    ('SUPER_ADMIN_rentals.manage', 'SUPER_ADMIN', 'rentals.manage'),
    ('SUPER_ADMIN_events.view', 'SUPER_ADMIN', 'events.view'),
    ('SUPER_ADMIN_events.manage', 'SUPER_ADMIN', 'events.manage'),
    ('SUPER_ADMIN_holidays.view', 'SUPER_ADMIN', 'holidays.view'),
    ('SUPER_ADMIN_holidays.manage', 'SUPER_ADMIN', 'holidays.manage'),
    ('SUPER_ADMIN_restaurant.view', 'SUPER_ADMIN', 'restaurant.view'),
    ('SUPER_ADMIN_restaurant.manage', 'SUPER_ADMIN', 'restaurant.manage'),
    ('SUPER_ADMIN_restaurant.manage_reservations', 'SUPER_ADMIN', 'restaurant.manage_reservations'),
    ('SUPER_ADMIN_bookings.view', 'SUPER_ADMIN', 'bookings.view'),
    ('SUPER_ADMIN_bookings.manage', 'SUPER_ADMIN', 'bookings.manage'),
    ('SUPER_ADMIN_settings.manage', 'SUPER_ADMIN', 'settings.manage'),
    ('SUPER_ADMIN_staff.manage', 'SUPER_ADMIN', 'staff.manage'),
    ('SUPER_ADMIN_audit.view', 'SUPER_ADMIN', 'audit.view'),

    ('LOCATION_MANAGER_dashboard.view', 'LOCATION_MANAGER', 'dashboard.view'),
    ('LOCATION_MANAGER_excursions.view', 'LOCATION_MANAGER', 'excursions.view'),
    ('LOCATION_MANAGER_excursions.manage', 'LOCATION_MANAGER', 'excursions.manage'),
    ('LOCATION_MANAGER_rentals.view', 'LOCATION_MANAGER', 'rentals.view'),
    ('LOCATION_MANAGER_rentals.manage', 'LOCATION_MANAGER', 'rentals.manage'),
    ('LOCATION_MANAGER_events.view', 'LOCATION_MANAGER', 'events.view'),
    ('LOCATION_MANAGER_events.manage', 'LOCATION_MANAGER', 'events.manage'),
    ('LOCATION_MANAGER_holidays.view', 'LOCATION_MANAGER', 'holidays.view'),
    ('LOCATION_MANAGER_holidays.manage', 'LOCATION_MANAGER', 'holidays.manage'),
    ('LOCATION_MANAGER_restaurant.view', 'LOCATION_MANAGER', 'restaurant.view'),
    ('LOCATION_MANAGER_restaurant.manage', 'LOCATION_MANAGER', 'restaurant.manage'),
    ('LOCATION_MANAGER_restaurant.manage_reservations', 'LOCATION_MANAGER', 'restaurant.manage_reservations'),
    ('LOCATION_MANAGER_bookings.view', 'LOCATION_MANAGER', 'bookings.view'),
    ('LOCATION_MANAGER_bookings.manage', 'LOCATION_MANAGER', 'bookings.manage'),

    ('BOOKING_STAFF_dashboard.view', 'BOOKING_STAFF', 'dashboard.view'),
    ('BOOKING_STAFF_excursions.view', 'BOOKING_STAFF', 'excursions.view'),
    ('BOOKING_STAFF_rentals.view', 'BOOKING_STAFF', 'rentals.view'),
    ('BOOKING_STAFF_events.view', 'BOOKING_STAFF', 'events.view'),
    ('BOOKING_STAFF_holidays.view', 'BOOKING_STAFF', 'holidays.view'),
    ('BOOKING_STAFF_restaurant.view', 'BOOKING_STAFF', 'restaurant.view'),
    ('BOOKING_STAFF_restaurant.manage_reservations', 'BOOKING_STAFF', 'restaurant.manage_reservations'),
    ('BOOKING_STAFF_bookings.view', 'BOOKING_STAFF', 'bookings.view'),
    ('BOOKING_STAFF_bookings.manage', 'BOOKING_STAFF', 'bookings.manage'),

    ('FINANCE_dashboard.view', 'FINANCE', 'dashboard.view'),
    ('FINANCE_excursions.view', 'FINANCE', 'excursions.view'),
    ('FINANCE_rentals.view', 'FINANCE', 'rentals.view'),
    ('FINANCE_events.view', 'FINANCE', 'events.view'),
    ('FINANCE_holidays.view', 'FINANCE', 'holidays.view'),
    ('FINANCE_restaurant.view', 'FINANCE', 'restaurant.view'),
    ('FINANCE_bookings.view', 'FINANCE', 'bookings.view');

-- TRAVEL_AGENT intentionally gets no permissions seeded (reserved for a later,
-- separate agent-portal phase — matches the enum-era comment on AdminRole).

ALTER TABLE `admin_users` MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'BOOKING_STAFF';

ALTER TABLE `admin_users` ADD CONSTRAINT `admin_users_role_fkey` FOREIGN KEY (`role`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
