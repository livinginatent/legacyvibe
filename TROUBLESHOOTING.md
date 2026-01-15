# Cadracode Troubleshooting Guide

## "GitHub App not connected" Error (400 Bad Request)

### Problem

When clicking "START SCAN", you get an error saying "GitHub App not connected."

### Root Cause

The `installationId` is missing because:

1. You haven't connected your GitHub account yet, OR
2. You haven't installed the GitHub App on any repositories

### Solution

#### Step 1: Connect GitHub Account

1. Go to the dashboard: `http://localhost:3000/dashboard`
2. You should see "Connect Your Repositories" section
3. Click the **"Connect GitHub"** button
4. This will redirect you to GitHub

#### Step 2: Install & Configure GitHub App

1. On GitHub, you'll see the Cadracode app installation page
2. Select **which repositories** you want to grant access to:
   - Option A: All repositories
   - Option B: Select specific repositories (recommended)
3. Click **"Install & Authorize"**
4. You'll be redirected back to the dashboard

#### Step 3: Verify Installation

1. After redirect, the dashboard should now show your repositories in a table
2. Each repository will have a **"SCAN"** button
3. The `installationId` is now stored in your user metadata

#### Step 4: Scan a Repository

1. Click the **"SCAN"** button next to any repository
2. On the scan page, click **"START SCAN"**
3. Watch the progress bar as AI analyzes your code!

---

## Common Errors & Solutions

### Error: "this.octokit.request is not a function"

**Fixed in latest code.** This was caused by `getInstallationOctokit` returning a Promise that wasn't being awaited.

### Error: "GitHub App credentials not configured"

**Solution:** Check your `.env.local` file has:

```bash
GITHUB_APP_ID=your-app-id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----"
```

### Error: "AI service not configured"

**Solution:** Add Claude API key to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### Error: "Failed to crawl repository structure"

**Possible causes:**

1. Repository is private and GitHub App doesn't have access
2. Repository doesn't exist or name is misspelled
3. GitHub App permissions are insufficient

**Solution:**

- Reinstall the GitHub App with proper repository access
- Make sure repository name format is `owner/repo-name`
- Check GitHub App has "Contents: Read" permission

### Repositories Not Showing on Dashboard

**Possible causes:**

1. GitHub App not installed yet
2. No repositories selected during installation
3. `installationId` not saved properly

**Solution:**

1. Click "Manage Repos" button on dashboard
2. Add/modify repository access on GitHub
3. Refresh dashboard to see updated list

---

## Environment Variables Checklist

Make sure your `.env.local` has all these:

```bash
# ✅ Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJxxx...

# ✅ Base URLs (Required)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ✅ GitHub App (Required for repository access)
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...your key...
-----END RSA PRIVATE KEY-----"

# ✅ Claude API (Required for scanning)
ANTHROPIC_API_KEY=sk-ant-api03-xxx...
```

---

## Debug Checklist

When things aren't working:

1. **Check browser console** (F12) for client-side errors
2. **Check server terminal** for API errors
3. **Verify environment variables** are loaded (restart dev server after changes)
4. **Check GitHub App installation** on GitHub Settings > Applications
5. **Verify Supabase authentication** - make sure you're logged in
6. **Test GitHub API access** - try viewing repos in dashboard first

---

## Quick Test Steps

### Test 1: Authentication Works

- [ ] Can register/login with email
- [ ] Can access /dashboard route
- [ ] See dashboard UI (not "Connect Your Repositories")

### Test 2: GitHub Connection Works

- [ ] "Connect GitHub" button exists
- [ ] Clicking redirects to GitHub
- [ ] After install, returns to dashboard
- [ ] Repositories appear in table

### Test 3: Scanning Works

- [ ] "SCAN" button appears on repos
- [ ] Clicking opens `/dashboard/scan/[repo]` page
- [ ] "START SCAN" button is enabled
- [ ] Progress bar shows when scanning
- [ ] Results display in two columns

---

## Still Having Issues?

1. Clear browser cache and cookies
2. Restart the Next.js dev server
3. Check that all npm packages are installed (`npm install`)
4. Verify Node.js version is 18+
5. Verify GitHub App permissions are correctly configured
