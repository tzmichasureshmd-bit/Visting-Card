-- ─────────────────────────────────────────────────────────────────────────────
-- DV CARD — 0008 extended theme catalogue
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Why this is a migration and not just seed data
-- ---------------------------------------------
-- `supabase/seed.sql` only ever runs on a fresh `supabase db reset`. Anyone who
-- already deployed 0001–0007 has ten themes in their `themes` table and would
-- never see the twelve below, no matter how often the seed is re-applied. Theme
-- rows are reference data that the public catalogue reads directly, so shipping
-- them as a migration is the only way an existing database gets them.
--
-- What makes these different designs
-- -----------------------------------
-- The point of the catalogue is structural difference, not recolouring. Each row
-- below sets at least one axis that changes how the page is COMPOSED:
--
--   layout            centered | banner | split | editorial
--                     showcase | poster | ledger | mosaic
--   hero              none | cover | solid | gradient | photo | accent
--   sectionStyle      card | divided | plain | panel
--   nameStyle         normal | caps | serif
--   sectionTitleStyle plain | caps | rule | underline
--   accentMode        bold | tint | line
--
-- `resolveTheme()` in src/lib/cards/theme.ts fills in anything a row omits, so a
-- config written against the first ten remains valid here — and these rows stay
-- valid when another axis is added later. No application code changes to ship
-- this; the renderer already branches on all of the above.
--
-- Idempotent: `on conflict (slug) do update` refreshes the config in place, which
-- matters because these rows are the source of truth for the /templates gallery
-- and for anyone who has already picked one of these themes by hand.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.themes (slug, name, category, description, is_premium, sort_order, config)
values
(
  'spotlight', 'Spotlight', 'creative',
  'Full-bleed photo hero with the identity layered over it and the actions first. The highest-impact choice for photographers and personal brands.',
  true, 11,
  '{
    "layout": "showcase", "hero": "photo", "density": "spacious",
    "avatarShape": "circle", "avatarSize": "xl",
    "buttonStyle": "solid", "sectionStyle": "plain", "cardStyle": "flat",
    "nameStyle": "normal", "sectionTitleStyle": "caps", "accentMode": "bold",
    "showCover": true, "showTrustRow": false, "imageRatio": "16/9", "fontScale": 1.05,
    "palette": {
      "bg": "#0a0a0a", "surface": "#171717", "fg": "#fafafa",
      "muted": "#a1a1aa", "border": "#262626",
      "accent": "#f59e0b", "accentFg": "#1a1408", "accentSoft": "#241c0e"
    }
  }'::jsonb
),
(
  'gallery', 'Gallery', 'creative',
  'Showcase layout tuned for visual work: wide imagery, muted section headings and generous spacing so the pictures lead.',
  true, 12,
  '{
    "layout": "showcase", "hero": "photo", "density": "spacious",
    "avatarShape": "square", "avatarSize": "lg",
    "buttonStyle": "outline", "sectionStyle": "plain", "cardStyle": "outlined",
    "nameStyle": "serif", "sectionTitleStyle": "caps", "accentMode": "tint",
    "showCover": true, "showTrustRow": false, "imageRatio": "16/9", "fontScale": 1.02,
    "palette": {
      "bg": "#ffffff", "surface": "#fafaf9", "fg": "#1c1917",
      "muted": "#78716c", "border": "#e7e5e4",
      "accent": "#0f766e", "accentFg": "#ffffff", "accentSoft": "#f0fdfa"
    }
  }'::jsonb
),
(
  'poster', 'Poster', 'creative',
  'The name set as the artwork at display size, with the photo demoted. For people whose name is the brand.',
  false, 13,
  '{
    "layout": "poster", "hero": "none", "density": "spacious",
    "avatarShape": "circle", "avatarSize": "md",
    "buttonStyle": "soft", "sectionStyle": "plain", "cardStyle": "flat",
    "nameStyle": "serif", "sectionTitleStyle": "rule", "accentMode": "line",
    "showCover": false, "showTrustRow": false, "imageRatio": "4/3", "fontScale": 1.15,
    "palette": {
      "bg": "#fffdf8", "surface": "#ffffff", "fg": "#14110c",
      "muted": "#7a7266", "border": "#e8e0d2",
      "accent": "#b45309", "accentFg": "#ffffff", "accentSoft": "#fdf6e9"
    }
  }'::jsonb
),
(
  'masthead', 'Masthead', 'editorial',
  'All-caps name with wide tracking over a hairline rule. Reads like a newspaper byline — editorial, deliberate, unhurried.',
  false, 14,
  '{
    "layout": "poster", "hero": "none", "density": "comfortable",
    "avatarShape": "square", "avatarSize": "md",
    "buttonStyle": "outline", "sectionStyle": "divided", "cardStyle": "flat",
    "nameStyle": "caps", "sectionTitleStyle": "caps", "accentMode": "line",
    "showCover": false, "showTrustRow": false, "imageRatio": "16/9", "fontScale": 1.1,
    "palette": {
      "bg": "#ffffff", "surface": "#ffffff", "fg": "#111111",
      "muted": "#6b6b6b", "border": "#d9d9d9",
      "accent": "#dc2626", "accentFg": "#ffffff", "accentSoft": "#fef2f2"
    }
  }'::jsonb
),
(
  'ledger', 'Ledger', 'business',
  'Dense single-row identity closed by an accent rule. Built for people who list a lot and want it all reachable fast.',
  false, 15,
  '{
    "layout": "ledger", "hero": "none", "density": "compact",
    "avatarShape": "square", "avatarSize": "md",
    "buttonStyle": "solid", "sectionStyle": "divided", "cardStyle": "outlined",
    "nameStyle": "normal", "sectionTitleStyle": "caps", "accentMode": "bold",
    "showCover": false, "showTrustRow": false, "imageRatio": "4/3", "fontScale": 0.98,
    "palette": {
      "bg": "#ffffff", "surface": "#f8fafc", "fg": "#0f172a",
      "muted": "#64748b", "border": "#cbd5e1",
      "accent": "#1d4ed8", "accentFg": "#ffffff", "accentSoft": "#eff6ff"
    }
  }'::jsonb
),
(
  'bento', 'Bento', 'product',
  'A compact identity followed by sections on a two-column bento grid. Good for a card that mixes short sections and long ones.',
  true, 16,
  '{
    "layout": "mosaic", "hero": "none", "density": "compact",
    "avatarShape": "rounded", "avatarSize": "md",
    "buttonStyle": "soft", "sectionStyle": "panel", "cardStyle": "elevated",
    "nameStyle": "normal", "sectionTitleStyle": "caps", "accentMode": "bold",
    "showCover": false, "showTrustRow": false, "imageRatio": "16/9", "fontScale": 1,
    "palette": {
      "bg": "#f8fafc", "surface": "#ffffff", "fg": "#0f172a",
      "muted": "#64748b", "border": "#e2e8f0",
      "accent": "#7c3aed", "accentFg": "#ffffff", "accentSoft": "#f5f3ff"
    }
  }'::jsonb
),
(
  'mosaic-dark', 'Mosaic Dark', 'product',
  'The bento grid on a dark surface with a cyan edge. Compact, technical, and easy to scan on a phone.',
  true, 17,
  '{
    "layout": "mosaic", "hero": "none", "density": "comfortable",
    "avatarShape": "rounded", "avatarSize": "md",
    "buttonStyle": "pill", "sectionStyle": "panel", "cardStyle": "flat",
    "nameStyle": "normal", "sectionTitleStyle": "caps", "accentMode": "bold",
    "showCover": false, "showTrustRow": false, "imageRatio": "4/3", "fontScale": 1,
    "palette": {
      "bg": "#09090b", "surface": "#18181b", "fg": "#fafafa",
      "muted": "#a1a1aa", "border": "#27272a",
      "accent": "#22d3ee", "accentFg": "#083344", "accentSoft": "#0e2a33"
    }
  }'::jsonb
),
(
  'atelier', 'Atelier', 'luxury',
  'A tall accent band over a spaced, serif-led identity with outlined actions. For studios and high-end services.',
  true, 18,
  '{
    "layout": "banner", "hero": "accent", "density": "spacious",
    "avatarShape": "circle", "avatarSize": "xl",
    "buttonStyle": "outline", "sectionStyle": "plain", "cardStyle": "outlined",
    "nameStyle": "serif", "sectionTitleStyle": "rule", "accentMode": "tint",
    "showCover": false, "showTrustRow": true, "imageRatio": "4/3", "fontScale": 1.1,
    "palette": {
      "bg": "#faf7f2", "surface": "#ffffff", "fg": "#1c1917",
      "muted": "#79716b", "border": "#e7ded2",
      "accent": "#8b5e3c", "accentFg": "#ffffff", "accentSoft": "#f4ece2"
    }
  }'::jsonb
),
(
  'noir', 'Noir', 'luxury',
  'Near-black with a single hairline accent and no accent tint anywhere in the copy. As restrained as a card gets.',
  true, 19,
  '{
    "layout": "editorial", "hero": "none", "density": "spacious",
    "avatarShape": "circle", "avatarSize": "xl",
    "buttonStyle": "outline", "sectionStyle": "divided", "cardStyle": "outlined",
    "nameStyle": "serif", "sectionTitleStyle": "underline", "accentMode": "line",
    "showCover": false, "showTrustRow": false, "imageRatio": "4/3", "fontScale": 1.14,
    "palette": {
      "bg": "#0b0b0c", "surface": "#131314", "fg": "#f5f5f4",
      "muted": "#8f8d88", "border": "#26262a",
      "accent": "#e7c37a", "accentFg": "#14140f", "accentSoft": "#1e1c16"
    }
  }'::jsonb
),
(
  'clinic', 'Clinic', 'health',
  'Calm teal on a soft white, with a trust row and underlined headings. Reads as reassurance before a first appointment.',
  false, 20,
  '{
    "layout": "split", "hero": "solid", "density": "comfortable",
    "avatarShape": "circle", "avatarSize": "lg",
    "buttonStyle": "solid", "sectionStyle": "card", "cardStyle": "elevated",
    "nameStyle": "normal", "sectionTitleStyle": "underline", "accentMode": "bold",
    "showCover": false, "showTrustRow": true, "imageRatio": "4/3", "fontScale": 1,
    "palette": {
      "bg": "#f6fbfb", "surface": "#ffffff", "fg": "#0f2e2a",
      "muted": "#5f7d78", "border": "#d7e9e6",
      "accent": "#0d9488", "accentFg": "#ffffff", "accentSoft": "#ecfdf9"
    }
  }'::jsonb
),
(
  'kiosk', 'Kiosk', 'food',
  'Warm, saturated and photo-forward with pill actions and generous spacing. Built for a counter, a café or a bakery.',
  true, 21,
  '{
    "layout": "banner", "hero": "photo", "density": "spacious",
    "avatarShape": "circle", "avatarSize": "xl",
    "buttonStyle": "pill", "sectionStyle": "card", "cardStyle": "elevated",
    "nameStyle": "normal", "sectionTitleStyle": "caps", "accentMode": "bold",
    "showCover": true, "showTrustRow": false, "imageRatio": "4/3", "fontScale": 1.06,
    "palette": {
      "bg": "#fffaf3", "surface": "#ffffff", "fg": "#292524",
      "muted": "#78716c", "border": "#f3e3cd",
      "accent": "#ea580c", "accentFg": "#ffffff", "accentSoft": "#fff1e3"
    }
  }'::jsonb
),
(
  'estate', 'Estate', 'property',
  'Wide 16:9 imagery with underlined headings and a muted accent. Laid out to make a listing feel like a brochure.',
  true, 22,
  '{
    "layout": "banner", "hero": "photo", "density": "comfortable",
    "avatarShape": "rounded", "avatarSize": "lg",
    "buttonStyle": "solid", "sectionStyle": "card", "cardStyle": "outlined",
    "nameStyle": "normal", "sectionTitleStyle": "underline", "accentMode": "tint",
    "showCover": true, "showTrustRow": true, "imageRatio": "16/9", "fontScale": 1.02,
    "palette": {
      "bg": "#ffffff", "surface": "#f8fafc", "fg": "#0f172a",
      "muted": "#64748b", "border": "#e2e8f0",
      "accent": "#0f766e", "accentFg": "#ffffff", "accentSoft": "#f0fdfa"
    }
  }'::jsonb
)
on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      category    = excluded.category,
      is_premium  = excluded.is_premium,
      sort_order  = excluded.sort_order,
      config      = excluded.config;

-- `is_active` is deliberately NOT in the update list above. An admin may have
-- switched one of these off; re-running this migration must not silently put it
-- back in the catalogue, because `themes` is read by the public /templates page.