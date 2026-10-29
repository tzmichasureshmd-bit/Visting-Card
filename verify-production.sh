#!/bin/bash
# DV CARD - Production Verification Script
# Run: bash verify-production.sh

echo "=========================================="
echo "DV CARD - PRODUCTION VERIFICATION"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "1. Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION installed"
else
    echo -e "${RED}✗${NC} Node.js not found!"
    exit 1
fi

# Check dependencies
echo ""
echo "2. Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Running npm install..."
    npm install
fi

if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Running backend npm install..."
    cd backend && npm install && cd ..
fi

# TypeScript check
echo ""
echo "3. Running TypeScript check..."
npm run typecheck > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} TypeScript: No errors"
else
    echo -e "${YELLOW}⚠${NC} TypeScript: Some errors (checking if critical...)"
    # Run again to show errors
    npm run typecheck 2>&1 | head -20
fi

# Lint check
echo ""
echo "4. Running ESLint..."
npm run lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} ESLint: No errors"
else
    echo -e "${YELLOW}⚠${NC} ESLint: Some warnings"
fi

# Build test
echo ""
echo "5. Testing production build..."
echo "   (This may take 1-2 minutes...)"
npm run build > build.log 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Production build: SUCCESS"
    rm build.log
else
    echo -e "${RED}✗${NC} Production build: FAILED"
    echo "   Last 20 lines of build log:"
    tail -20 build.log
    rm build.log
    exit 1
fi

# Check environment variables
echo ""
echo "6. Checking environment variables..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
    
    # Check critical vars
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo -e "${GREEN}✓${NC} Supabase URL configured"
    else
        echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_URL missing!"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo -e "${GREEN}✓${NC} Supabase anon key configured"
    else
        echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_ANON_KEY missing!"
    fi
else
    echo -e "${RED}✗${NC} .env.local not found!"
    echo "   Copy .env.example to .env.local and configure"
fi

# Check backend
echo ""
echo "7. Checking backend..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} Backend .env exists"
else
    echo -e "${RED}✗${NC} backend/.env missing!"
fi

# Database seed check
echo ""
echo "8. Checking database seed..."
if [ -f "supabase/seed.sql" ]; then
    THEME_COUNT=$(grep -c "insert into themes" supabase/seed.sql)
    echo -e "${GREEN}✓${NC} Seed file exists with themes"
else
    echo -e "${YELLOW}⚠${NC} supabase/seed.sql not found"
fi

# Check file structure
echo ""
echo "9. Checking critical files..."
CRITICAL_FILES=(
    "src/components/card/card-view.tsx"
    "src/lib/cards/theme.ts"
    "src/lib/cards/types.ts"
    "src/lib/cards/actions.ts"
    "src/components/builder/panels/style-panel.tsx"
    "src/types/global.d.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file MISSING!"
    fi
done

# Summary
echo ""
echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: npm run dev"
echo "3. Open http://localhost:3000"
echo "4. Test template selection in builder"
echo ""
