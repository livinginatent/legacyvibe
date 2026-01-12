# GitHub OAuth Setup for LegacyVibe

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key

# Site URL for OAuth callbacks
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production
# NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## GitHub OAuth Scopes

The `signInWithGithub` action requests these scopes:

### ✅ `repo`
- **Purpose:** Full control of private repositories
- **Why Needed:** Allows LegacyVibe to:
  - Read repository structure and files
  - Analyze codebase for documentation
  - Generate blueprints and technical debt reports
  - Access both public and private repositories

### ✅ `read:user`
- **Purpose:** Read user profile information
- **Why Needed:** Allows LegacyVibe to:
  - Get user's GitHub username and email
  - Display user information in the dashboard
  - Associate scanned repositories with the user

## Implementation Details

### Server Action: `signInWithGithub()`

Located in: `app/auth/actions.ts`

```typescript
export async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      scopes: "repo read:user",
    },
  });

  if (data.url) {
    redirect(data.url);
  }
}
```

### Key Features:
- ✅ Uses `NEXT_PUBLIC_SITE_URL` for OAuth callback
- ✅ Requests `repo read:user` scopes (crucial for repository analysis)
- ✅ Redirects to GitHub OAuth page
- ✅ Handles callback at `/auth/callback`
- ✅ Follows api-security.md rules (no token logging)

## Supabase Configuration

### 1. Enable GitHub Provider

1. Go to Supabase Dashboard
2. Navigate to: **Authentication → Providers**
3. Enable **GitHub** provider
4. Add your GitHub OAuth App credentials

### 2. Set Callback URL

In Supabase, set the callback URL to:
```
http://localhost:3000/auth/callback
```

For production:
```
https://yourdomain.com/auth/callback
```

### 3. Create GitHub OAuth App

1. Go to GitHub: **Settings → Developer settings → OAuth Apps**
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** LegacyVibe
   - **Homepage URL:** `http://localhost:3000` (or your domain)
   - **Authorization callback URL:** `https://your-project.supabase.co/auth/v1/callback`
4. Copy **Client ID** and **Client Secret**
5. Paste them in Supabase GitHub provider settings

## Testing the Flow

### Local Development:

1. Start your app: `npm run dev`
2. Click "Continue with GitHub" on login page
3. Authorize LegacyVibe on GitHub
4. Should redirect to: `http://localhost:3000/auth/callback`
5. Callback exchanges code for session
6. Redirects to: `/dashboard`

### Verify Scopes:

After authentication, check the session token includes:
- `repo` scope for repository access
- `read:user` scope for user information

## Security Notes

🔒 **Important:**
- OAuth tokens are managed server-side only
- Never log GitHub access tokens
- Tokens stored in httpOnly cookies
- Follows api-security.md guidelines

## Troubleshooting

### "OAuth callback URL mismatch"
- Verify `NEXT_PUBLIC_SITE_URL` matches your Supabase callback URL
- Check GitHub OAuth app settings

### "Insufficient scopes"
- Ensure `repo read:user` is set in the action
- User may need to re-authorize with new scopes

### "Redirect URI mismatch"
- Supabase callback URL should be: `https://[project-ref].supabase.co/auth/v1/callback`
- Application callback in Supabase should be: `${NEXT_PUBLIC_SITE_URL}/auth/callback`

## Why These Scopes Are Crucial

LegacyVibe requires:

1. **`repo` scope** to:
   - Access repository files and structure
   - Read code for analysis
   - Generate documentation and blueprints
   - Identify technical debt patterns

2. **`read:user` scope** to:
   - Display user information
   - Associate projects with users
   - Show repository ownership

**Without these scopes, LegacyVibe cannot function properly.**

## Production Deployment

When deploying to production:

1. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

2. Update Supabase callback URL
3. Update GitHub OAuth app callback URL
4. Test the flow end-to-end
5. Verify scopes are granted

---

✅ **Setup Complete!**

Your GitHub OAuth is now configured with the correct scopes for LegacyVibe to analyze repositories.
