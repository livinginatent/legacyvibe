# Authentication Setup - Production Ready

This directory contains all authentication-related server actions and routes for LegacyVibe with **Zod validation** and comprehensive error handling.

## 📁 Structure

```
app/auth/
├── actions.ts           # Server actions with Zod validation
├── callback/
│   └── route.ts        # OAuth callback handler
├── error/
│   └── page.tsx        # Error page for auth failures
├── forgot-password/
│   └── page.tsx        # Password reset request page
└── README.md           # This file

app/dashboard/
└── update-password/
    └── page.tsx        # Password update page (after reset)
```

## 🔐 Security Features

All authentication follows the **api-security.md** rules:

- ✅ **No token logging** - GitHub tokens never appear in console
- ✅ **Server-side cookies** - Sessions managed via httpOnly cookies
- ✅ **Supabase RLS** - All database queries use Row Level Security
- ✅ **Error sanitization** - No sensitive data in error messages

## ✨ New Features

### **Zod Validation**

All authentication actions now use Zod for input validation:

- Email format validation
- Password strength requirements (8+ chars, uppercase, lowercase, number)
- Detailed field-level error messages
- Type-safe validation schemas

### **Password Reset Flow**

Complete password reset functionality:

1. User requests reset via email (`forgotPassword`)
2. Email sent with secure reset link
3. User redirected to update password page
4. Password validated and updated (`updatePassword`)

### **Enhanced Error Handling**

- Specific error messages for common issues
- Field-level validation errors
- User-friendly error descriptions
- Security-conscious error responses (prevents email enumeration)

## 🚀 Available Actions

### 1. Sign Up (with Zod Validation)

```typescript
import { signUp } from "@/app/auth/actions";

const result = await signUp("user@example.com", "Password123!");

if (result.success) {
  console.log("Check email for confirmation");
  console.log(result.user); // { id, email }
} else {
  console.error(result.error);
  // Check field-specific errors
  if (result.fieldErrors) {
    console.log(result.fieldErrors.email);
    console.log(result.fieldErrors.password);
  }
}
```

**Validation Rules:**

- Email must be valid format
- Password: 8+ characters, uppercase, lowercase, number

### 2. Sign In with Password (with Zod Validation)

```typescript
import { signInWithPassword } from "@/app/auth/actions";

// Automatically redirects to /dashboard on success
const result = await signInWithPassword("user@example.com", "Password123!");

// Only returns on error (successful login redirects)
if (result && !result.success) {
  console.error(result.error);
  if (result.fieldErrors) {
    console.log(result.fieldErrors.email);
    console.log(result.fieldErrors.password);
  }
}
```

### 3. Sign In with GitHub

```typescript
import { signInWithGithub } from "@/app/auth/actions";

// Redirects to GitHub OAuth page
await signInWithGithub();
```

**GitHub OAuth Scopes:**

- `repo` - Access to repositories
- `read:user` - Read user profile data

### 4. Sign Out

```typescript
import { signOut } from "@/app/auth/actions";

// Clears session and redirects to home
await signOut();
```

### 5. Forgot Password (NEW)

```typescript
import { forgotPassword } from "@/app/auth/actions";

const result = await forgotPassword("user@example.com");

// Always returns success to prevent email enumeration
if (result.success) {
  console.log(result.message);
  // "If an account exists with this email, you will receive a reset link..."
}
```

**Security Feature:** Returns success even if email doesn't exist to prevent email enumeration attacks.

**Reset Flow:**

1. User clicks reset link in email
2. Redirected to `/auth/callback?next=/dashboard/update-password`
3. Callback exchanges code for session
4. User lands on update password page

### 6. Update Password (NEW)

```typescript
import { updatePassword } from "@/app/auth/actions";

const result = await updatePassword("NewPassword123!");

if (result.success) {
  console.log("Password updated!");
} else {
  console.error(result.error);
  // "Password must be at least 8 characters..."
}
```

**Validation Rules:**

- 8+ characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Cannot be same as old password

### 7. Get Current User

```typescript
import { getCurrentUser } from "@/app/auth/actions";

const user = await getCurrentUser();

if (user) {
  console.log("Logged in as:", user.email);
} else {
  console.log("Not authenticated");
}
```

## ⚙️ Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 🔧 Supabase Setup

### 1. Enable GitHub Provider

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **GitHub** provider
3. Add your GitHub OAuth App credentials
4. Set callback URL: `http://localhost:3000/auth/callback`

### 2. Configure GitHub OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

### 3. Enable Email Provider (Optional)

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. Configure email templates if needed

## 🛣️ Routes

### `/auth/callback`

OAuth callback handler. Processes the authorization code from GitHub and exchanges it for a session.

**Flow:**

1. User clicks "Sign in with GitHub"
2. Redirected to GitHub for authorization
3. GitHub redirects back to `/auth/callback?code=...`
4. Code exchanged for session
5. User redirected to `/dashboard`

### `/auth/error`

Error page displayed when authentication fails.

**Query Parameters:**

- `message` - Error message to display (sanitized)

## 🧪 Testing

### Test Sign Up

```typescript
// In a Server Component or Server Action
const result = await signUp("test@example.com", "Test123!");
```

### Test Sign In

```typescript
// In a form action
<form
  action={async (formData) => {
    "use server";
    const email = formData.get("email");
    const password = formData.get("password");
    await signInWithPassword(email, password);
  }}
>
  {/* form fields */}
</form>
```

### Test GitHub OAuth

```typescript
// In a button onClick (client component)
<form action={signInWithGithub}>
  <button type="submit">Sign in with GitHub</button>
</form>
```

## 🔒 Security Best Practices

1. **Never log tokens**

   ```typescript
   // ❌ BAD
   console.log("Token:", data.session.access_token);

   // ✅ GOOD
   console.log("User authenticated:", data.user.id);
   ```

2. **Always validate input**

   ```typescript
   if (!email || !password) {
     return { success: false, error: "Missing credentials" };
   }
   ```

3. **Use server actions**

   ```typescript
   "use server"; // Always at the top of server actions
   ```

4. **Handle redirects properly**
   ```typescript
   try {
     redirect("/dashboard");
   } catch (error) {
     // Redirect throws NEXT_REDIRECT error
     if (error instanceof Error && error.message === "NEXT_REDIRECT") {
       throw error;
     }
   }
   ```

## 🔍 Zod Validation Schemas

### Email Schema

```typescript
z.string()
  .email("Please enter a valid email address")
  .min(1, "Email is required")
  .max(255, "Email is too long");
```

### Password Schema

```typescript
z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Must contain uppercase, lowercase, and number"
  );
```

### Usage in Actions

All authentication actions validate input before making Supabase calls:

```typescript
const validation = signUpSchema.safeParse({ email, password });

if (!validation.success) {
  // Return field-level errors
  return {
    success: false,
    error: validation.error.issues[0]?.message,
    fieldErrors: {
      /* ... */
    },
  };
}
```

## 🎯 Error Messages

### Sign Up Errors

- "Please enter a valid email address"
- "Password must be at least 8 characters"
- "Password must contain at least one uppercase letter..."
- "An account with this email already exists"

### Sign In Errors

- "Invalid email or password" (for security, don't reveal which)
- "Email is required"
- "Password is required"

### Password Reset Errors

- Always returns success message (prevents email enumeration)
- Validation errors for invalid email format

### Update Password Errors

- "Password must be at least 8 characters"
- "New password must be different from your current password"
- "You must be logged in to update your password"

## 📝 Notes

- All actions use `'use server'` directive
- **Zod validation** on all user inputs
- Field-level error messages for better UX
- Redirects throw errors in Next.js (this is expected behavior)
- Sessions are automatically managed via cookies
- No client-side token storage
- All errors are sanitized before display
- Email enumeration prevention on forgot password

## 🐛 Troubleshooting

### "Authentication failed" error

1. Check Supabase credentials in `.env.local`
2. Verify GitHub OAuth app is configured correctly
3. Ensure callback URL matches exactly

### Redirect not working

1. Verify `NEXT_PUBLIC_BASE_URL` is set correctly
2. Check that middleware is configured (see `middleware.ts`)
3. Ensure cookies are enabled in browser

### GitHub OAuth not requesting correct scopes

1. Verify scopes in `signInWithGithub()` action
2. Check GitHub OAuth app permissions
3. Revoke and re-authorize the app

## 📚 Related Files

- `app/src/utils/supabase/server.ts` - Supabase server client
- `app/src/utils/supabase/middleware.ts` - Auth middleware
- `.cursor/rules/api-security.md` - Security guidelines
