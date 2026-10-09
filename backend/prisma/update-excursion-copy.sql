-- Excursion/beach-chair wording from
-- "Coccolobo_Excursions_Website_Copy_Recommendations.docx".
--
-- Items are matched by slug, so this runs unchanged on the local and the
-- hosted database, and is safe to run more than once.
--
-- Import with utf8mb4 so the apostrophes and accents survive, e.g.:
--   mysql -u USER -p --default-character-set=utf8mb4 DBNAME < update-excursion-copy.sql

SET NAMES utf8mb4;

-- ============ 1. Site-wide wording fixes ============
-- Brand spelling: "Cocolobo" -> "Coccolobo" (the live Day Pass has this typo).
UPDATE excursions SET
  description = REPLACE(description, 'Cocolobo Beach Club', 'Coccolobo Beach Club'),
  included    = REPLACE(included,    'Cocolobo Beach Club', 'Coccolobo Beach Club'),
  excluded    = REPLACE(excluded,    'Cocolobo Beach Club', 'Coccolobo Beach Club')
WHERE CONCAT_WS(' ', description, included, excluded) LIKE '%Cocolobo Beach Club%';
UPDATE rental_items SET description = REPLACE(description, 'Cocolobo Beach Club', 'Coccolobo Beach Club')
WHERE description LIKE '%Cocolobo Beach Club%';

-- "WiFi" -> "Wi-Fi".
UPDATE excursions SET
  description = REPLACE(description, 'WiFi', 'Wi-Fi'),
  included    = REPLACE(included,    'WiFi', 'Wi-Fi'),
  excluded    = REPLACE(excluded,    'WiFi', 'Wi-Fi')
WHERE CONCAT_WS(' ', description, included, excluded) LIKE '%WiFi%';
UPDATE rental_items SET description = REPLACE(description, 'WiFi', 'Wi-Fi') WHERE description LIKE '%WiFi%';

-- "persons" -> "guests".
UPDATE excursions SET
  description = REPLACE(description, 'persons', 'guests'),
  included    = REPLACE(included,    'persons', 'guests'),
  excluded    = REPLACE(excluded,    'persons', 'guests')
WHERE CONCAT_WS(' ', description, included, excluded) LIKE '%persons%';
UPDATE rental_items SET description = REPLACE(description, 'persons', 'guests') WHERE description LIKE '%persons%';

-- "swim suit" -> "swimsuit" (not present at the time of writing; kept so the
-- fix applies if the wording is reintroduced in the admin panel).
UPDATE excursions SET whatToBring = REPLACE(whatToBring, 'swim suit', 'swimsuit') WHERE whatToBring LIKE '%swim suit%';

-- ============ 2. Recommended descriptions ============
UPDATE excursions SET description =
  'Spend the day relaxing at Coccolobo Beach Club with your own beach chair and umbrella, full access to our facilities, Wi-Fi, towel service and a welcome rum punch.'
WHERE slug = 'day-pass';

UPDATE excursions SET description =
  'Learn the art of sushi making with guidance from our sushi chef as you create your own eight-piece sushi roll. Afterwards, unwind with two hours of beach time at Coccolobo Beach Club.'
WHERE slug = 'sushi-class-101-beach-break';

UPDATE excursions SET description =
  'Discover the flavours of St. Kitts with a tasting of authentic Kittitian favourites including Goat Water, Cook-Up, Saltfish & Dumplings and Steamed Fish with Turn Corn. Finish with local desserts and refreshments, and take home a recipe card to recreate a little taste of St. Kitts.'
WHERE slug = 'foodie-and-beach';

UPDATE excursions SET description =
  'Sip, savour and unwind by the Caribbean Sea with a curated tasting of wines from Opus Fine Wine & Spirits. Enjoy your tasting in our relaxed beachfront setting, followed by time to soak up the atmosphere at Coccolobo Beach Club.'
WHERE slug = 'wine-tasting-and-beach';

UPDATE rental_items SET description =
  'Find your perfect spot on the sand with a reserved beach chair at Coccolobo Beach Club. Stretch out, soak up the Caribbean sunshine, and enjoy beautiful ocean views in a relaxed tropical setting. Take a refreshing dip in the sea, grab a drink from our beachside bar, or simply sit back and enjoy island life at your own pace.'
WHERE slug = 'beach-chair';

-- NOTE: the recommended copy ends "Flat rate for up to four guests.", but this
-- item is priced per guest ($50 each), not as a flat rate for four. That line is
-- left out rather than publish an incorrect price basis — restore it only if the
-- pricing is changed to an actual flat rate.
UPDATE rental_items SET description =
  'Relax and unwind at Coccolobo Beach Club with your own reserved beach chair and umbrella. Soak up the Caribbean sunshine, enjoy the refreshing sea breeze, and take in the stunning turquoise ocean views. Whether you''re swimming, sunbathing, or simply enjoying the laid-back island atmosphere, it''s the perfect way to spend your day in paradise.'
WHERE slug = 'beach-umbrellas-chairs';

UPDATE rental_items SET description =
  'Enjoy the perfect beach day at Coccolobo Beach Club! Relax on your reserved beach chair beneath the shade of an umbrella, soak up the Caribbean sunshine, and take in the beautiful ocean views. When you''re ready to refuel, enjoy a delicious freshly prepared lunch from our beachside grill. Sit back, unwind, and let us take care of the rest while you enjoy a laid-back day in paradise.'
WHERE slug = 'beach-day-with-lunch';

-- ============ 3. Doc note: "List included drinks separately rather than
-- crowding the opening paragraph." ============
-- The note sits under "Coccolobo Beach Chair" in the document, but that
-- description has no drinks list in it. The experience that actually crowds
-- its opening paragraph is the VIP Experience, which spells out the whole
-- open bar mid-sentence. The list moves into "What's included", where the
-- page already renders it as its own section, and the group minimum comes
-- out too (the booking form enforces minGuests, so the copy needn't repeat it).
UPDATE excursions SET
  description = 'A luxury beach experience with a dedicated server attending to all your needs, an open bar, and a flexible start time.',
  included    = 'Open bar (Johnnie Walker Black, Absolut Vodka, Beefeater Gin, Mount Gay Rum, local beers, red and white house wines, rum punch, sodas, juices, bottled water), beach chair, umbrella, facility amenities, Wi-Fi access, dedicated server'
WHERE slug = 'coccolobo-vip-experience';

-- ============ 4. Guest counts written out ============
-- Doc: 'Use "guests" throughout; for example, "Up to four guests".'
UPDATE excursions SET
  description = REPLACE(description, 'up to 4 guests', 'up to four guests'),
  included    = REPLACE(included,    'up to 4 guests', 'up to four guests')
WHERE CONCAT_WS(' ', description, included) LIKE '%up to 4 guests%';
UPDATE rental_items SET description = REPLACE(description, 'up to 4 guests', 'up to four guests')
WHERE description LIKE '%up to 4 guests%';

-- ============ 5. Experience-name consistency ============
-- Doc section 2 heads this one "Wine Tasting & Beach"; the sibling
-- "Foodie & Beach" already uses the ampersand.
UPDATE excursions SET title = 'Wine Tasting & Beach' WHERE slug = 'wine-tasting-and-beach';
