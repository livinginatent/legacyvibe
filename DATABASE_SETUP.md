# Database Setup for Analysis Caching

## Overview

The `analyses` table stores AI-generated repository analyses to provide instant results for previously scanned repositories.

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard:**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration:**
   - Copy the contents of `supabase/migrations/001_create_analyses_table.sql`
   - Paste it into the SQL editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify the Table:**
   - Go to "Table Editor" in the left sidebar
   - You should see a new table called `analyses`
   - Check that it has the following columns:
     - `id` (uuid, primary key)
     - `user_id` (uuid, foreign key to auth.users)
     - `repo_full_name` (text)
     - `owner` (text)
     - `repo` (text)
     - `analysis` (jsonb)
     - `analyzed_at` (timestamp)
     - `created_at` (timestamp)
     - `updated_at` (timestamp)

5. **Verify RLS Policies:**
   - Click on the `analyses` table
   - Go to the "Policies" tab
   - You should see 4 policies:
     - Users can view their own analyses
     - Users can insert their own analyses
     - Users can update their own analyses
     - Users can delete their own analyses

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Table Schema

```sql
CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_full_name text NOT NULL,
  owner text NOT NULL,
  repo text NOT NULL,
  analysis jsonb NOT NULL,
  analyzed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_user_repo UNIQUE (user_id, repo_full_name)
);
```

## How It Works

### 1. First Scan
- User clicks "START SCAN" on a repository
- API fetches code from GitHub
- Claude analyzes the codebase
- Result is saved to `analyses` table
- Result is returned to user

### 2. Subsequent Scans
- User visits the same repository scan page
- API checks for existing analysis in database
- If found, returns cached result instantly (no GitHub/Claude API calls)
- User sees a green "Cached" indicator with timestamp
- User can click "Force Rescan" to regenerate

### 3. Force Rescan
- User clicks "Force Rescan" button
- API bypasses cache and performs fresh analysis
- New result updates the existing row in database (upsert)
- User sees fresh analysis

## Features

### ✅ Instant Loading
- Cached analyses return in < 100ms
- No API costs for cached results
- Better user experience

### ✅ Cost Savings
- Avoid redundant GitHub API calls
- Avoid redundant Claude API calls
- Only pay for new analyses

### ✅ Version Control
- Each analysis has `analyzed_at` timestamp
- Users can see when analysis was performed
- Option to force refresh when needed

### ✅ Privacy & Security
- Row Level Security (RLS) enabled
- Users can only see their own analyses
- Auto-deletion when user account is deleted

## UI Features

### Analysis Info Banner
Shows at the top of results:
- **Cached**: Green indicator + "Showing cached analysis from X ago"
- **Fresh**: Cyan indicator + "Fresh analysis completed"

### Action Buttons
- **START SCAN**: Initial scan or rescan with cache
- **RESCAN**: Same as START SCAN (if result exists)
- **Force Rescan**: Bypass cache and regenerate

### Timestamp Display
- Header shows: "Cached • 5 minutes ago"
- Relative time format (minutes, hours, days ago)
- Auto-updates on page refresh

## Data Structure

The `analysis` JSON column stores:

```json
{
  "techStack": {
    "languages": ["TypeScript", "Python"],
    "frameworks": ["Next.js", "FastAPI"],
    "libraries": ["Stripe", "OpenAI"]
  },
  "featureClusters": [
    {
      "name": "The Authentication Vibe",
      "description": "Handles user logins and registrations...",
      "files": ["auth/", "login/"]
    }
  ]
}
```

## Troubleshooting

### Table doesn't exist
**Error**: `relation "public.analyses" does not exist`

**Solution**: Run the migration SQL in Supabase dashboard

### Permission denied
**Error**: `new row violates row-level security policy`

**Solution**: Make sure RLS policies are created and user is authenticated

### Unique constraint violation
**Error**: `duplicate key value violates unique constraint`

**Solution**: This is expected - the upsert will update the existing row

### Cache not working
**Check**:
1. Is the table created?
2. Are RLS policies active?
3. Is user authenticated?
4. Check browser console for API errors

## Manual Testing

### Test Cache Hit
```sql
-- Insert a test analysis
INSERT INTO public.analyses (user_id, repo_full_name, owner, repo, analysis)
VALUES (
  'your-user-id',
  'facebook/react',
  'facebook',
  'react',
  '{"techStack": {"languages": ["JavaScript"]}, "featureClusters": []}'::jsonb
);

-- Verify it exists
SELECT * FROM public.analyses WHERE repo_full_name = 'facebook/react';
```

### Test Cache Miss
```sql
-- Delete a cached analysis
DELETE FROM public.analyses WHERE repo_full_name = 'facebook/react';
```

## Future Enhancements

Potential improvements:
- [ ] Add TTL (time-to-live) for automatic cache invalidation
- [ ] Add version tracking to detect repository changes
- [ ] Add sharing capability for public analyses
- [ ] Add comparison view for before/after rescans
- [ ] Add export functionality (PDF, Markdown)
