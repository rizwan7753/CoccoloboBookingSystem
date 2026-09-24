-- SAMPLE CONTENT — invented reviews and journal posts to fill the site
-- while real ones are collected. Replace or delete these before real
-- customers see the site: publishing made-up testimonials as if they
-- were genuine is deceptive advertising (e.g. US FTC endorsement rules).
--
-- Safe to run more than once (INSERT IGNORE on fixed ids), and portable
-- between databases: excursions/rentals are looked up by slug and the
-- location by whatever location row exists, instead of hardcoding ids
-- that differ between a local and a hosted database. A row whose slug
-- doesn't exist on the target database is simply skipped.
--
-- Import with utf8mb4 so the "·" separators survive, e.g.:
--   mysql -u USER -p --default-character-set=utf8mb4 DBNAME < seed-sample-reviews-and-posts.sql
--
-- To remove every sample row later:
--   DELETE FROM reviews WHERE id LIKE 'sample\_%' OR id LIKE 'rev\_dummy\_%' OR id LIKE 'rev\_item\_%';
--   DELETE FROM blog_posts WHERE id LIKE 'sample\_%' OR id LIKE 'post\_dummy\_%';

SET NAMES utf8mb4;
SET @loc = (SELECT id FROM locations ORDER BY createdAt LIMIT 1);

-- ============ HOMEPAGE (general) REVIEWS ============
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt) VALUES
('sample_rev_home_1', @loc, NULL, NULL, NULL, 5, 'Our favourite stop of the whole cruise', 'We had one day in Basseterre and spent all of it here. Booked the night before, everything was ready when we arrived, and the staff remembered our names by lunch.', 'Hannah & Mark T.', 'HT', 'Charlotte, NC · September 2026', 'PUBLISHED', 5, NOW() - INTERVAL 3 DAY, NOW()),
('sample_rev_home_2', @loc, NULL, NULL, NULL, 5, 'Calm, clean and properly looked after', 'Far quieter than the beaches closer to the port. Chairs were spaced out, the bathrooms were spotless, and nobody tried to sell us anything all day.', 'Oliver P.', 'OP', 'Bristol, UK · August 2026', 'PUBLISHED', 6, NOW() - INTERVAL 9 DAY, NOW()),
('sample_rev_home_3', @loc, NULL, NULL, NULL, 4, 'Great for a family with teenagers', 'The kids spent the afternoon in the water while we ate lunch in the shade. Only wish we had booked a cabana instead of chairs — next time.', 'Carmen R.', 'CR', 'San Juan, PR · July 2026', 'PUBLISHED', 7, NOW() - INTERVAL 16 DAY, NOW()),
('sample_rev_home_4', @loc, NULL, NULL, NULL, 5, 'Booking online made it easy', 'Put an excursion and two beach chairs in one cart and paid once. Confirmation email came straight away and the booking code was all we needed at the gate.', 'Daniel K.', 'DK', 'Ottawa, ON · September 2026', 'PUBLISHED', 8, NOW() - INTERVAL 5 DAY, NOW());

-- ============ EXCURSION REVIEWS ============
-- Day Pass to Coccolobo Beach Club
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_daypass_1', @loc, 'EXCURSION', e.id, e.title, 5, 'Six hours well spent', 'Towel, chair, umbrella and a rum punch waiting for us. Wi-Fi worked well enough to send photos home, which kept the grandparents happy.', 'Priscilla M.', 'PM', 'Atlanta, GA · September 2026', 'PUBLISHED', 2, NOW() - INTERVAL 4 DAY, NOW()
FROM excursions e WHERE e.slug = 'day-pass';

-- Foodie & Beach
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_foodie_1', @loc, 'EXCURSION', e.id, e.title, 5, 'Saltfish & Dumpling was the highlight', 'Proper tasting portions, not a few bites on a plate. The steamed fish with turn corn surprised all six of us.', 'Kwame A.', 'KA', 'London, UK · August 2026', 'PUBLISHED', 1, NOW() - INTERVAL 11 DAY, NOW()
FROM excursions e WHERE e.slug = 'foodie-and-beach';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_foodie_2', @loc, 'EXCURSION', e.id, e.title, 4, 'Come hungry', 'Loved the food and the stories behind each dish. Goat Water has a kick, so ask for water on the side. Needed our group of four to book, which was easy.', 'Beth S.', 'BS', 'Dublin, IE · July 2026', 'PUBLISHED', 2, NOW() - INTERVAL 20 DAY, NOW()
FROM excursions e WHERE e.slug = 'foodie-and-beach';

-- Sushi Class 101 Beach Break
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_sushi_1', @loc, 'EXCURSION', e.id, e.title, 5, 'Rolled our own and ate it on the sand', 'The chef made sure everyone finished a proper 8-piece roll. The glass of sake after was a nice touch before two hours on the beach.', 'Mei L.', 'ML', 'Seattle, WA · September 2026', 'PUBLISHED', 1, NOW() - INTERVAL 6 DAY, NOW()
FROM excursions e WHERE e.slug = 'sushi-class-101-beach-break';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_sushi_2', @loc, 'EXCURSION', e.id, e.title, 4, 'Fun group activity', 'Did this for a friend''s birthday with eight of us. Great teacher and good fun, though the class ran a little long and ate into our beach time.', 'Jordan V.', 'JV', 'Boston, MA · August 2026', 'PUBLISHED', 2, NOW() - INTERVAL 14 DAY, NOW()
FROM excursions e WHERE e.slug = 'sushi-class-101-beach-break';

-- Wine Tasting and Beach
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_wine_1', @loc, 'EXCURSION', e.id, e.title, 5, 'The rosé on the beach was perfect', 'Three generous pours — red, white and rosé — with a cheese platter and hors d''oeuvres. Relaxed, unpretentious and a lovely way to spend an afternoon.', 'Claire D.', 'CD', 'Paris, FR · September 2026', 'PUBLISHED', 0, NOW() - INTERVAL 2 DAY, NOW()
FROM excursions e WHERE e.slug = 'wine-tasting-and-beach';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_wine_2', @loc, 'EXCURSION', e.id, e.title, 5, 'Knowledgeable host', 'Our host explained each wine without making us feel like beginners. The cheese platter paired really well with the red.', 'Robert G.', 'RG', 'Napa, CA · August 2026', 'PUBLISHED', 1, NOW() - INTERVAL 12 DAY, NOW()
FROM excursions e WHERE e.slug = 'wine-tasting-and-beach';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_wine_3', @loc, 'EXCURSION', e.id, e.title, 4, 'Great with a group of friends', 'Booked for the four of us and it was a highlight of the week. Would have happily paid for a fourth glass.', 'Anika J.', 'AJ', 'Amsterdam, NL · July 2026', 'PUBLISHED', 2, NOW() - INTERVAL 24 DAY, NOW()
FROM excursions e WHERE e.slug = 'wine-tasting-and-beach';

-- Coccolobo VIP Experience
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_vip_1', @loc, 'EXCURSION', e.id, e.title, 5, 'Our server made the day', 'Twelve of us for a 40th birthday. One server looked after the whole group, glasses never went empty, and the flexible start time meant nobody was rushed off the ship.', 'Marcus W.', 'MW', 'Houston, TX · September 2026', 'PUBLISHED', 0, NOW() - INTERVAL 7 DAY, NOW()
FROM excursions e WHERE e.slug = 'coccolobo-vip-experience';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_vip_2', @loc, 'EXCURSION', e.id, e.title, 5, 'Real brands at the bar', 'Johnnie Walker Black and Mount Gay rather than unnamed house pours. Worth it for a group that wants to relax properly.', 'Siobhan O.', 'SO', 'Cork, IE · August 2026', 'PUBLISHED', 1, NOW() - INTERVAL 15 DAY, NOW()
FROM excursions e WHERE e.slug = 'coccolobo-vip-experience';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_vip_3', @loc, 'EXCURSION', e.id, e.title, 4, 'Book early for big groups', 'Excellent service once we were there. We needed the minimum of six and had to shuffle numbers the night before, so sort your group out early.', 'Terrence H.', 'TH', 'Toronto, ON · July 2026', 'PUBLISHED', 2, NOW() - INTERVAL 27 DAY, NOW()
FROM excursions e WHERE e.slug = 'coccolobo-vip-experience';

-- Coccolobo Cabana
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_cabana_1', @loc, 'EXCURSION', e.id, e.title, 5, 'Private shade and an open bar', 'Just the four of us under our own cabana all day. Our server checked in without hovering and the rum punch kept coming.', 'Natalie B.', 'NB', 'Chicago, IL · September 2026', 'PUBLISHED', 0, NOW() - INTERVAL 5 DAY, NOW()
FROM excursions e WHERE e.slug = 'coccolobo-cabana';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_cabana_2', @loc, 'EXCURSION', e.id, e.title, 5, 'Worth it split four ways', 'The flat rate works out well once you divide it between four people, especially with the drinks included.', 'Ian F.', 'IF', 'Manchester, UK · August 2026', 'PUBLISHED', 1, NOW() - INTERVAL 13 DAY, NOW()
FROM excursions e WHERE e.slug = 'coccolobo-cabana';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_cabana_3', @loc, 'EXCURSION', e.id, e.title, 4, 'Lovely, but bring snacks', 'Great setup and service. Food isn''t included on this one, so we ordered from the restaurant — next time we''ll go all inclusive.', 'Lucia F.', 'LF', 'Milan, IT · July 2026', 'PUBLISHED', 2, NOW() - INTERVAL 22 DAY, NOW()
FROM excursions e WHERE e.slug = 'coccolobo-cabana';

-- Coccolobo All Inclusive Cabana
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_aicabana_1', @loc, 'EXCURSION', e.id, e.title, 5, 'Did not have to think about anything', 'Lunch, drinks and a server all day for our anniversary. The cabana lunch menu was a big step up from what we expected at a beach club.', 'Evelyn & Sam C.', 'EC', 'Denver, CO · September 2026', 'PUBLISHED', 0, NOW() - INTERVAL 3 DAY, NOW()
FROM excursions e WHERE e.slug = 'coccolobo-all-inclusive-cabana';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_aicabana_2', @loc, 'EXCURSION', e.id, e.title, 5, 'Best way to do the club', 'If you are going to splurge on one day, make it this one. The grilled lobster at lunch was outstanding.', 'Graham N.', 'GN', 'Edinburgh, UK · August 2026', 'PUBLISHED', 1, NOW() - INTERVAL 10 DAY, NOW()
FROM excursions e WHERE e.slug = 'coccolobo-all-inclusive-cabana';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_aicabana_3', @loc, 'EXCURSION', e.id, e.title, 5, 'Perfect for a small family', 'Two adults and two teens, one cabana, and a full day of food and drinks sorted. Easy to book and nothing extra to pay on the day.', 'Renee P.', 'RP', 'Tampa, FL · July 2026', 'PUBLISHED', 2, NOW() - INTERVAL 19 DAY, NOW()
FROM excursions e WHERE e.slug = 'coccolobo-all-inclusive-cabana';

-- ============ BEACH CHAIR REVIEWS ============
-- Beach Chair
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_chair_1', @loc, 'RENTAL', r.id, r.name, 5, 'Booked from the ship that morning', 'Saw the weather was perfect and reserved two chairs over breakfast. Four hours by the water for fifteen dollars each is hard to beat.', 'Victor L.', 'VL', 'Miami, FL · September 2026', 'PUBLISHED', 2, NOW() - INTERVAL 2 DAY, NOW()
FROM rental_items r WHERE r.slug = 'beach-chair';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_chair_2', @loc, 'RENTAL', r.id, r.name, 4, 'Pick the morning slot', 'Afternoon sun gets strong, so the morning session was the right call for us. Chairs were comfortable and staff helped us find our spot straight away.', 'Ruth A.', 'RA', 'Halifax, NS · August 2026', 'PUBLISHED', 3, NOW() - INTERVAL 17 DAY, NOW()
FROM rental_items r WHERE r.slug = 'beach-chair';

-- Beach Umbrellas & Chairs
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_umbrella_1', @loc, 'RENTAL', r.id, r.name, 5, 'Shade made all the difference', 'With a toddler in tow the umbrella setup was a must. Reserved the exact spot we wanted near the water and it was ready when we arrived.', 'Sophie W.', 'SW', 'Cardiff, UK · September 2026', 'PUBLISHED', 1, NOW() - INTERVAL 4 DAY, NOW()
FROM rental_items r WHERE r.slug = 'beach-umbrellas-chairs';
INSERT IGNORE INTO reviews (id, locationId, itemType, itemId, itemTitle, rating, title, quote, authorName, authorInitials, authorMeta, status, sortOrder, createdAt, updatedAt)
SELECT 'sample_rev_umbrella_2', @loc, 'RENTAL', r.id, r.name, 4, 'Good value for a group', 'Split the setup between three of us. Clean, sturdy chairs and a good spot — just wish the afternoon slot started a little earlier.', 'Andre M.', 'AM', 'Nassau, BS · August 2026', 'PUBLISHED', 2, NOW() - INTERVAL 18 DAY, NOW()
FROM rental_items r WHERE r.slug = 'beach-umbrellas-chairs';

-- ============ JOURNAL POSTS ============
INSERT IGNORE INTO blog_posts (id, locationId, title, slug, excerpt, body, imageUrl, readMinutes, status, publishedAt, sortOrder, createdAt, updatedAt) VALUES
('sample_post_1', @loc,
 'What to pack for a day at Coccolobo',
 'what-to-pack-for-a-beach-day',
 'Chairs, umbrellas and towels are on us. Here is the short list of what is actually worth bringing — and what you can leave on the ship.',
 'Most of what you need for a day with us is already waiting on the sand. Every day pass, excursion and cabana includes a chair, an umbrella and use of the facilities, and the day pass adds a towel and a welcome rum punch. So the packing list is shorter than you might think.\n\nBring reef-safe sunscreen and reapply more often than you expect — the breeze off the water hides how strong the sun is, especially after noon. A hat and sunglasses help, and water shoes are worth it if you plan to wade out past the shallows.\n\nBring your booking code. It is in your confirmation email and on the booking page, and it is all our team needs at the gate. If you booked several things in one order, the single order code covers all of them.\n\nLeave behind anything you would worry about losing. There is Wi-Fi across the club if you want to send photos home, but the best days here tend to be the ones where the phone stays in the bag.',
 NULL, 3, 'PUBLISHED', '2026-09-18 12:00:00', 0, NOW(), NOW()),
('sample_post_2', @loc,
 'Cabana or VIP Experience? Choosing the right day for your group',
 'cabana-or-vip-experience',
 'Both come with a dedicated server and an open bar. The difference is group size, privacy and lunch — here is how to choose.',
 'The two questions that decide it are how many of you there are, and whether you want lunch included.\n\nThe cabanas are built for up to four people at a flat rate. You get your own private, shaded space, a dedicated server and the open bar. The All Inclusive Cabana adds the cabana lunch menu on top, so there is nothing else to pay on the day. For a couple, a small family or two couples travelling together, a cabana is usually the better value once the price is split four ways.\n\nThe VIP Experience is priced per guest and scales much further — from a minimum of six guests up to eighty. It includes the same premium open bar and a dedicated server looking after the whole group, with a flexible start time that suits cruise schedules. For birthdays, reunions and company trips, this is the one to book.\n\nWhichever you choose, remember that excursions close for booking at 9 PM the evening before. Groups that need to confirm numbers should book early and adjust, rather than leave it to the last night.',
 NULL, 4, 'PUBLISHED', '2026-09-10 12:00:00', 0, NOW(), NOW()),
('sample_post_3', @loc,
 'Wine on the sand: what to expect from our tasting',
 'wine-tasting-what-to-expect',
 'Three wines, a cheese platter and an afternoon by the water. A quick look at how the Wine Tasting and Beach session runs.',
 'Our Wine Tasting and Beach session is designed to be relaxed rather than formal. You do not need to know anything about wine to enjoy it.\n\nEach guest tastes three wines — a red, a white and a rosé — served with hors d''oeuvres and a cheese platter chosen to go with them. Your host talks through each glass as you go, and there is plenty of time to ask questions or simply enjoy the view.\n\nAfterwards the rest of the afternoon is yours: your chair, umbrella and the club''s facilities are included, so most guests stay on to swim and settle in.\n\nThe tasting runs for groups of four to forty. It closes for booking the evening before, so if you are coming off a cruise ship, book it the night before you dock.',
 NULL, 3, 'PUBLISHED', '2026-08-30 12:00:00', 0, NOW(), NOW());
