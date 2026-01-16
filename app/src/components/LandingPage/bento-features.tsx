/* eslint-disable react/no-unescaped-entities */
import { 
  Network, 
  Target, 
  GraduationCap, 
  FileText, 
  Activity,
  Zap 
} from "lucide-react";

const BentoFeatures = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful <span className="text-primary text-glow">Features</span>
          </h2>
          <p className="font-mono text-muted-foreground mb-4">
            Everything you need to understand and maintain your codebase
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
        </div>

        {/* Bento Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Large Module - Blueprint Orchestrator */}
          <div className="glass-card p-8 glow-border row-span-2 flex flex-col">
            <div className="font-mono text-xs text-primary/60 tracking-widest mb-4">
              BLUEPRINT ORCHESTRATOR
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Network className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">
                Visual Architecture Map
              </h3>
            </div>
            <p className="font-mono text-sm text-muted-foreground mb-6">
              AI analyzes your entire repository and creates an interactive graph 
              showing business logic, feature relationships, and dependencies.
            </p>

            {/* Mockup - Blueprint Graph */}
            <div className="flex-1 bg-background/50 rounded-lg p-6 border border-border overflow-hidden">
              <div className="font-mono text-xs mb-4 text-muted-foreground">
                ecommerce-app/cadracode
              </div>
              
              {/* Mock nodes */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-primary">The Payment Gateway</div>
                    <div className="text-xs text-muted-foreground">3 files • High Risk</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pl-8">
                  <div className="w-px h-8 bg-primary/30" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">→ provides transaction data</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-green-400">The Order Manager</div>
                    <div className="text-xs text-muted-foreground">5 files • Low Risk</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-8">
                  <div className="w-px h-8 bg-yellow-500/30" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">→ uses user auth</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-yellow-400">The User Gateway</div>
                    <div className="text-xs text-muted-foreground">4 files • Med Risk</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Analysis */}
          <div className="glass-card p-8 glow-border flex flex-col">
            <div className="font-mono text-xs text-primary/60 tracking-widest mb-4">
              IMPACT ANALYSIS
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Blast Radius Analysis
                </h3>
                <p className="font-mono text-sm text-muted-foreground mb-4">
                  See exactly what breaks when you modify a file. Visual dependency tracing 
                  with risk scores.
                </p>
                
                {/* Mockup */}
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className="font-mono text-xs text-muted-foreground mb-2">
                    Analyzing: app/auth/actions.ts
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-xs font-mono text-red-400">3 features affected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      <span className="text-xs font-mono text-yellow-400">5 tests need updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-mono text-emerald-400">Risk Score: 72/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Onboarding Copilot */}
          <div className="glass-card p-8 glow-border flex flex-col">
            <div className="font-mono text-xs text-primary/60 tracking-widest mb-4">
              ONBOARDING COPILOT
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  AI Learning Paths
                </h3>
                <p className="font-mono text-sm text-muted-foreground mb-4">
                  Personalized onboarding for new developers. Step-by-step guides 
                  based on your actual codebase.
                </p>
                
                {/* Mockup */}
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-primary/30 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-xs font-mono text-foreground">Step 1: Read auth flow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-gray-600" />
                      <span className="text-xs font-mono text-muted-foreground">Step 2: Understand payment system</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-gray-600" />
                      <span className="text-xs font-mono text-muted-foreground">Step 3: Explore API routes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documentation Generator */}
          <div className="glass-card p-8 glow-border flex flex-col">
            <div className="font-mono text-xs text-primary/60 tracking-widest mb-4">
              DOCUMENTATION
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Auto-Generated Docs
                </h3>
                <p className="font-mono text-sm text-muted-foreground mb-4">
                  One-click export to Markdown/MDX. Beautiful architecture docs 
                  with API examples, automatically updated.
                </p>
                
                {/* Mockup */}
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className="font-mono text-xs space-y-1">
                    <div className="text-primary"># Architecture Overview</div>
                    <div className="text-muted-foreground pl-4">## Features</div>
                    <div className="text-muted-foreground pl-8">- Payment Gateway</div>
                    <div className="text-muted-foreground pl-8">- User Authentication</div>
                    <div className="text-muted-foreground pl-4">## API Endpoints</div>
                    <div className="text-muted-foreground pl-8">- POST /api/payments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Debt Audit */}
          <div className="glass-card p-8 glow-border flex flex-col">
            <div className="font-mono text-xs text-primary/60 tracking-widest mb-4">
              DEBT TRACKING
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Technical Debt Audit
                </h3>
                <p className="font-mono text-sm text-muted-foreground mb-4">
                  One-time, repo-wide assessment. Identifies hotspot features, 
                  scores 7 categories, and prioritizes actionable fixes.
                </p>
                
                {/* Mockup */}
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">Overall Score</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-red-400">59/100</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded border border-red-500/40 text-red-300">Grade D</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-xs font-mono text-red-400">3 hotspot features</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        <span className="text-xs font-mono text-yellow-400">Architecture: 45/100</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <span className="text-xs font-mono text-orange-400">Testing: 40/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BentoFeatures;
