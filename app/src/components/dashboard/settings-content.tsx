/**
 * Settings Content Component
 * Handles profile management and data deletion
 */

"use client";

import { useState } from "react";
import {
  User,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/src/components/ui/button";

export function SettingsContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "data">("profile");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Data deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Account deletion state
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountDeleteError, setAccountDeleteError] = useState<string | null>(null);
  const [confirmAccountDelete, setConfirmAccountDelete] = useState(false);
  const [accountDeletePassword, setAccountDeletePassword] = useState("");
  const [showAccountDeletePassword, setShowAccountDeletePassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      setIsChangingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      setIsChangingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(false);

    try {
      const response = await fetch("/api/settings/delete-cache", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete cached data");
      }

      setDeleteSuccess(true);
      setConfirmDelete(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete cached data"
      );
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmAccountDelete) {
      setConfirmAccountDelete(true);
      return;
    }

    if (!accountDeletePassword) {
      setAccountDeleteError("Please enter your password to confirm");
      return;
    }

    setIsDeletingAccount(true);
    setAccountDeleteError(null);

    try {
      const response = await fetch("/api/settings/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: accountDeletePassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      // Redirect to home page after successful deletion
      router.push("/");
    } catch (err) {
      setAccountDeleteError(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground font-mono text-sm">
          Manage your profile and data
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-primary/20 mb-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 font-mono text-sm font-semibold transition-all ${
            activeTab === "profile"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab("data")}
          className={`px-6 py-3 font-mono text-sm font-semibold transition-all ${
            activeTab === "data"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trash2 className="w-4 h-4 inline mr-2" />
          Data Management
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="glass-card border border-primary/20 p-8 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Change Password
              </h2>
              <p className="text-sm text-muted-foreground font-mono">
                Update your account password
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-mono font-semibold text-foreground mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-black/50 border border-primary/30 rounded-lg px-4 py-3 font-mono text-sm text-foreground placeholder:text-gray-600 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-mono font-semibold text-foreground mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black/50 border border-primary/30 rounded-lg px-4 py-3 font-mono text-sm text-foreground placeholder:text-gray-600 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-mono font-semibold text-foreground mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/50 border border-primary/30 rounded-lg px-4 py-3 font-mono text-sm text-foreground placeholder:text-gray-600 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {passwordError && (
              <div className="glass-card border border-destructive/30 p-4 bg-destructive/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <p className="text-sm font-mono text-destructive">
                    {passwordError}
                  </p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {passwordSuccess && (
              <div className="glass-card border border-green-500/30 p-4 bg-green-500/5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-mono text-green-500">
                    Password changed successfully!
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isChangingPassword}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold font-mono gap-2"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Changing Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Change Password</span>
                </>
              )}
            </Button>
          </form>

          {/* Account Deletion Section */}
          <div className="border-t border-primary/20 pt-8 mt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Delete Account
                </h2>
                <p className="text-sm text-muted-foreground font-mono">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-card border border-red-500/30 p-6 bg-red-500/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-mono font-semibold text-red-500 mb-2">
                      Warning: This action is permanent and cannot be undone
                    </h3>
                    <p className="text-sm font-mono text-muted-foreground">
                      Deleting your account will permanently remove:
                    </p>
                    <ul className="list-disc list-inside text-sm font-mono text-muted-foreground mt-2 space-y-1">
                      <li>Your account and authentication credentials</li>
                      <li>All repository blueprint analyses</li>
                      <li>All onboarding learning paths</li>
                      <li>All impact analysis results</li>
                      <li>All generated documentation</li>
                      <li>All usage tracking data</li>
                      <li>All payment history</li>
                    </ul>
                    <p className="text-sm font-mono text-muted-foreground mt-3">
                      This action cannot be reversed. Please be certain before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {confirmAccountDelete && (
                <div>
                  <label className="block text-sm font-mono font-semibold text-foreground mb-2">
                    Enter your password to confirm account deletion
                  </label>
                  <div className="relative">
                    <input
                      type={showAccountDeletePassword ? "text" : "password"}
                      value={accountDeletePassword}
                      onChange={(e) => setAccountDeletePassword(e.target.value)}
                      className="w-full bg-black/50 border border-red-500/30 rounded-lg px-4 py-3 font-mono text-sm text-foreground placeholder:text-gray-600 focus:outline-none focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountDeletePassword(!showAccountDeletePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showAccountDeletePassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {accountDeleteError && (
                <div className="glass-card border border-destructive/30 p-4 bg-destructive/5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <p className="text-sm font-mono text-destructive">
                      {accountDeleteError}
                    </p>
                  </div>
                </div>
              )}

              {/* Delete Account Button */}
              <Button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || (confirmAccountDelete && !accountDeletePassword)}
                variant="destructive"
                className="w-full font-mono gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : confirmAccountDelete ? (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>Permanently Delete My Account</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>Delete Account</span>
                  </>
                )}
              </Button>

              {confirmAccountDelete && !isDeletingAccount && (
                <Button
                  onClick={() => {
                    setConfirmAccountDelete(false);
                    setAccountDeletePassword("");
                    setAccountDeleteError(null);
                  }}
                  variant="outline"
                  className="w-full font-mono"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Management Tab */}
      {activeTab === "data" && (
        <div className="glass-card border border-primary/20 p-8 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Delete Cached Data
              </h2>
              <p className="text-sm text-muted-foreground font-mono">
                Remove all cached analyses, onboarding paths, impact analyses, and documentation
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card border border-yellow-500/30 p-6 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-mono font-semibold text-yellow-500 mb-2">
                    Warning: This action cannot be undone
                  </h3>
                  <p className="text-sm font-mono text-muted-foreground">
                    This will permanently delete all your cached data:
                  </p>
                  <ul className="list-disc list-inside text-sm font-mono text-muted-foreground mt-2 space-y-1">
                    <li>All repository blueprint analyses</li>
                    <li>All onboarding learning paths</li>
                    <li>All impact analysis results</li>
                    <li>All generated documentation</li>
                  </ul>
                  <p className="text-sm font-mono text-muted-foreground mt-3">
                    You will need to re-analyze repositories to generate new data.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {deleteError && (
              <div className="glass-card border border-destructive/30 p-4 bg-destructive/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <p className="text-sm font-mono text-destructive">
                    {deleteError}
                  </p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {deleteSuccess && (
              <div className="glass-card border border-green-500/30 p-4 bg-green-500/5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-mono text-green-500">
                    All cached data has been deleted successfully!
                  </p>
                </div>
              </div>
            )}

            {/* Delete Button */}
            <Button
              onClick={handleDeleteAllData}
              disabled={isDeleting}
              variant={confirmDelete ? "destructive" : "outline"}
              className={`w-full font-mono gap-2 ${
                confirmDelete
                  ? "bg-destructive hover:bg-destructive/90 text-white"
                  : "border-red-500/50 hover:bg-red-500/10 text-red-400"
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : confirmDelete ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Delete All Data</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All Cached Data</span>
                </>
              )}
            </Button>

            {confirmDelete && !isDeleting && (
              <Button
                onClick={() => setConfirmDelete(false)}
                variant="outline"
                className="w-full font-mono"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
