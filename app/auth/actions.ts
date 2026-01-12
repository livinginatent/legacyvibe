/**
 * Authentication Server Actions - Production Ready
 * Handles user sign up, sign in (password & OAuth), password reset, and sign out flows.
 * Uses Supabase Auth with secure server-side cookie management.
 * All tokens are handled server-side - never exposed to client logs.
 * Follows api-security.md rules and uses Zod for validation.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/app/src/utils/supabase/server";

// Base URL for redirects - configurable via environment variable
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
// Site URL specifically for OAuth callbacks
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// ============================================================================
// Zod Validation Schemas
// ============================================================================

const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(1, "Email is required")
  .max(255, "Email is too long");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const updatePasswordSchema = z.object({
  password: passwordSchema,
});

// ============================================================================
// Authentication Actions
// ============================================================================

/**
 * Sign up a new user with email and password.
 * Validates input using Zod and sends confirmation email.
 * @returns Success status with message or error details
 */
export async function signUp(email: string, password: string) {
  try {
    // Validate input with Zod
    const validation = signUpSchema.safeParse({ email, password });

    if (!validation.success) {
      const errors = validation.error.issues;
      return {
        success: false,
        error: errors[0]?.message || "Invalid input",
        fieldErrors: {
          email: errors.find((e: any) => e.path[0] === "email")?.message,
          password: errors.find((e: any) => e.path[0] === "password")?.message,
        },
      };
    }

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        emailRedirectTo: `${BASE_URL}/auth/callback`,
      },
    });

    if (error) {
      // Return user-friendly error messages
      if (error.message.includes("already registered")) {
        return {
          success: false,
          error: "An account with this email already exists",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    // Revalidate the root path to update any cached data
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Check your email to confirm your account",
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    };
  } catch (error) {
    // Never log sensitive data
    console.error("Sign up error:", "Unexpected error occurred");

    return {
      success: false,
      error: "An unexpected error occurred during sign up",
    };
  }
}

/**
 * Sign in user with email and password.
 * Validates credentials and redirects to dashboard on success.
 */
export async function signInWithPassword(email: string, password: string) {
  try {
    // Validate input with Zod
    const validation = signInSchema.safeParse({ email, password });

    if (!validation.success) {
      const errors = validation.error.issues;
      return {
        success: false,
        error: errors[0]?.message || "Invalid input",
        fieldErrors: {
          email: errors.find((e: any) => e.path[0] === "email")?.message,
          password: errors.find((e: any) => e.path[0] === "password")?.message,
        },
      };
    }

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) {
      // Return user-friendly error messages
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("Email not confirmed")
      ) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    // Revalidate cached data
    revalidatePath("/", "layout");

    // Redirect to dashboard on successful sign in
    redirect("/dashboard");
  } catch (error) {
    // Handle redirect errors (redirect throws an error in Next.js)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Sign in error:", "Unexpected error occurred");

    return {
      success: false,
      error: "An unexpected error occurred during sign in",
    };
  }
}

/**
 * Initiate GitHub App Installation from Dashboard.
 * Redirects user to install the LegacyVibe GitHub App, allowing them to select repositories.
 * GitHub will redirect back to /dashboard with installation_id in the query parameters.
 *
 * This uses the GitHub App flow instead of OAuth, providing more granular repository access.
 * Users can select specific repositories to grant LegacyVibe access to.
 *
 * Note: This is used from the dashboard AFTER the user has logged in via email/password.
 */
export async function connectGitHub() {
  try {
    // Redirect to GitHub App installation page
    // User will be prompted to install the app and select repositories
    // GitHub will redirect back to the Setup URL (/dashboard) with installation_id
    redirect("https://github.com/apps/legacyvibe/installations/new");
  } catch (error) {
    // Handle redirect errors (redirect throws an error in Next.js)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error(
      "GitHub App installation error:",
      "Unexpected error occurred"
    );

    return {
      success: false,
      error: "An unexpected error occurred while connecting to GitHub",
    };
  }
}

/**
 * Send password reset email.
 * User will receive an email with a link to reset their password.
 * After reset, they'll be redirected to the update password page.
 */
export async function forgotPassword(email: string) {
  try {
    // Validate input with Zod
    const validation = forgotPasswordSchema.safeParse({ email });

    if (!validation.success) {
      const errors = validation.error.issues;
      return {
        success: false,
        error: errors[0]?.message || "Invalid email address",
      };
    }

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.resetPasswordForEmail(
      validation.data.email,
      {
        redirectTo: `${BASE_URL}/auth/callback?next=/dashboard/update-password`,
      }
    );

    if (error) {
      // Don't reveal if email exists or not for security
      console.error("Password reset error:", "Error sending reset email");
    }

    // Always return success to prevent email enumeration
    return {
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link shortly",
    };
  } catch (error) {
    console.error("Forgot password error:", "Unexpected error occurred");

    // Return success even on error to prevent email enumeration
    return {
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link shortly",
    };
  }
}

/**
 * Update user's password.
 * Requires user to be authenticated (from password reset link).
 * Validates new password strength using Zod.
 */
export async function updatePassword(newPassword: string) {
  try {
    // Validate input with Zod
    const validation = updatePasswordSchema.safeParse({
      password: newPassword,
    });

    if (!validation.success) {
      const errors = validation.error.issues;
      return {
        success: false,
        error: errors[0]?.message || "Invalid password",
      };
    }

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to update your password",
      };
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: validation.data.password,
    });

    if (error) {
      if (error.message.includes("same as the old password")) {
        return {
          success: false,
          error: "New password must be different from your current password",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    // Revalidate cached data
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    console.error("Update password error:", "Unexpected error occurred");

    return {
      success: false,
      error: "An unexpected error occurred while updating your password",
    };
  }
}

/**
 * Sign out the current user.
 * Clears session and redirects to home page.
 */
export async function signOut() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Revalidate all cached data
    revalidatePath("/", "layout");

    // Redirect to home page
    redirect("/");
  } catch (error) {
    // Handle redirect errors (redirect throws an error in Next.js)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Sign out error:", "Unexpected error occurred");

    return {
      success: false,
      error: "An unexpected error occurred during sign out",
    };
  }
}

/**
 * Get the current authenticated user.
 * Returns user data or null if not authenticated.
 */
export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Get user error:", "Failed to retrieve user");
    return null;
  }
}
