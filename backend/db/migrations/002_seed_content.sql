-- ── Bios ──────────────────────────────────────────────────────────────────────
UPDATE profiles SET bio = 'Digital painter obsessed with color and light. Based in Amsterdam.' WHERE user_id = 4;
UPDATE profiles SET bio = 'Street photographer turned digital artist. Always chasing the golden hour.' WHERE user_id = 5;
UPDATE profiles SET bio = 'Illustrator and concept artist. I draw fantasy worlds one pixel at a time.' WHERE user_id = 6;
UPDATE profiles SET bio = 'Abstract sculptor and mixed-media artist. Accra → London → everywhere.' WHERE user_id = 7;
UPDATE profiles SET bio = '3D generalist and motion designer. Coffee-powered creativity.' WHERE user_id = 8;

-- ── Mutual follows (all 5 users follow each other) ────────────────────────────
INSERT INTO follows (follower_id, following_id) VALUES
  (4,5),(4,6),(4,7),(4,8),
  (5,4),(5,6),(5,7),(5,8),
  (6,4),(6,5),(6,7),(6,8),
  (7,4),(7,5),(7,6),(7,8),
  (8,4),(8,5),(8,6),(8,7)
ON CONFLICT DO NOTHING;

-- ── Artworks ──────────────────────────────────────────────────────────────────
-- alice (id=4) — paintings / digital art
INSERT INTO artworks (user_id, title, description, content_type, status, published_at)
VALUES
  (4,'Amber Noon','Late afternoon light spilling across rooftops. Soft warm palette, lots of patience.','photo','published',NOW()-INTERVAL '2 days'),
  (4,'Blue Reverie','Dreaming in indigo. An experiment with layered glazes and textured brush edges.','photo','published',NOW()-INTERVAL '5 days'),
  (4,'Morning Ritual','Coffee and canvases. My studio at 7 am before the day gets in the way.','photo','published',NOW()-INTERVAL '9 days'),
  (4,'Static Bloom','Floral forms frozen mid-motion. Digital oil on a tablet.','photo','published',NOW()-INTERVAL '14 days'),
  (4,'Rust Garden','Industrial textures meet botanical softness. Found beauty in a demolition site.','photo','published',NOW()-INTERVAL '20 days'),
  (4,'Cloud Study #4','Thirty-minute plein-air study done digitally on the train. Clouds wait for no one.','photo','published',NOW()-INTERVAL '28 days'),
  (4,'Copper Hour','That specific quality of light just before a thunderstorm rolls in.','photo','published',NOW()-INTERVAL '35 days'),
  (4,'The Weight of Green','Moss and memory. A love letter to every overgrown wall I have passed.','photo','published',NOW()-INTERVAL '42 days')
RETURNING id;

-- ben (id=5) — photography / street
INSERT INTO artworks (user_id, title, description, content_type, status, published_at)
VALUES
  (5,'Golden Grit','Street-level geometry at dusk. The city breathes differently after rush hour.','photo','published',NOW()-INTERVAL '1 day'),
  (5,'Silhouette City','Backlit figures against a pink horizon. No editing — just timing.','photo','published',NOW()-INTERVAL '4 days'),
  (5,'Neon Rain','Wet asphalt mirrors the signs above. Tokyo, 2 am, no plan.','photo','published',NOW()-INTERVAL '7 days'),
  (5,'Forgotten Corner','Found this alley by getting lost. Best discoveries usually work that way.','photo','published',NOW()-INTERVAL '11 days'),
  (5,'Market Light','Early market, harsh shadows, honest faces.','photo','published',NOW()-INTERVAL '18 days'),
  (5,'Fade Out','Long exposure of a train leaving the station. Letting things go in blur.','photo','published',NOW()-INTERVAL '25 days'),
  (5,'Portrait of Speed','Rush hour distilled into a single frame.','video','published',NOW()-INTERVAL '33 days'),
  (5,'Urban Symmetry','Architecture as geometry. Found patterns everywhere once I started looking.','photo','published',NOW()-INTERVAL '40 days')
RETURNING id;

-- claire (id=6) — illustration / fantasy
INSERT INTO artworks (user_id, title, description, content_type, status, published_at)
VALUES
  (6,'The Forest Queen','Character design for an unannounced project. Autumn crown, silent power.','photo','published',NOW()-INTERVAL '3 days'),
  (6,'Starmap Dreamer','A traveller who navigates by constellations no one else can see.','photo','published',NOW()-INTERVAL '6 days'),
  (6,'Mechanical Heart','Clockwork anatomy study. What if feelings had gears?','photo','published',NOW()-INTERVAL '10 days'),
  (6,'Deep Cartography','Mapping the ocean floor of an imaginary world. 120 hours of work.','photo','published',NOW()-INTERVAL '16 days'),
  (6,'Lantern Festival','Thousands of lights, one moment. Mixed media with ink and digital colour.','photo','published',NOW()-INTERVAL '22 days'),
  (6,'The Cartographer','Character in a world where maps are forbidden. Personal project.','photo','published',NOW()-INTERVAL '30 days'),
  (6,'Portal Study','Speed-painting an interdimensional gate. 45-minute session.','photo','published',NOW()-INTERVAL '38 days'),
  (6,'Ink & Algorithm','Experimenting with generative patterns overlaid on hand-drawn linework.','photo','published',NOW()-INTERVAL '45 days')
RETURNING id;

-- dani (id=7) — abstract / mixed-media
INSERT INTO artworks (user_id, title, description, content_type, status, published_at)
VALUES
  (7,'Kinetic Red','Movement studies in vermillion. The body remembers what the mind forgets.','photo','published',NOW()-INTERVAL '2 days'),
  (7,'Layers of Belonging','Identity as strata. Compressed memory, compressed earth.','photo','published',NOW()-INTERVAL '8 days'),
  (7,'Noise & Signal','Information overload rendered as texture. What does data feel like?','photo','published',NOW()-INTERVAL '13 days'),
  (7,'Open Ground','Wide open space as freedom. Minimalism with maximum intention.','photo','published',NOW()-INTERVAL '19 days'),
  (7,'Grief, Annotated','A personal piece. Not everything needs explanation.','photo','published',NOW()-INTERVAL '27 days'),
  (7,'Collective Pulse','Sound visualisation from a protest I attended. Art as witness.','photo','published',NOW()-INTERVAL '34 days'),
  (7,'Archipelago','Islands of colour in a sea of negative space.','photo','published',NOW()-INTERVAL '41 days'),
  (7,'Root Systems','How things grow underground before they grow upward.','photo','published',NOW()-INTERVAL '48 days')
RETURNING id;

-- evan (id=8) — 3d / motion
INSERT INTO artworks (user_id, title, description, content_type, status, published_at)
VALUES
  (8,'Glass Terrain','Procedural landscape rendered in Blender. Eight hours of render time.','photo','published',NOW()-INTERVAL '1 day'),
  (8,'Void Protocol','Sci-fi environment concept. Dark matter and negative space.','photo','published',NOW()-INTERVAL '5 days'),
  (8,'Liquid Chrome','Material study — how light bends through reflective fluid surfaces.','photo','published',NOW()-INTERVAL '9 days'),
  (8,'Data Bloom','Particle system that blooms like a flower. Coded, not drawn.','photo','published',NOW()-INTERVAL '15 days'),
  (8,'Recursion Loop','An object containing itself. M. C. Escher would approve, I think.','photo','published',NOW()-INTERVAL '21 days'),
  (8,'Signal Ghost','Motion-blurred holographic character concept. Five revision rounds.','video','published',NOW()-INTERVAL '29 days'),
  (8,'Tessellation','Geometric tiling that never repeats. Mathematically generated.','photo','published',NOW()-INTERVAL '37 days'),
  (8,'Neon Spine','Spinal column made of light tubes. Anatomy meets architecture.','photo','published',NOW()-INTERVAL '44 days')
RETURNING id;

-- ── Media records (link artwork → file URL) ───────────────────────────────────
-- Images sourced from Picsum & Pixabay (deterministic seeds for reproducibility)
-- alice artworks
WITH alice_aw AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn FROM artworks WHERE user_id = 4
)
INSERT INTO media (artwork_id, media_type, file_url, "order")
SELECT id, 'image', url, 0
FROM alice_aw
JOIN (VALUES
  (1,'https://picsum.photos/seed/alice1/960/960'),
  (2,'https://picsum.photos/seed/alice2/960/960'),
  (3,'https://picsum.photos/seed/alice3/960/960'),
  (4,'https://picsum.photos/seed/alice4/960/960'),
  (5,'https://picsum.photos/seed/alice5/960/960'),
  (6,'https://picsum.photos/seed/alice6/960/960'),
  (7,'https://picsum.photos/seed/alice7/960/960'),
  (8,'https://picsum.photos/seed/alice8/960/960')
) AS urls(rn, url) USING (rn)
ON CONFLICT DO NOTHING;

-- ben artworks
WITH ben_aw AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn FROM artworks WHERE user_id = 5
)
INSERT INTO media (artwork_id, media_type, file_url, "order")
SELECT id, 'image', url, 0
FROM ben_aw
JOIN (VALUES
  (1,'https://cdn.pixabay.com/photo/2016/11/29/09/32/concept-1868728_960_720.jpg'),
  (2,'https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_960_720.jpg'),
  (3,'https://cdn.pixabay.com/photo/2016/11/29/03/53/architecture-1867187_960_720.jpg'),
  (4,'https://cdn.pixabay.com/photo/2016/11/29/12/13/fence-1869401_960_720.jpg'),
  (5,'https://cdn.pixabay.com/photo/2016/11/29/02/05/audience-1866738_960_720.jpg'),
  (6,'https://cdn.pixabay.com/photo/2017/02/08/17/46/sunset-2048727_960_720.jpg'),
  (7,'https://cdn.pixabay.com/photo/2016/11/23/15/32/piano-1853301_960_720.jpg'),
  (8,'https://cdn.pixabay.com/photo/2016/11/29/04/19/beach-1867285_960_720.jpg')
) AS urls(rn, url) USING (rn)
ON CONFLICT DO NOTHING;

-- claire artworks
WITH claire_aw AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn FROM artworks WHERE user_id = 6
)
INSERT INTO media (artwork_id, media_type, file_url, "order")
SELECT id, 'image', url, 0
FROM claire_aw
JOIN (VALUES
  (1,'https://picsum.photos/seed/claire1/960/960'),
  (2,'https://picsum.photos/seed/claire2/960/960'),
  (3,'https://picsum.photos/seed/claire3/960/960'),
  (4,'https://picsum.photos/seed/claire4/960/960'),
  (5,'https://picsum.photos/seed/claire5/960/960'),
  (6,'https://picsum.photos/seed/claire6/960/960'),
  (7,'https://picsum.photos/seed/claire7/960/960'),
  (8,'https://picsum.photos/seed/claire8/960/960')
) AS urls(rn, url) USING (rn)
ON CONFLICT DO NOTHING;

-- dani artworks
WITH dani_aw AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn FROM artworks WHERE user_id = 7
)
INSERT INTO media (artwork_id, media_type, file_url, "order")
SELECT id, 'image', url, 0
FROM dani_aw
JOIN (VALUES
  (1,'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_960_720.jpg'),
  (2,'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_960_720.jpg'),
  (3,'https://cdn.pixabay.com/photo/2018/03/10/12/00/teamwork-3213924_960_720.jpg'),
  (4,'https://cdn.pixabay.com/photo/2016/11/29/13/23/animal-1868911_960_720.jpg'),
  (5,'https://cdn.pixabay.com/photo/2016/11/29/10/41/architecture-1868668_960_720.jpg'),
  (6,'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_960_720.jpg'),
  (7,'https://cdn.pixabay.com/photo/2016/05/05/02/37/sunset-1373171_960_720.jpg'),
  (8,'https://cdn.pixabay.com/photo/2014/12/15/17/19/painting-576798_960_720.jpg')
) AS urls(rn, url) USING (rn)
ON CONFLICT DO NOTHING;

-- evan artworks
WITH evan_aw AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn FROM artworks WHERE user_id = 8
)
INSERT INTO media (artwork_id, media_type, file_url, "order")
SELECT id, 'image', url, 0
FROM evan_aw
JOIN (VALUES
  (1,'https://picsum.photos/seed/evan1/960/960'),
  (2,'https://picsum.photos/seed/evan2/960/960'),
  (3,'https://picsum.photos/seed/evan3/960/960'),
  (4,'https://picsum.photos/seed/evan4/960/960'),
  (5,'https://picsum.photos/seed/evan5/960/960'),
  (6,'https://picsum.photos/seed/evan6/960/960'),
  (7,'https://picsum.photos/seed/evan7/960/960'),
  (8,'https://picsum.photos/seed/evan8/960/960')
) AS urls(rn, url) USING (rn)
ON CONFLICT DO NOTHING;

-- ── Cross-user likes ───────────────────────────────────────────────────────────
-- Give every user a handful of likes on others' work
INSERT INTO likes (user_id, content_type, object_id)
SELECT liker, 'artwork', a.id
FROM artworks a
CROSS JOIN (VALUES (4),(5),(6),(7),(8)) AS likers(liker)
WHERE a.user_id != liker
  AND a.id % 3 != 0
ON CONFLICT DO NOTHING;

-- ── A few cross-user comments ─────────────────────────────────────────────────
INSERT INTO comments (user_id, body, content_type, object_id)
SELECT commenter, body, 'artwork', a.id
FROM artworks a
JOIN (VALUES
  (5, 'Stunning work, the light here is incredible.'),
  (6, 'Love the composition on this one!'),
  (7, 'This makes me feel things I can''t put into words.'),
  (8, 'The texture and depth here are next level.')
) AS c(commenter, body) ON a.user_id != commenter
WHERE a.id % 5 = 0
ON CONFLICT DO NOTHING;
