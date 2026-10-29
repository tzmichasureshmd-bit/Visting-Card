# DV CARD - QUICK START GUIDE

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Supabase account)
- Git

---

## Step 1: Clone & Install (2 minutes)

```bash
# Clone repository
git clone <your-repo-url>
cd dvcard

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

---

## Step 2: Configure Environment (2 minutes)

### Frontend Environment

```bash
# Copy example to actual file
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

Required values:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Backend Environment

```bash
# Copy backend env
cp backend/.env.example backend/.env

# Edit backend/.env
nano backend/.env
```

Required values:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=4000
JWT_SECRET=your-random-secret-here
```

---

## Step 3: Setup Database (1 minute)

```bash
# Apply migrations
npx supabase db push

# OR if using direct PostgreSQL
psql $DATABASE_URL < supabase/migrations/0001_schema.sql

# Seed themes and plans
psql $DATABASE_URL < supabase/seed.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM themes;  -- Should return 22
SELECT COUNT(*) FROM plans;   -- Should return 4+
```

---

## Step 4: Start Servers (30 seconds)

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

**Expected output:**
```
✓ running on http://localhost:4000
✓ database connected
```

### Terminal 2: Frontend
```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 16.3.8 (Turbopack)
- Local:    http://localhost:3000
✓ Ready in 2.3s
```

---

## Step 5: Test It! (30 seconds)

1. **Open browser:** http://localhost:3000
2. **Register account:** Click "Sign Up"
3. **Create card:** Fill in your details
4. **Select template:** Choose "Luxury"
5. **See confirmation:** "✓ Saved" appears
6. **Refresh page:** Luxury still selected ✅

---

## 🎯 Quick Verification

Run the automated verification script:

**Windows:**
```powershell
./verify-production.ps1
```

**Mac/Linux:**
```bash
bash verify-production.sh
```

**Expected output:**
```
✓ Node.js installed
✓ Dependencies installed
✓ TypeScript: No errors
✓ Production build: SUCCESS
```

---

## 🐛 Common Issues

### Issue: "Database connection failed"
**Fix:**
```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: "Supabase anon key invalid"
**Fix:**
1. Go to Supabase dashboard
2. Settings → API
3. Copy correct anon key
4. Update `.env.local`
5. Restart dev server

### Issue: "No themes showing"
**Fix:**
```bash
# Re-run seed
psql $DATABASE_URL < supabase/seed.sql

# Verify
psql $DATABASE_URL -c "SELECT slug, name FROM themes;"
```

### Issue: "Port 3000 already in use"
**Fix:**
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Issue: "Module not found"
**Fix:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Same for backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

1. **Explore templates:** Visit http://localhost:3000/templates
2. **Read docs:** See `IMPLEMENTATION_COMPLETE.md`
3. **Run tests:** `npx playwright test tests/smoke.test.ts`
4. **Deploy:** Follow `DEPLOYMENT_CHECKLIST.md`

---

## 🆘 Need Help?

- **Documentation:** See `/docs` folder
- **Issues:** Check GitHub issues
- **Email:** support@yourdomain.com

---

## 📊 Verify Everything Works

### Quick Test Checklist
- [ ] Homepage loads
- [ ] Can register account
- [ ] Can create card
- [ ] Can select template
- [ ] Template persists after refresh
- [ ] Can publish card
- [ ] Public URL works
- [ ] Correct template shows on public URL

**All checked? You're ready to go! 🎉**

---

*Need production deployment? See `DEPLOYMENT_CHECKLIST.md`*
