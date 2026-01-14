# Usage Limits Implementation Guide 📊

## Overview
Implements analysis usage limits for paid users: **5 full scans per month**. Smart reanalyze (detects actual code changes) is FREE and doesn't count against the limit.

---

## ✅ What's Implemented

### 1. **Database Migration**
File: `supabase/migrations/006_create_usage_tracking_table.sql`

**Features**:
- ✅ `user_usage` table tracks scans per user
- ✅ Auto-resets monthly (30 days)
- ✅ 5 scans limit per period
- ✅ RLS policies for security
- ✅ `check_and_reset_usage()` function for automatic reset

**Apply Migration**:
```bash
psql < supabase/migrations/006_create_usage_tracking_table.sql
```

### 2. **Smart Reanalyze Logic**
File: `services/githubCommitChecker.ts`

**Features**:
- ✅ Checks GitHub for new commits since last analysis
- ✅ Returns true if changes detected
- ✅ Smart reanalyze is FREE (doesn't count against limit)

### 3. **API Updates**
File: `app/api/analyze/route.ts`

**Features**:
- ✅ Checks usage limits before analysis
- ✅ Returns 429 error if limit exceeded
- ✅ Smart reanalyze bypasses limit check
- ✅ Increments counter for new scans
- ✅ Auto-resets after 30 days

### 4. **Usage Status API**
File: `app/api/usage/route.ts`

**Features**:
- ✅ GET endpoint returns current usage stats
- ✅ Scans used/remaining
- ✅ Days until reset
- ✅ Percentage used

---

## 🎯 User Flow

### **Scenario 1: First Analysis (Counts as 1 scan)**
```
User clicks "START ANALYSIS"
         ↓
Check usage: 0/5
         ↓
Run analysis
         ↓
Increment: 1/5
         ↓
Show result
```

### **Scenario 2: Smart Reanalyze (FREE)**
```
User clicks "REANALYZE" (Smart)
         ↓
Check for new commits
         ↓
No changes found
         ↓
Return cached (FREE - no scan used)
         ↓
"No new commits since last analysis"
```

### **Scenario 3: Smart Reanalyze with Changes (FREE)**
```
User clicks "REANALYZE" (Smart)
         ↓
Check for new commits
         ↓
Changes detected!
         ↓
Run analysis (FREE - doesn't count)
         ↓
Update cached result
```

### **Scenario 4: Force Rescan (Counts as 1 scan)**
```
User clicks "FORCE RESCAN"
         ↓
Check usage: 4/5
         ↓
Run analysis
         ↓
Increment: 5/5
         ↓
Show result + warning
```

### **Scenario 5: Limit Reached**
```
User clicks any scan button
         ↓
Check usage: 5/5
         ↓
Return 429 error
         ↓
Show: "You've used all 5 scans. Resets on [date]"
         ↓
Disable scan buttons
```

---

## 🔧 Remaining UI Implementation

### **Step 1: Add Usage Display**

Add this component near the top of the dashboard (after the header):

```tsx
{/* Usage Stats Badge */}
{usageData && !isLoadingUsage && (
  <div className={`glass-card border p-4 ${
    usageData.isLimitReached 
      ? "border-red-500/50 bg-red-500/10" 
      : usageData.scansRemaining <= 1
      ? "border-yellow-500/50 bg-yellow-500/10"
      : "border-gray-700"
  }`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Activity className={`w-5 h-5 ${
          usageData.isLimitReached ? "text-red-400" : "text-cyan-400"
        }`} />
        <div>
          <p className="text-sm font-mono font-bold">
            {usageData.scansUsed}/{usageData.scansLimit} Scans Used
          </p>
          <p className="text-xs font-mono text-gray-400">
            {usageData.scansRemaining} remaining • Resets in {usageData.daysUntilReset} days
          </p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-32">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              usageData.percentageUsed >= 100
                ? "bg-red-500"
                : usageData.percentageUsed >= 80
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${usageData.percentageUsed}%` }}
          />
        </div>
      </div>
    </div>
  </div>
)}
```

### **Step 2: Update handleAnalyze Function**

Replace the current `handleAnalyze` function with:

```tsx
const handleAnalyze = async (smartReanalyze = false) => {
  if (!installationId) {
    setError("GitHub App not connected");
    return;
  }

  setIsAnalyzing(true);
  setProgress(0);
  setError(null);
  setResult(null);
  clearImpactAnalysis();

  const progressInterval = setInterval(() => {
    setProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 10));
  }, 800);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner,
        repo,
        installationId,
        forceRescan: !smartReanalyze && forceRescan,
        smartReanalyze,
      }),
    });

    clearInterval(progressInterval);
    setProgress(100);

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle usage limit
      if (response.status === 429) {
        setError(errorData.message);
        setUsageData(errorData.usage);
        return;
      }
      
      throw new Error(errorData.error || "Analysis failed");
    }

    const data = await response.json();
    
    // Handle no changes
    if (data.noChanges) {
      setResult(data);
      return;
    }
    
    setResult(data);
    setForceRescan(false);
    
    // Reload usage stats
    await loadUsageStats();
    
  } catch (err) {
    clearInterval(progressInterval);
    setError(err instanceof Error ? err.message : "Analysis failed");
  } finally {
    setIsAnalyzing(false);
  }
};
```

### **Step 3: Add Load Usage Function**

Add this function near other utility functions:

```tsx
const loadUsageStats = async () => {
  setIsLoadingUsage(true);
  try {
    const response = await fetch("/api/usage");
    if (response.ok) {
      const data = await response.json();
      setUsageData(data);
      
      // Show warning if low
      if (data.scansRemaining <= 1 && data.scansRemaining > 0) {
        setShowUsageWarning(true);
      }
    }
  } catch (err) {
    console.error("Failed to load usage:", err);
  } finally {
    setIsLoadingUsage(false);
  }
};
```

### **Step 4: Update useEffect**

Update the mount effect to load usage:

```tsx
useEffect(() => {
  loadCachedAnalysis();
  loadUsageStats(); // Add this line
}, [repoFullName]);
```

### **Step 5: Update Buttons**

Replace the current analyze/rescan buttons with:

```tsx
<Button
  onClick={() => handleAnalyze(false)}
  disabled={isAnalyzing || (usageData && usageData.isLimitReached)}
  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold font-mono gap-2"
>
  {isAnalyzing ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>ANALYZING...</span>
    </>
  ) : (
    <>
      <Zap className="w-4 h-4" />
      <span>{result ? "REANALYZE" : "START ANALYSIS"}</span>
    </>
  )}
</Button>

{result && !isAnalyzing && (
  <Button
    onClick={() => handleAnalyze(true)}
    variant="outline"
    className="border-green-500/50 hover:bg-green-500/10 font-mono gap-2 text-green-400"
    title="Checks for new commits first - FREE if no changes"
  >
    <CheckCircle2 className="w-4 h-4" />
    Smart Reanalyze (FREE)
  </Button>
)}

{result && !isAnalyzing && (
  <Button
    onClick={() => {
      setForceRescan(true);
      setTimeout(() => handleAnalyze(false), 100);
    }}
    disabled={usageData && usageData.isLimitReached}
    variant="outline"
    className="border-primary/50 hover:bg-primary/10 font-mono gap-2"
  >
    <Terminal className="w-4 h-4" />
    Force Rescan
  </Button>
)}
```

### **Step 6: Add Warning Messages**

Add these alerts after the error state:

```tsx
{/* Usage Warning */}
{showUsageWarning && usageData && usageData.scansRemaining <= 1 && (
  <div className="glass-card border border-yellow-500/30 p-4 bg-yellow-500/10 animate-fade-in-up">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
      <div>
        <h3 className="font-mono font-semibold text-yellow-400 mb-1">
          LOW SCAN LIMIT
        </h3>
        <p className="text-sm font-mono text-gray-300">
          You have {usageData.scansRemaining} scan{usageData.scansRemaining !== 1 ? 's' : ''} remaining. 
          Use "Smart Reanalyze" to check for changes for FREE!
        </p>
      </div>
      <Button
        onClick={() => setShowUsageWarning(false)}
        variant="ghost"
        size="sm"
        className="ml-auto"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  </div>
)}

{/* Limit Reached */}
{usageData && usageData.isLimitReached && (
  <div className="glass-card border border-red-500/30 p-6 bg-red-500/10 animate-fade-in-up">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-mono font-semibold text-red-400 mb-1">
          SCAN LIMIT REACHED
        </h3>
        <p className="text-sm font-mono text-gray-300 mb-3">
          You've used all {usageData.scansLimit} scans for this period. 
          Your limit will reset in {usageData.daysUntilReset} days 
          ({new Date(usageData.periodEnd).toLocaleDateString()}).
        </p>
        <p className="text-sm font-mono text-green-400">
          💡 Tip: Use "Smart Reanalyze" to check for code changes - it's FREE and doesn't count against your limit!
        </p>
      </div>
    </div>
  </div>
)}
```

---

## 📊 Usage Statistics Display

### **Compact Badge** (Top of Page)
```
┌──────────────────────────────────┐
│ ⚡ 3/5 Scans Used                │
│ 2 remaining • Resets in 12 days  │
│ ████████░░░░ 60%                 │
└──────────────────────────────────┘
```

### **Warning State** (Yellow)
```
┌──────────────────────────────────┐
│ ⚠️  LOW SCAN LIMIT                │
│ You have 1 scan remaining.       │
│ Use "Smart Reanalyze" for FREE!  │
└──────────────────────────────────┘
```

### **Limit Reached** (Red)
```
┌──────────────────────────────────┐
│ 🚫 SCAN LIMIT REACHED             │
│ You've used all 5 scans.         │
│ Resets in 8 days (Jan 21, 2026)  │
│                                  │
│ 💡 Tip: Smart Reanalyze is FREE! │
└──────────────────────────────────┘
```

---

## 🎯 Key Features

### **What Counts as a Scan** ✅
1. ✅ First analysis of a repo
2. ✅ Force Rescan (manual refresh)
3. ✅ Analyzing a new repository

### **What Doesn't Count** ✅
1. ✅ Smart Reanalyze (checks for changes first)
2. ✅ Viewing cached results
3. ✅ Using other features (Impact, Onboarding, etc.)

### **Smart Reanalyze Logic**
```
Smart Reanalyze Clicked
         ↓
Check GitHub for commits
         ↓
    ┌────┴────┐
    ↓         ↓
No Changes  Changes
    ↓         ↓
Return     Run FREE
Cached     Analysis
```

---

## 🔒 Security & Data

- ✅ RLS policies ensure users only see their own usage
- ✅ Auto-reset handled by database function
- ✅ Usage checked before analysis starts
- ✅ 429 status code for limit exceeded
- ✅ Clear error messages

---

## 📝 Database Schema

```sql
user_usage table:
- user_id (uuid, primary key)
- scans_used (integer) - Current scans used
- scans_limit (integer) - Max scans (5)
- period_start (timestamp) - Period start date
- period_end (timestamp) - Auto-reset date
- last_reset_at (timestamp) - Last reset time
```

---

## ✅ Summary

**Complete Implementation**:
1. ✅ Database migration for usage tracking
2. ✅ Smart reanalyze logic (checks commits)
3. ✅ API endpoint with limit checking
4. ✅ Usage status API endpoint
5. ✅ UI components (needs manual integration)

**Result**: Users get **5 full scans per month**. Smart reanalyze (detects code changes) is **FREE** and doesn't count. Clear warnings and usage display keep users informed! 📊✨

The system is fair: if code hasn't changed, users don't waste scans. If they force a rescan, it counts. Monthly reset ensures fresh limits! 🚀
