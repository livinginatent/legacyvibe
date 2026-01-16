import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Database } from "lucide-react";
import { Button } from "@/app/src/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy - Cadracode",
  description:
    "Privacy policy for Cadracode. We do not collect or store your repository code. Your data is processed securely and never shared.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-primary/20 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 max-w-4xl">
          <Link href="/">
            <Button
              variant="ghost"
              className="font-mono gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground font-mono">
                Privacy Policy
              </h1>
            </div>
            <p className="font-mono text-sm text-muted-foreground">
              Last updated: January 15, 2026
            </p>
          </div>

          {/* Key Promise */}
          <div className="glass-card border border-primary/30 bg-primary/5 p-6">
            <div className="flex items-start gap-4">
              <Lock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-mono font-bold text-foreground mb-2">
                  We Do Not Collect Your Repository Code
                </h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  Cadracode analyzes your codebase through the GitHub API in real-time
                  during analysis sessions. We do not store, copy, or retain your
                  repository code, file contents, or source code. All analysis is
                  performed on-demand and results are cached as metadata only (feature
                  names, relationships, risk scores).
                </p>
              </div>
            </div>
          </div>

          {/* What We Collect */}
          <div className="glass-card border border-border p-6">
            <h2 className="text-2xl font-mono font-bold text-foreground mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              What We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-mono font-semibold text-foreground mb-2">
                  Account Information
                </h3>
                <ul className="font-mono text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Email address (for authentication)</li>
                  <li>• GitHub App installation ID (to access your repositories)</li>
                  <li>• Account creation date and last login</li>
                </ul>
              </div>

              <div>
                <h3 className="font-mono font-semibold text-foreground mb-2">
                  Analysis Metadata (Not Your Code)
                </h3>
                <ul className="font-mono text-sm text-muted-foreground space-y-1 ml-4">
                  <li>
                    • Repository names and structure (file paths, directory tree)
                  </li>
                  <li>
                    • Feature names and relationships (e.g., "Payment Gateway" connects
                    to "Order Manager")
                  </li>
                  <li>
                    • Risk scores and architectural insights (High/Med/Low risk
                    classifications)
                  </li>
                  <li>• Analysis timestamps and usage statistics</li>
                </ul>
                <p className="font-mono text-xs text-muted-foreground mt-2 italic">
                  We do NOT store file contents, source code, API keys, secrets, or any
                  actual code from your repositories.
                </p>
              </div>

              <div>
                <h3 className="font-mono font-semibold text-foreground mb-2">
                  Payment Information
                </h3>
                <ul className="font-mono text-sm text-muted-foreground space-y-1 ml-4">
                  <li>
                    • Payment status and transaction IDs (processed by Dodo Payments)
                  </li>
                  <li>• Usage limits and scan counts</li>
                  <li>
                    • We do NOT store credit card numbers or payment details (handled
                    by Dodo Payments)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* How We Use Data */}
          <div className="glass-card border border-border p-6">
            <h2 className="text-2xl font-mono font-bold text-foreground mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              How We Use Your Data
            </h2>
            <ul className="font-mono text-sm text-muted-foreground space-y-2 ml-4">
              <li>
                • To provide analysis services and generate visual architecture maps
              </li>
              <li>• To track your usage limits and payment status</li>
              <li>• To improve our AI analysis algorithms (using anonymized metadata)</li>
              <li>• To send important account notifications (via email)</li>
              <li>
                • We do NOT sell, rent, or share your data with third parties
              </li>
              <li>
                • We do NOT use your repository data for training AI models or
                commercial purposes
              </li>
            </ul>
          </div>

          {/* Data Security */}
          <div className="glass-card border border-border p-6">
            <h2 className="text-2xl font-mono font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Data Security
            </h2>
            <ul className="font-mono text-sm text-muted-foreground space-y-2 ml-4">
              <li>
                • All data is encrypted in transit (HTTPS) and at rest (database
                encryption)
              </li>
              <li>
                • We use Supabase for secure authentication and data storage (SOC 2
                compliant)
              </li>
              <li>
                • GitHub App access is scoped to only repositories you explicitly grant
                access to
              </li>
              <li>
                • Analysis sessions are temporary—code is fetched, analyzed, and
                discarded
              </li>
              <li>• Row-level security ensures users can only access their own data</li>
            </ul>
          </div>

          {/* Your Rights */}
          <div className="glass-card border border-border p-6">
            <h2 className="text-2xl font-mono font-bold text-foreground mb-4 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-primary" />
              Your Rights
            </h2>
            <ul className="font-mono text-sm text-muted-foreground space-y-2 ml-4">
              <li>
                • <strong className="text-foreground">Delete Account:</strong> You can
                delete your account and all associated data from Settings
              </li>
              <li>
                • <strong className="text-foreground">Clear Cache:</strong> Delete
                cached analysis results for any repository
              </li>
              <li>
                • <strong className="text-foreground">Revoke Access:</strong> Uninstall
                the GitHub App at any time to revoke repository access
              </li>
              <li>
                • <strong className="text-foreground">Export Data:</strong> Request a
                copy of your account data (metadata only, not code)
              </li>
            </ul>
          </div>

          {/* GitHub Integration */}
          <div className="glass-card border border-border p-6">
            <h2 className="text-2xl font-mono font-bold text-foreground mb-4">
              GitHub Integration
            </h2>
            <p className="font-mono text-sm text-muted-foreground mb-4">
              Cadracode uses the GitHub App to access your repositories. Here's what
              that means:
            </p>
            <ul className="font-mono text-sm text-muted-foreground space-y-2 ml-4">
              <li>
                • You control which repositories the app can access (selective
                installation)
              </li>
              <li>
                • We use read-only access to fetch file trees and contents during
                analysis
              </li>
              <li>
                • Access tokens are temporary and scoped to your installation
              </li>
              <li>
                • You can revoke access at any time by uninstalling the GitHub App
              </li>
              <li>
                • We do NOT have write access, cannot modify your code, and cannot access
                private repositories you don't explicitly grant access to
              </li>
            </ul>
          </div>

          {/* Third-Party Services */}
          <div className="glass-card border border-border p-6">
            <h2 className="text-2xl font-mono font-bold text-foreground mb-4">
              Third-Party Services
            </h2>
            <div className="space-y-3 font-mono text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Supabase:</strong> Authentication
                and database hosting (privacy policy:{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  supabase.com/privacy
                </a>
                )
              </div>
              <div>
                <strong className="text-foreground">Dodo Payments:</strong> Payment
                processing (privacy policy:{" "}
                <a
                  href="https://dodopayments.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  dodopayments.com/privacy
                </a>
                )
              </div>
              <div>
                <strong className="text-foreground">Anthropic Claude:</strong> AI
                analysis (privacy policy:{" "}
                <a
                  href="https://www.anthropic.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  anthropic.com/privacy
                </a>
                )
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="glass-card border border-border p-6">
            <h2 className="text-2xl font-mono font-bold text-foreground mb-4">
              Questions or Concerns?
            </h2>
            <p className="font-mono text-sm text-muted-foreground">
              If you have questions about this privacy policy or how we handle your
              data, please contact us at{" "}
              <a
                href="mailto:privacy@cadracode.com"
                className="text-primary hover:underline"
              >
                privacy@cadracode.com
              </a>
            </p>
          </div>

          {/* Changes */}
          <div className="glass-card border border-border p-6">
            <h2 className="text-2xl font-mono font-bold text-foreground mb-4">
              Changes to This Policy
            </h2>
            <p className="font-mono text-sm text-muted-foreground">
              We may update this privacy policy from time to time. We will notify you of
              any changes by posting the new policy on this page and updating the "Last
              updated" date. You are advised to review this policy periodically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
