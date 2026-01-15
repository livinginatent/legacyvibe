# Cadracode Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- A GitHub account
- An Anthropic API account (for Claude)

## Environment Setup

1. **Copy the environment template:**

   ```bash
   cp .env.example .env.local
   ```

2. **Configure Supabase:**

   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project or select existing one
   - Go to Settings > API
   - Copy the `URL` to `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
   - Copy the `anon public` key to `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
   - Copy the `service_role` key to `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (⚠️ Keep this secret!)

3. **Configure GitHub App:**

   - Go to [GitHub Apps](https://github.com/settings/apps/new)
   - Create a new GitHub App with:
     - **Name**: Cadracode (or your preferred name)
     - **Homepage URL**: `http://localhost:3000`
     - **Callback URL**: `http://localhost:3000/auth/callback`
     - **Setup URL**: `http://localhost:3000/dashboard`
     - **Permissions**:
       - Repository > Contents: Read-only
       - Repository > Metadata: Read-only
   - After creation:
     - Note your **App ID**
     - Generate a **Private Key** (download the .pem file)
     - Copy the entire private key content to `GITHUB_PRIVATE_KEY` in `.env.local`
   - Install the app on your personal account or organization

4. **Configure Claude API:**
   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Create an API key
   - Add it to `ANTHROPIC_API_KEY` in `.env.local`

## Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Flow

1. **Register/Login:**

   - Use email and password to create an account
   - Verify your email via the link sent to your inbox

2. **Connect GitHub:**

   - On the dashboard, click "Connect GitHub"
   - Select repositories you want to analyze
   - GitHub will redirect you back to the dashboard

3. **Scan a Repository:**
   - Click the "SCAN" button next to any repository
   - Watch the AI analyze your codebase in real-time
   - View Feature Clusters and Tech Stack analysis

## Troubleshooting

### "GitHub App not connected"

- Make sure you've installed the GitHub App and selected at least one repository
- Check that `GITHUB_APP_ID` and `GITHUB_PRIVATE_KEY` are correctly set

### "AI service not configured"

- Verify `ANTHROPIC_API_KEY` is set in `.env.local`
- Ensure your API key is valid and has credits

### "Failed to crawl repository"

- Check that the repository is accessible
- Verify the GitHub App has permissions to read repository contents
- Try reinstalling the GitHub App with proper permissions

## Production Deployment

When deploying to production (Vercel, Railway, etc.):

1. Update `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_SITE_URL` to your production domain
2. Update GitHub App URLs to use your production domain
3. Ensure all environment variables are set in your hosting platform
4. Enable Supabase authentication in production mode
