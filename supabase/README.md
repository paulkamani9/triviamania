# Supabase Setup Instructions

This guide explains how to set up the Supabase database for Triviamania.

## Prerequisites

- Supabase account (free tier is sufficient)
- Supabase CLI installed (optional but recommended)

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Name:** Triviamania
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to your users
5. Click "Create new project"
6. Wait for project provisioning (~2 minutes)

## Step 2: Get Project Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

3. Create `.env.local` in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 3: Run Database Migration

### Option A: Using Supabase Dashboard (Recommended for MVP)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the contents of `/supabase/migrations/20251111_initial_schema.sql`
4. Paste into the query editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Verify success - you should see: "Success. No rows returned"

### Option B: Using Supabase CLI (Recommended for Production)

1. Install Supabase CLI:

```bash
npm install -g supabase
```

2. Link to your project:

```bash
npx supabase link --project-ref your-project-id
```

3. Run migration:

```bash
npx supabase db push
```

## Step 4: Seed Question Data

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Copy contents of `/supabase/seed.sql`
4. Paste and run
5. Verify: Go to **Table Editor** → **questions** - you should see 70 questions

## Step 5: Verify Setup

### Check Tables

Go to **Table Editor** and verify these tables exist:

- ✅ `games`
- ✅ `players`
- ✅ `questions` (should have 70 rows)
- ✅ `responses`

### Check Views

1. Go to **Database** → **Views**
2. Verify `leaderboard` view exists

### Check RLS Policies

1. Go to **Authentication** → **Policies**
2. Each table should have read/write policies enabled

### Test Connection

Run this in your terminal:

```bash
npm run dev
```

Then in your browser console:

```javascript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.from('questions').select('count');

console.log(data); // Should show count of questions
```

## Step 6: Generate TypeScript Types (Optional)

Generate exact types from your schema:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

**Note:** We've manually created types in `/types` for better documentation. Only use this if you need exact Supabase-generated types.

## Troubleshooting

### "relation does not exist" error

- Migration didn't run successfully
- Re-run the migration SQL

### "permission denied" errors

- RLS policies not set correctly
- Verify policies exist for all tables
- Check that you're using the `anon` key, not the `service_role` key in client code

### Connection timeout

- Check `.env.local` has correct URL and key
- Verify project is not paused (free tier auto-pauses after inactivity)
- Check network/firewall settings

### No questions in database

- Seed script didn't run
- Re-run `/supabase/seed.sql`

## Security Notes

1. **Never commit `.env.local`** - it's in `.gitignore`
2. **Use anon key in client** - never expose service_role key
3. **RLS is enabled** - all data access goes through Row Level Security
4. **Anonymous access** - this MVP doesn't require authentication

## Next Steps

After setup is complete:

- [ ] Connection verified
- [ ] All tables created
- [ ] Questions seeded
- [ ] RLS policies active
- [ ] Ready to build services layer (Phase 2)

## Maintenance

### Reset Database (DANGER - deletes all data)

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then re-run migration and seed
```

### Add More Questions

Just insert into the `questions` table:

```sql
INSERT INTO questions (text, category, difficulty, options, correct_answer, explanation)
VALUES (
  'Your question here?',
  'general',
  'easy',
  '["Option 1", "Option 2", "Option 3", "Option 4"]',
  0,
  'Optional explanation'
);
```

### Monitor Usage

Go to **Settings** → **Usage** to track:

- Database size
- Bandwidth
- Realtime connections

Free tier limits:

- 500 MB database
- 2 GB bandwidth
- Unlimited API requests
