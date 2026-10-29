# DV CARD - PRODUCTION DEPLOYMENT CHECKLIST

## PRE-DEPLOYMENT VERIFICATION

### 1. Environment Setup ✅
- [ ] `.env.local` configured with production values
- [ ] `backend/.env` configured
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] Themes seeded (22 themes)

### 2. Build & Test ✅
- [ ] `npm run typecheck` passes (or only non-critical errors)
- [ ] `npm run lint` passes (or only warnings)
- [ ] `npm run build` succeeds
- [ ] Production build tested locally
- [ ] Backend builds: `cd backend && npm run build`

### 3. Security ✅
- [ ] No secrets in source code
- [ ] `.gitignore` includes `.env*` files
- [ ] RLS policies enabled on all tables
- [ ] API endpoints require authentication where needed
- [ ] File upload validation in place
- [ ] Rate limiting configured
- [ ] CORS configured correctly

### 4. Database ✅
- [ ] Migrations applied: `supabase db push`
- [ ] Seed data loaded: `psql $DATABASE_URL < supabase/seed.sql`
- [ ] Verify themes: `SELECT COUNT(*) FROM themes;` returns 22
- [ ] Verify plans: `SELECT COUNT(*) FROM plans;` returns 4+
- [ ] Backup created
- [ ] Connection pooling configured

### 5. Performance ✅
- [ ] Images optimized (WebP/AVIF)
- [ ] Bundle size analyzed: `npm run build --analyze` (if configured)
- [ ] CDN configured (if applicable)
- [ ] Caching headers set
- [ ] Compression enabled (gzip/brotli)

---

## DEPLOYMENT STEPS

### Option A: Vercel Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all required vars

# 5. Deploy
vercel --prod
```

### Option B: VPS Deployment

```bash
# 1. SSH to server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/yourusername/dvcard.git
cd dvcard

# 3. Install dependencies
npm install
cd backend && npm install && cd ..

# 4. Setup environment
cp .env.example .env.local
# Edit .env.local with production values

# 5. Build
npm run build

# 6. Setup PM2
npm install -g pm2

# 7. Start backend
cd backend
pm2 start npm --name "dvcard-backend" -- start
cd ..

# 8. Start frontend
pm2 start npm --name "dvcard-frontend" -- start

# 9. Setup nginx reverse proxy
sudo nano /etc/nginx/sites-available/dvcard
# Configure proxy to localhost:3000

# 10. Enable site
sudo ln -s /etc/nginx/sites-available/dvcard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 11. Setup SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

### Option C: Docker Deployment

```bash
# 1. Build images
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Check logs
docker-compose logs -f
```

---

## POST-DEPLOYMENT VERIFICATION

### 1. Smoke Tests (5 minutes)

#### Frontend
- [ ] Visit homepage: https://yourdomain.com
- [ ] Homepage loads without errors
- [ ] Templates page loads: /templates
- [ ] Login page accessible: /login
- [ ] Signup page accessible: /signup

#### Backend
- [ ] Health check: https://yourdomain.com/api/health
- [ ] Status check: https://yourdomain.com/api/status
- [ ] Backend responding on port 4000

#### Database
- [ ] Can connect via Supabase dashboard
- [ ] RLS policies active
- [ ] Themes table has 22 rows

### 2. Full User Flow Test (10 minutes)

- [ ] Register new account
- [ ] Verify email (if enabled)
- [ ] Login successfully
- [ ] Dashboard loads
- [ ] Create new card
- [ ] Fill in profile details
- [ ] Select "Luxury" template
- [ ] See "✓ Saved" confirmation
- [ ] Refresh page - selection persists
- [ ] Publish card
- [ ] Copy public URL
- [ ] Open public URL in incognito
- [ ] Verify dark luxury theme renders
- [ ] Test contact buttons (WhatsApp, Call, etc.)
- [ ] Return to builder
- [ ] Change to "Spotlight" template
- [ ] Update published card
- [ ] Verify public URL shows new template

### 3. Template Persistence Test (5 minutes)

Test 5 different templates:
- [ ] Minimal (white, centered)
- [ ] Luxury (dark, gold accent)
- [ ] Spotlight (full-bleed photo)
- [ ] Business (compact, green)
- [ ] Clinic (teal, calm)

For each:
1. Select template
2. Save
3. Reload
4. Verify selection persists
5. Publish
6. Check public URL

### 4. Security Tests (5 minutes)

- [ ] Create User A with card
- [ ] Logout
- [ ] Create User B
- [ ] Try to access User A's builder URL directly
- [ ] Should be redirected or show 403/404
- [ ] Try to access User A's analytics
- [ ] Should be forbidden
- [ ] Test API endpoints without auth token
- [ ] Should return 401 Unauthorized

### 5. Performance Tests (5 minutes)

Use Google PageSpeed Insights or Lighthouse:
- [ ] Homepage: Target LCP < 2.5s
- [ ] Dashboard: Target LCP < 2.5s  
- [ ] Public card: Target LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Overall score > 80

### 6. Cross-Browser Tests (5 minutes)

Test in:
- [ ] Chrome (Desktop)
- [ ] Safari (Desktop)
- [ ] Firefox (Desktop)
- [ ] Chrome (Mobile)
- [ ] Safari (iOS)

Check:
- [ ] Homepage renders
- [ ] Builder loads
- [ ] Template selection works
- [ ] Public cards display correctly

### 7. Mobile Responsive Tests (5 minutes)

Test on actual devices or DevTools:
- [ ] iPhone 12/13/14 (375px)
- [ ] iPhone 12/13/14 Pro Max (428px)
- [ ] Samsung Galaxy S21 (360px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)

Verify:
- [ ] Template gallery responsive
- [ ] Builder panels stack correctly
- [ ] Preview looks good
- [ ] Public cards readable

---

## MONITORING SETUP

### 1. Error Tracking
- [ ] Sentry/Bugsnag configured
- [ ] Error reporting tested
- [ ] Alerts configured

### 2. Analytics
- [ ] Google Analytics installed (if using)
- [ ] Custom events tracked
- [ ] Conversion funnels set up

### 3. Uptime Monitoring
- [ ] UptimeRobot/Pingdom configured
- [ ] Alert contacts added
- [ ] Check interval: 5 minutes

### 4. Performance Monitoring
- [ ] Vercel Analytics (if on Vercel)
- [ ] New Relic/Datadog (if on VPS)
- [ ] Core Web Vitals tracking

### 5. Database Monitoring
- [ ] Supabase dashboard alerts
- [ ] Query performance monitoring
- [ ] Connection pool monitoring
- [ ] Disk space alerts

---

## ROLLBACK PLAN

If critical issues found:

### Immediate Rollback
```bash
# Vercel
vercel rollback

# VPS with PM2
pm2 stop dvcard-frontend
pm2 start dvcard-frontend-old

# Docker
docker-compose down
docker-compose -f docker-compose.old.yml up -d
```

### Database Rollback
```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup.sql

# Or rollback migration
supabase db reset
```

---

## POST-LAUNCH TASKS (First 24 Hours)

### Hour 1-2: Critical Monitoring
- [ ] Watch error logs
- [ ] Monitor performance
- [ ] Check user registrations
- [ ] Verify card creation flow

### Hour 2-6: User Feedback
- [ ] Monitor support channels
- [ ] Check social media mentions
- [ ] Review user feedback
- [ ] Document issues

### Hour 6-24: Analysis
- [ ] Review analytics
- [ ] Check conversion rates
- [ ] Analyze bounce rates
- [ ] Identify bottlenecks

### Day 2-7: Optimization
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Improve UX based on feedback
- [ ] A/B test improvements

---

## DOCUMENTATION

### User-Facing
- [ ] Getting started guide
- [ ] Template selection guide
- [ ] Customization tutorial
- [ ] FAQ updated
- [ ] Video tutorials (if planned)

### Developer-Facing
- [ ] API documentation
- [ ] Database schema docs
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Contributing guidelines

---

## LEGAL & COMPLIANCE

- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie consent implemented (if EU users)
- [ ] GDPR compliance verified (if applicable)
- [ ] Data retention policy documented
- [ ] Backup procedures documented

---

## SUPPORT READINESS

- [ ] Support email configured
- [ ] Help documentation published
- [ ] Common issues documented
- [ ] Support team trained
- [ ] Escalation process defined

---

## SUCCESS METRICS

Define and track:
- [ ] User registrations per day
- [ ] Card creation rate
- [ ] Template selection distribution
- [ ] Public card views
- [ ] Conversion rate (free → paid)
- [ ] User retention (7-day, 30-day)
- [ ] Average session duration
- [ ] Error rate < 0.1%
- [ ] Uptime > 99.9%

---

## CONTINGENCY CONTACTS

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Lead Developer | [Name] | [Email/Phone] | 24/7 |
| DevOps | [Name] | [Email/Phone] | 24/7 |
| Database Admin | [Name] | [Email/Phone] | On-call |
| Support Lead | [Name] | [Email/Phone] | Business hours |

---

## SIGN-OFF

- [ ] Technical Lead Approval: _________________ Date: _______
- [ ] Product Owner Approval: _________________ Date: _______
- [ ] Security Review Complete: _________________ Date: _______
- [ ] QA Sign-off: _________________ Date: _______

---

**DEPLOYMENT STATUS: READY ✅**

Last Updated: October 29, 2026
Version: 1.0.0
Environment: Production
