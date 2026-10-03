-- Content changes from "changes_v 1.0.docx" (homepage copy review):
--   1. Only the Lunch Menu and a new Cocktail Menu are offered. The Children's
--      Menu, Dinner Menu and Seasonal Specials are HIDDEN (isActive = 0), not
--      deleted — switch them back on in Admin -> Restaurant Menus if needed.
--   2. New Cocktail Menu. ITS DRINKS AND PRICES ARE SAMPLES — replace them with
--      the bar's real list and prices in Admin -> Restaurant Menus before
--      guests rely on them.
--   3. New beach-day item "Beach Day with Lunch at Coco Grill" — $45 per adult
--      (and per child; change in Admin -> Beach Chairs if children pay less),
--      same 4-hour sessions and two rows of 20 as "Beach Umbrellas & Chairs".
--
-- Safe to run more than once, and portable between the local and hosted
-- databases: rows are found by slug, and the location is whichever location
-- row exists (ids differ between installs).
--
-- Import with utf8mb4 (the menu uses accented characters), e.g.:
--   mysql -u USER -p --default-character-set=utf8mb4 DBNAME < update-menus-and-beach-day-lunch.sql

SET NAMES utf8mb4;
SET @loc = (SELECT id FROM locations ORDER BY createdAt LIMIT 1);

-- ============ 1. Hide the menus that are no longer offered ============
UPDATE restaurant_menus SET isActive = 0, updatedAt = NOW()
WHERE slug IN ('childrens-menu', 'dinner-menu', 'seasonal-specials');

-- Lunch first, cocktails second.
UPDATE restaurant_menus SET sortOrder = 1, updatedAt = NOW() WHERE slug = 'lunch-menu';

-- ============ 2. Cocktail Menu (sample drinks and prices) ============
INSERT IGNORE INTO restaurant_menus (id, locationId, title, slug, description, timings, imageUrl, sortOrder, isActive, createdAt, updatedAt)
VALUES ('coco_menu_cocktails', @loc, 'Cocktail Menu', 'cocktail-menu',
        'Island cocktails and alcohol-free favourites from the bar, made to enjoy on the sand.',
        NULL, NULL, 2, 1, NOW(), NOW());
SET @cm = (SELECT id FROM restaurant_menus WHERE slug = 'cocktail-menu');

INSERT IGNORE INTO restaurant_menu_sections (id, menuId, heading, subheading, sortOrder) VALUES
('sample_cocktail_sec_1', @cm, 'Island Favourites', 'Made with Caribbean rum', 0),
('sample_cocktail_sec_2', @cm, 'Classics', NULL, 1),
('sample_cocktail_sec_3', @cm, 'Alcohol-Free', NULL, 2);

INSERT IGNORE INTO restaurant_menu_items (id, sectionId, name, description, price, sortOrder, images) VALUES
('sample_cocktail_1',  'sample_cocktail_sec_1', 'Rum Punch',          'Our house blend of Caribbean rum, tropical juices and grenadine, finished with a dusting of nutmeg.', 10.00, 0, NULL),
('sample_cocktail_2',  'sample_cocktail_sec_1', 'Piña Colada',        'White rum, coconut cream and fresh pineapple, blended with ice.', 12.00, 1, NULL),
('sample_cocktail_3',  'sample_cocktail_sec_1', 'Painkiller',         'Dark rum, pineapple, orange and cream of coconut, topped with nutmeg.', 12.00, 2, NULL),
('sample_cocktail_4',  'sample_cocktail_sec_1', 'Coco Loco',          'Rum and fresh coconut water, served in the coconut.', 14.00, 3, NULL),
('sample_cocktail_5',  'sample_cocktail_sec_2', 'Mojito',             'White rum, fresh lime, mint and soda.', 11.00, 0, NULL),
('sample_cocktail_6',  'sample_cocktail_sec_2', 'Strawberry Daiquiri','Rum, strawberries and lime, blended with ice.', 12.00, 1, NULL),
('sample_cocktail_7',  'sample_cocktail_sec_2', 'Margarita',          'Tequila, triple sec and fresh lime, with a salted rim.', 12.00, 2, NULL),
('sample_cocktail_8',  'sample_cocktail_sec_2', 'Mai Tai',            'Light and dark rum, orange liqueur, orgeat and lime.', 13.00, 3, NULL),
('sample_cocktail_9',  'sample_cocktail_sec_3', 'Virgin Piña Colada', 'Coconut cream and fresh pineapple, blended with ice.', 8.00, 0, NULL),
('sample_cocktail_10', 'sample_cocktail_sec_3', 'Tropical Fruit Punch','Pineapple, orange and passion fruit with a splash of grenadine.', 7.00, 1, NULL),
('sample_cocktail_11', 'sample_cocktail_sec_3', 'Fresh Limeade',      'Freshly squeezed lime, lightly sweetened and topped with soda.', 6.00, 2, NULL);

-- ============ 3. Beach Day with Lunch at Coco Grill ============
INSERT IGNORE INTO rental_items (id, locationId, name, slug, description, images, priceAdult, priceChild, status, durationMinutes, cardImageUrl, headerImageUrl, createdAt, updatedAt)
VALUES ('coco_rental_beach_lunch', @loc, 'Beach Day with Lunch at Coco Grill', 'beach-day-with-lunch',
        'Reserve a beach chair, umbrella and a delicious lunch at Coco Grill at Coccolobo Beach Club and enjoy Wi-Fi and restroom access during your visit. Beverages are available separately.',
        NULL, 45.00, 45.00, 'ACTIVE', 240, NULL, NULL, NOW(), NOW());
SET @ri = (SELECT id FROM rental_items WHERE slug = 'beach-day-with-lunch');

INSERT IGNORE INTO rental_spots (id, rentalItemId, code, quantity, isActive) VALUES
('coco_lunch_spot_a', @ri, 'Row A', 20, 1),
('coco_lunch_spot_b', @ri, 'Row B', 20, 1);

INSERT IGNORE INTO rental_time_slots (id, rentalItemId, label, startTime, endTime, isActive) VALUES
('coco_lunch_slot_am', @ri, '9:00 AM - 1:00 PM', '09:00', '13:00', 1),
('coco_lunch_slot_pm', @ri, '1:00 PM - 5:00 PM', '13:00', '17:00', 1);
