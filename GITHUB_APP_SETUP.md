# GitHub App Setup Guide

This guide will help you set up the Cadracode GitHub App for repository analysis.

## Prerequisites

- A GitHub account
- Access to create GitHub Apps (personal account or organization)

## Step-by-Step Setup

### 1. Create a New GitHub App

1. Go to https://github.com/settings/apps/new
2. Fill in the basic information:
   - **GitHub App name**: `Cadracode` (or `Cadracode-Dev` for local testing)
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Setup URL**: `http://localhost:3000/dashboard`
   - **Callback URL**: Leave this blank (we're not using OAuth callbacks)

### 2. Configure Permissions

Under "Repository permissions":

- **Contents**: Read-only
- **Metadata**: Read-only (automatically selected)

### 3. Configure Post Installation

- **Redirect on update**: Check this box
- **Setup URL**: `http://localhost:3000/dashboard`

### 4. Subscribe to Events

You can skip this section.

### 5. Installation Options

- Select **"Only on this account"** or **"Any account"** depending on your needs

### 6. Create the App

Click **"Create GitHub App"** button.

### 7. Generate Private Key

1. After creation, you'll be on the app settings page
2. Scroll down to **"Private keys"** section
3. Click **"Generate a private key"**
4. A `.pem` file will be downloaded to your computer
5. Keep this file safe and secure!

### 8. Get Your App ID

1. On the same settings page, look for **"App ID"** near the top
2. Copy this number (it's usually 6 digits)

## Environment Variables Setup

Add these to your `.env.local` file:

```env
# GitHub App Configuration
GITHUB_APP_ID=123456

# For the private key, you have two options:

# Option 1: Inline (Replace newlines with \n)
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...your_key_here...==\n-----END RSA PRIVATE KEY-----"

# Option 2: Base64 encoded
# First, encode your private key file:
# cat your-private-key.pem | base64
# Then add it like this:
GITHUB_PRIVATE_KEY_BASE64="LS0tLS1CRUdJTi..."
```

### Private Key Format Notes

**Important**: The private key must be formatted correctly:

1. **Keep the BEGIN and END lines**:

   ```
   -----BEGIN RSA PRIVATE KEY-----
   ...
   -----END RSA PRIVATE KEY-----
   ```

2. **For inline format**, replace all newlines with `\n`:

   ```
   "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"
   ```

3. **Use quotes** around the entire private key string

## Testing the Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Click **"Continue with GitHub"** on the login page

4. You should be redirected to GitHub to install the Cadracode app

5. Select the repositories you want to grant access to

6. After installation, you'll be redirected back to `/dashboard`

7. You should see your authorized repositories listed under "AVAILABLE ASSETS"

## Troubleshooting

### "GitHub App credentials not configured"

- Make sure `GITHUB_APP_ID` and `GITHUB_PRIVATE_KEY` are set in `.env.local`
- Restart your Next.js dev server after adding environment variables

### "Failed to fetch repositories"

- Check that your private key is formatted correctly (with `\n` for newlines)
- Verify the App ID is correct
- Ensure the app has "Contents: Read" permission

### "GitHub App not installed"

- The user hasn't completed the GitHub App installation flow
- Or the `installation_id` wasn't saved properly
- Try reinstalling the app from the login page

### Repository permissions issues

- Go to GitHub Settings > Applications > Cadracode
- Click "Configure"
- Verify the correct repositories are selected

## Production Deployment

When deploying to production:

1. Update the **Homepage URL** and **Setup URL** in your GitHub App settings to your production domain
2. Update `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_SITE_URL` in your production environment variables
3. Ensure the private key is securely stored (use environment variable secrets in your hosting platform)
4. **Never commit** your `.env.local` file or expose the private key in client-side code

## Security Best Practices

✅ **DO:**

- Store private keys in environment variables
- Use server-side only code for GitHub API calls
- Keep private keys in `.env.local` (gitignored)
- Rotate private keys periodically

❌ **DON'T:**

- Commit private keys to version control
- Log private keys or access tokens
- Expose private keys in client-side code
- Share private keys via insecure channels

## Additional Resources

- [GitHub Apps Documentation](https://docs.github.com/en/developers/apps/getting-started-with-apps)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [Creating a GitHub App](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app)
