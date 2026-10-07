-- ═══════════════════════════════════════════════════════════════════════════
-- DV CARD — seed reference data
--
-- Safe to re-run: every insert is idempotent.
--
-- Two things live here and nowhere else:
--   1. themes  — the twenty-two layouts (section 34). They differ in STRUCTURE,
--               not just colour: the renderer branches on `layout`, `hero`,
--               `density`, `sectionStyle`, `nameStyle`, `sectionTitleStyle` and
--               `accentMode`, so switching theme genuinely changes the page.
--   2. plans   — including the `limits` column, which is the single source of
--               truth for feature gating (section 37). No limit is hardcoded in
--               application code; the UI reads this JSON.
--
-- Any key absent from a config falls back through `resolveTheme()`, so these
-- rows stay valid as new axes are added.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Themes ──────────────────────────────────────────────────────────────────

insert into themes (slug, name, category, description, is_premium, sort_order, config)
values
(
  'minimal', 'Minimal', 'general',
  'Quiet and focused. No cover image, centred identity, hairline dividers. Best for consultants and freelancers who let their work speak.',
  false, 1,
  '{
    "layout": "centered", "hero": "none", "density": "comfortable",
    "avatarShape": "circle", "avatarSize": "lg",
    "buttonStyle": "soft", "sectionStyle": "divided", "cardStyle": "flat",
    "showCover": false, "fontScale": 1,
    "palette": {
      "bg": "#ffffff", "surface": "#ffffff", "fg": "#18181b",
      "muted": "#71717a", "border": "#e4e4e7",
      "accent": "#18181b", "accentFg": "#ffffff", "accentSoft": "#f4f4f5"
    }
  }'::jsonb
),
(
  'professional', 'Professional', 'general',
  'Cover banner with a left-aligned identity and outlined actions. The default corporate look — credible without being loud.',
  false, 2,
  '{
    "layout": "banner", "hero": "cover", "density": "comfortable",
    "avatarShape": "rounded", "avatarSize": "lg",
    "buttonStyle": "outline", "sectionStyle": "card", "cardStyle": "elevated",
    "showCover": true, "fontScale": 1,
    "palette": {
      "bg": "#f8fafc", "surface": "#ffffff", "fg": "#0f172a",
      "muted": "#64748b", "border": "#e2e8f0",
      "accent": "#2563eb", "accentFg": "#ffffff", "accentSoft": "#eff6ff"
    }
  }'::jsonb
),
(
  'luxury', 'Luxury', 'general',
  'Deep charcoal with a warm gold accent, wide margins and generous type. Suits premium services, jewellery, hospitality.',
  true, 3,
  '{
    "layout": "editorial", "hero": "solid", "density": "spacious",
    "avatarShape": "circle", "avatarSize": "xl",
    "buttonStyle": "solid", "sectionStyle": "plain", "cardStyle": "outlined",
    "showCover": false, "fontScale": 1.08,
    "palette": {
      "bg": "#121212", "surface": "#1c1c1c", "fg": "#f5f5f4",
      "muted": "#a8a29e", "border": "#2e2e2e",
      "accent": "#c9a227", "accentFg": "#1c1c1c", "accentSoft": "#2a2415"
    }
  }'::jsonb
),
(
  'dark', 'Dark', 'general',
  'A high-contrast dark surface with an electric accent. Makes photography and bright product shots pop.',
  true, 4,
  '{
    "layout": "split", "hero": "gradient", "density": "comfortable",
    "avatarShape": "rounded", "avatarSize": "lg",
    "buttonStyle": "pill", "sectionStyle": "card", "cardStyle": "elevated",
    "showCover": true, "fontScale": 1,
    "palette": {
      "bg": "#0b0f19", "surface": "#141a28", "fg": "#f8fafc",
      "muted": "#94a3b8", "border": "#1f2937",
      "accent": "#22d3ee", "accentFg": "#04222a", "accentSoft": "#0e2a33"
    }
  }'::jsonb
),
(
  'creative', 'Creative', 'general',
  'Offset split hero, punchy colour and pill buttons. Built for photographers, artists and personal brands.',
  true, 5,
  '{
    "layout": "split", "hero": "gradient", "density": "comfortable",
    "avatarShape": "circle", "avatarSize": "xl",
    "buttonStyle": "pill", "sectionStyle": "divided", "cardStyle": "flat",
    "showCover": false, "fontScale": 1.05,
    "palette": {
      "bg": "#fdf4ff", "surface": "#ffffff", "fg": "#18181b",
      "muted": "#71717a", "border": "#f0e0ff",
      "accent": "#c026d3", "accentFg": "#ffffff", "accentSoft": "#fae8ff"
    }
  }'::jsonb
),
(
  'business', 'Business', 'general',
  'Compact and information-dense. Small type scale, tight rows, maximum usable space — for businesses listing many items.',
  false, 6,
  '{
    "layout": "banner", "hero": "cover", "density": "compact",
    "avatarShape": "square", "avatarSize": "md",
    "buttonStyle": "solid", "sectionStyle": "card", "cardStyle": "outlined",
    "showCover": true, "fontScale": 0.96,
    "palette": {
      "bg": "#ffffff", "surface": "#ffffff", "fg": "#111827",
      "muted": "#6b7280", "border": "#e5e7eb",
      "accent": "#059669", "accentFg": "#ffffff", "accentSoft": "#ecfdf5"
    }
  }'::jsonb
),
(
  'restaurant', 'Restaurant', 'food',
  'Warm tones, large imagery and a photo-forward menu. Built for cafés, bakeries and food businesses.',
  true, 7,
  '{
    "layout": "banner", "hero": "cover", "density": "spacious",
    "avatarShape": "circle", "avatarSize": "lg",
    "buttonStyle": "solid", "sectionStyle": "card", "cardStyle": "elevated",
    "showCover": true, "fontScale": 1.04, "imageRatio": "4/3",
    "palette": {
      "bg": "#fffbf5", "surface": "#ffffff", "fg": "#1c1917",
      "muted": "#78716c", "border": "#f0e6d8",
      "accent": "#c2410c", "accentFg": "#ffffff", "accentSoft": "#fff1e7"
    }
  }'::jsonb
),
(
  'real-estate', 'Real Estate', 'property',
  'Wide banners and large listing imagery, with a strong enquiry affordance. For brokers, builders and property consultants.',
  true, 8,
  '{
    "layout": "banner", "hero": "cover", "density": "comfortable",
    "avatarShape": "rounded", "avatarSize": "md",
    "buttonStyle": "solid", "sectionStyle": "card", "cardStyle": "outlined",
    "showCover": true, "fontScale": 1, "imageRatio": "16/9",
    "palette": {
      "bg": "#ffffff", "surface": "#f8fafc", "fg": "#0f172a",
      "muted": "#64748b", "border": "#e2e8f0",
      "accent": "#0f766e", "accentFg": "#ffffff", "accentSoft": "#f0fdfa"
    }
  }'::jsonb
),
(
  'medical', 'Medical', 'health',
  'Calm blue-green palette, high contrast and clear trust signals. Tuned for clinics, dentists, therapists and labs.',
  true, 9,
  '{
    "layout": "centered", "hero": "solid", "density": "comfortable",
    "avatarShape": "circle", "avatarSize": "lg",
    "buttonStyle": "solid", "sectionStyle": "card", "cardStyle": "elevated",
    "showCover": false, "fontScale": 1, "showTrustRow": true,
    "palette": {
      "bg": "#f7fcfc", "surface": "#ffffff", "fg": "#0f2e2a",
      "muted": "#5f7d78", "border": "#d7e9e6",
      "accent": "#0d9488", "accentFg": "#ffffff", "accentSoft": "#ecfdf9"
    }
  }'::jsonb
),
(
  'portfolio', 'Portfolio', 'general',
  'Editorial type scale with a project grid as the centre of gravity. For designers, studios and makers.',
  true, 10,
  '{
    "layout": "editorial", "hero": "none", "density": "spacious",
    "avatarShape": "square", "avatarSize": "lg",
    "buttonStyle": "outline", "sectionStyle": "plain", "cardStyle": "flat",
    "showCover": false, "fontScale": 1.12,
    "palette": {
      "bg": "#ffffff", "surface": "#fafafa", "fg": "#09090b",
      "muted": "#71717a", "border": "#e4e4e7",
      "accent": "#7c3aed", "accentFg": "#ffffff", "accentSoft": "#f5f3ff"
    }
  }'::jsonb
),

-- ── Extended catalogue ───────────────────────────────────────────────────────
--
-- Twelve more designs, bringing the catalogue to twenty-two. These lean on the
-- axes added after the first ten — `showcase` / `poster` / `ledger` / `mosaic`
-- layouts, the `photo` / `accent` heroes, the three new section styles and the
-- typographic axes (`nameStyle`, `sectionTitleStyle`, `accentMode`). Each is a
-- different page structure, not a recolour.

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


-- ── Plans ───────────────────────────────────────────────────────────────────
--
-- `limits` keys consumed by the feature gate (src/lib/plan-limits.ts):
--   max_cards, max_services, max_products, max_gallery_items,
--   max_portfolio_items, max_catalogue_items, max_team_members,
--   analytics, analytics_retention_days, custom_domain, remove_branding,
--   lead_management, catalogue, appointment_booking, upi_payments,
--   premium_themes, video, referral_access, reseller_access
--
-- Money is in paise. Prices here are the seeded defaults; an admin can change
-- them from /admin/plans and the change takes effect immediately.

insert into plans (slug, name, tagline, description, price_paise, is_custom, billing_period, features, limits, sort_order)
values
(
  'free', 'Free', 'Everything you need to get a live card.',
  'A genuinely usable card at no cost. Unlimited time, no trial countdown, and real lead capture.',
  0, false, 'annual',
  '["1 digital card","Up to 5 services","Up to 5 products","10 gallery images","Lead capture & enquiries","Appointment requests","UPI payments","QR code & downloads","Referral programme"]'::jsonb,
  '{
    "max_cards": 1, "max_services": 5, "max_products": 5,
    "max_gallery_items": 10, "max_portfolio_items": 3,
    "max_catalogue_items": 20, "max_team_members": 0,
    "analytics": true, "analytics_retention_days": 30,
    "custom_domain": false, "remove_branding": false,
    "lead_management": true, "catalogue": false,
    "appointment_booking": true, "upi_payments": true,
    "premium_themes": false, "video": false,
    "referral_access": true, "reseller_access": false
  }'::jsonb,
  1
),
(
  'starter', 'Starter', 'For freelancers building a client base.',
  'Add services, products, a catalogue and keep an eye on who is getting in touch.',
  49900, false, 'annual',
  '["3 digital cards","Unlimited services & products","50 gallery images","Digital catalogue","Custom buttons","Basic QR packs","7-day referral wallet"]'::jsonb,
  '{
    "max_cards": 3, "max_services": -1, "max_products": -1,
    "max_gallery_items": 50, "max_portfolio_items": 10,
    "max_catalogue_items": 50, "max_team_members": 0,
    "analytics": true, "analytics_retention_days": 90,
    "custom_domain": false, "remove_branding": false,
    "lead_management": true, "catalogue": true,
    "appointment_booking": true, "upi_payments": true,
    "premium_themes": false, "video": true,
    "referral_access": true, "reseller_access": false
  }'::jsonb,
  2
),
(
  'professional', 'Professional', 'For serious professionals and creators.',
  'Custom domain, deeper analytics and portfolio work. The plan most independent businesses choose.',
  99900, false, 'annual',
  '["5 digital cards","Custom domain","1-year analytics history","Portfolio & video","Premium themes","Remove DV Card branding","Unlimited catalogue","Reseller application"]'::jsonb,
  '{
    "max_cards": 5, "max_services": -1, "max_products": -1,
    "max_gallery_items": -1, "max_portfolio_items": -1,
    "max_catalogue_items": -1, "max_team_members": 0,
    "analytics": true, "analytics_retention_days": 365,
    "custom_domain": true, "remove_branding": true,
    "lead_management": true, "catalogue": true,
    "appointment_booking": true, "upi_payments": true,
    "premium_themes": true, "video": true,
    "referral_access": true, "reseller_access": true
  }'::jsonb,
  3
),
(
  'business', 'Business', 'For companies with a team.',
  'Employee cards, a company profile and the analytics to run on numbers.',
  199900, false, 'annual',
  '["10 digital cards","Company profile & team cards","15 team members","Role-based dashboards","Priority support","Custom domain","Reseller tools"]'::jsonb,
  '{
    "max_cards": 10, "max_services": -1, "max_products": -1,
    "max_gallery_items": -1, "max_portfolio_items": -1,
    "max_catalogue_items": -1, "max_team_members": 15,
    "analytics": true, "analytics_retention_days": 730,
    "custom_domain": true, "remove_branding": true,
    "lead_management": true, "catalogue": true,
    "appointment_booking": true, "upi_payments": true,
    "premium_themes": true, "video": true,
    "referral_access": true, "reseller_access": true
  }'::jsonb,
  4
),
(
  'enterprise', 'Enterprise', 'For organisations that need control.',
  'Unlimited cards and seats, white labelling, custom integrations and a named contact.',
  0, true, 'annual',
  '["Unlimited digital cards","Unlimited team members","White-label options","Custom integrations","SSO / audit exports","Named account manager","SLA"]'::jsonb,
  '{
    "max_cards": -1, "max_services": -1, "max_products": -1,
    "max_gallery_items": -1, "max_portfolio_items": -1,
    "max_catalogue_items": -1, "max_team_members": -1,
    "analytics": true, "analytics_retention_days": 1095,
    "custom_domain": true, "remove_branding": true,
    "lead_management": true, "catalogue": true,
    "appointment_booking": true, "upi_payments": true,
    "premium_themes": true, "video": true,
    "referral_access": true, "reseller_access": true
  }'::jsonb,
  5
)
on conflict (slug) do update
  set name        = excluded.name,
      tagline     = excluded.tagline,
      description = excluded.description,
      features    = excluded.features,
      limits      = excluded.limits,
      sort_order  = excluded.sort_order;


-- ── Referral programme defaults (section 28) ────────────────────────────────
-- Commission is intentionally NOT baked into application code; this row is the
-- source of truth and is editable from /admin/referrals.

update public.referral_config
   set commission_percent   = 20,
       fixed_reward_paise   = 0,
       min_payout_paise     = 50000,
       reward_validity_days = 365,
       reward_on_signup     = false,
       signup_reward_paise  = 0,
       eligible_plans       = '{starter,professional,business}'::plan_slug[]
 where id;