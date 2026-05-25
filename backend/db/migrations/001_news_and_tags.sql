-- Add category column to news_articles (idempotent)
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS "category" VARCHAR(50) DEFAULT 'NEWS';

-- Seed news articles
INSERT INTO news_articles (title, source_name, url, image_url, description, category, published_at)
VALUES
  (
    'Modern Art Gallery Opens Downtown',
    'ArtWorld Magazine',
    'https://artworldmag.example.com/gallery-opens-downtown',
    'https://cdn.pixabay.com/photo/2016/11/29/03/53/architecture-1867187_960_720.jpg',
    'A new contemporary art space showcases emerging artists working across painting, sculpture, and digital media. The gallery opens its doors this weekend with a group show featuring fifteen up-and-coming creators.',
    'EXHIBITION',
    NOW() - INTERVAL '3 days'
  ),
  (
    'Artist Spotlight: Digital Renaissance',
    'CreativePulse',
    'https://creativepulse.example.com/digital-renaissance',
    'https://cdn.pixabay.com/photo/2018/03/10/12/00/teamwork-3213924_960_720.jpg',
    'We sit down with leading digital artists to discuss the intersection of technology and fine art. From AI-assisted painting to immersive VR installations, the conversation covers where creativity is heading next.',
    'INTERVIEW',
    NOW() - INTERVAL '5 days'
  ),
  (
    '2025 Art Market Trends to Watch',
    'Art Business Today',
    'https://artbusiness.example.com/2025-trends',
    'https://cdn.pixabay.com/photo/2017/08/01/08/29/woman-2563491_960_720.jpg',
    'Analysis of the biggest trends shaping the art world this year: the rise of independent digital platforms, shifting collector demographics, and how social media is redefining artist discovery.',
    'TRENDS',
    NOW() - INTERVAL '7 days'
  ),
  (
    'Mastering Color Theory for Digital Artists',
    'Artistry Blog',
    'https://artistry.example.com/color-theory',
    'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_960_720.jpg',
    'Essential tips for working with color in digital art. Understand hue relationships, build harmonious palettes, and learn how color temperature affects mood and composition.',
    'TECHNIQUE',
    NOW() - INTERVAL '10 days'
  ),
  (
    'International Digital Art Fair Announced for 2026',
    'The Art Gazette',
    'https://artgazette.example.com/idaf-2026',
    'https://cdn.pixabay.com/photo/2016/11/29/09/32/concept-1868728_960_720.jpg',
    'Organizers have confirmed a major international digital art fair scheduled for early 2026, bringing together galleries, collectors, and independent creators from over forty countries.',
    'NEWS',
    NOW() - INTERVAL '12 days'
  ),
  (
    'Starting Your Art Collection: A Beginner''s Guide',
    'Collect Wisely',
    'https://collectwisely.example.com/beginners-guide',
    'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_960_720.jpg',
    'A practical guide to building your first art collection on any budget. Covers what to look for in emerging artists, how to evaluate prints vs. originals, and where to find works that will hold long-term value.',
    'GUIDE',
    NOW() - INTERVAL '14 days'
  ),
  (
    'How Streaming Changed the Podcast Art Scene',
    'Sound & Vision',
    'https://soundvision.example.com/podcast-art',
    'https://cdn.pixabay.com/photo/2018/01/14/23/12/nature-3082832_960_720.jpg',
    'Original cover art has become a serious career path for illustrators. We explore how podcast networks commission visual identities and what artists charge for bespoke cover design work.',
    'INDUSTRY',
    NOW() - INTERVAL '16 days'
  ),
  (
    'Building a Portfolio That Actually Gets Commissions',
    'Artistry Blog',
    'https://artistry.example.com/portfolio-tips',
    'https://cdn.pixabay.com/photo/2017/01/18/16/46/hong-kong-1990268_960_720.jpg',
    'Portfolio curation advice from art directors and agency buyers. Discover which pieces to lead with, how many projects to show, and the one mistake most artists make on their about page.',
    'GUIDE',
    NOW() - INTERVAL '20 days'
  )
ON CONFLICT (url) DO NOTHING;
