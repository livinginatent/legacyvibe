# Onboarding Copilot 🎓

## Overview
The Onboarding Copilot is an AI-powered feature that generates personalized learning paths for new developers joining a codebase. It transforms weeks of confused wandering into structured, confidence-building learning journeys.

## The Problem It Solves

### Before Onboarding Copilot
- ❌ New dev joins team: "Where do I even start?"
- ❌ Senior dev spends 3 hours explaining architecture
- ❌ Junior reads random files hoping to understand
- ❌ First PR breaks everything (wrong patterns used)
- ❌ 2+ weeks to become productive
- ❌ High stress, low confidence

### After Onboarding Copilot
- ✅ Click "Onboarding" → AI generates personalized path
- ✅ Step-by-step guidance through actual codebase
- ✅ Learn by reading, exploring, and doing
- ✅ Progress tracking & checkpoints
- ✅ 3-6 hours to understand core architecture
- ✅ High confidence, proper patterns learned

## How It Works

### 1. **AI Learning Path Generation**

Claude analyzes your blueprint and creates an 8-12 step learning path optimized for:
- **Gradual complexity**: Start easy, build confidence
- **Practical learning**: Read files, explore features, make changes
- **Risk-aware**: Begin with stable/low-risk features
- **Pattern-focused**: Learn conventions while exploring
- **Time-efficient**: 3-6 hour total journey

### 2. **Step Types**

#### 📖 READ (Study)
- Focus on understanding patterns
- Read 3-5 specific files
- Learn conventions and architecture
- Build mental model

#### 🔍 EXPLORE (Navigate)
- Follow data/control flow
- See how features connect
- Understand integration points
- Discover dependencies

#### ✏️ MODIFY (Apply)
- Make a small, safe change
- Apply learned patterns
- Build confidence
- Get hands-on experience

#### ✅ TEST (Verify)
- Run tests
- Verify behavior
- Understand test patterns
- Ensure changes work

### 3. **Learning Progression**

```
Step 1-2: "Welcome Tour" 
→ Low-risk, stable features
→ Build confidence
→ Learn basic patterns

Step 3-4: "Core Patterns"
→ Understand conventions
→ See repeated patterns
→ Learn project structure

Step 5-6: "Integration Points"
→ How features connect
→ Data flow understanding
→ API patterns

Step 7-8: "Make Your Mark"
→ Safe modifications
→ Apply learning
→ Build real skills

Step 9+: "Advanced Topics"
→ Complex features
→ High-risk areas
→ Deep architecture
```

### 4. **Visual Learning Path**

When in onboarding mode:
- 🟣 **Purple glow** on relevant nodes
- 📍 **Step numbers** overlaid on nodes
- 🌫️ **Dimmed** irrelevant features
- 📊 **Progress tracking** in header

### 5. **Progress Tracking**

- ✅ Check off completed steps
- 💾 Saved to localStorage (per repo)
- 🎯 Auto-advance to next step
- 🔄 Resume anytime
- 📊 Visual progress indicators

## Example Learning Path

```json
{
  "totalSteps": 10,
  "estimatedTotalTime": 240,
  "overview": "Learn this Next.js app by starting with user auth, then exploring API patterns, and finally making your first safe modification.",
  "learningPath": [
    {
      "order": 1,
      "title": "Your First Quest: The User Gateway",
      "description": "Start by understanding how users log in. This is a stable, well-documented feature perfect for getting oriented.",
      "type": "read",
      "nodeName": "The User Gateway",
      "files": [
        "app/auth/actions.ts",
        "app/auth/callback/route.ts",
        "app/login/page.tsx"
      ],
      "objectives": [
        "Understand the authentication flow",
        "Identify where Supabase is used",
        "See the error handling pattern"
      ],
      "estimatedTime": 20,
      "checkpoints": [
        "Can you explain how login() works?",
        "Where are auth errors handled?",
        "What happens after successful login?"
      ],
      "hints": [
        "Look for 'use server' directives - that's where server actions are",
        "The callback route handles OAuth redirects"
      ]
    },
    {
      "order": 2,
      "title": "Explore: Following the Auth Trail",
      "description": "Now trace how auth flows through other features. You'll see how patterns repeat.",
      "type": "explore",
      "nodeName": "The User Gateway",
      "estimatedTime": 25
    },
    // ... more steps
    {
      "order": 8,
      "title": "Your First Code: Add a Welcome Message",
      "description": "Time to write code! Add a simple welcome message using the patterns you've learned.",
      "type": "modify",
      "nodeName": "The Dashboard",
      "objectives": [
        "Apply the component pattern you learned",
        "Use Tailwind classes like other components",
        "Follow the TypeScript conventions"
      ],
      "estimatedTime": 30,
      "checkpoints": [
        "Does your component follow the naming convention?",
        "Did you use the font-mono class?",
        "Is it properly typed?"
      ]
    }
  ],
  "keyTakeaways": [
    "Next.js app uses server actions for mutations",
    "Supabase handles all auth and database",
    "Components follow a consistent pattern",
    "Tailwind with custom mono font throughout",
    "Blueprint shows feature relationships clearly"
  ]
}
```

## UI Features

### Header
- 🎓 **"Onboarding" button** (purple) - Click to generate path
- ⏳ Loading state while generating
- 🔄 Re-generate option

### Overview Panel
```
┌─────────────────────────────────────────┐
│ 🎓 DEVELOPER ONBOARDING PATH            │
│                                         │
│ Learn this codebase by starting with... │
│                                         │
│  10 Steps    4h 30m    3/10 Complete   │
└─────────────────────────────────────────┘
```

### Step Cards
```
┌─────────────────────────────────────────┐
│ [1]  Your First Quest: The User Gateway │
│ 📖 READ • 20min                         │
│                                         │
│ Start by understanding how users log in │
│ Feature: The User Gateway               │
│                                         │
│ ▼ Click to expand                       │
└─────────────────────────────────────────┘
```

### Expanded Step
```
┌─────────────────────────────────────────┐
│ FILES TO STUDY (3)                      │
│ • app/auth/actions.ts                   │
│ • app/auth/callback/route.ts            │
│ • app/login/page.tsx                    │
│                                         │
│ LEARNING OBJECTIVES                     │
│ → Understand the authentication flow    │
│ → Identify where Supabase is used      │
│ → See the error handling pattern        │
│                                         │
│ CHECKPOINTS                             │
│ ☐ Can you explain how login() works?   │
│ ☐ Where are auth errors handled?       │
│ ☐ What happens after successful login?  │
│                                         │
│ 💡 HINTS                                │
│ Look for 'use server' directives...    │
│                                         │
│ [✓ Mark as Complete]                    │
└─────────────────────────────────────────┘
```

## Color Coding

- 🟣 **Purple** = Onboarding theme
- 🔵 **Blue** = READ steps
- 🔷 **Cyan** = EXPLORE steps  
- 🟠 **Orange** = MODIFY steps
- 🟢 **Green** = TEST steps / Completed

## Smart Features

### 1. **Difficulty Adaptation**
```typescript
userLevel: "beginner" | "intermediate" | "advanced"
```
- **Beginner**: More reading, detailed explanations, foundational concepts
- **Intermediate**: Balanced mix, assumes programming knowledge
- **Advanced**: Focus on architecture, integration, complex patterns

### 2. **Focus Area Customization**
```typescript
focusArea: "authentication" | "payments" | "data-layer" | etc.
```
Customizes the learning path to emphasize specific areas of the codebase.

### 3. **Risk-Aware Progression**
- Starts with `stable` or `boilerplate` nodes
- Avoids `fragile` nodes until later
- Begins with `Low` risk features
- Gradually introduces complexity

### 4. **Pattern Recognition**
AI detects and teaches:
- Component patterns
- State management patterns
- API calling conventions
- Error handling approaches
- Testing strategies

### 5. **Prerequisites Tracking**
Each step knows its dependencies:
```typescript
prerequisites: ["step-1", "step-2"]
```
Ensures logical learning order.

## API Endpoint

### POST `/api/onboarding`

**Request:**
```json
{
  "repoFullName": "owner/repo",
  "userLevel": "intermediate",
  "focusArea": "authentication"
}
```

**Response:**
```json
{
  "repoFullName": "owner/repo",
  "generatedAt": "2026-01-13T...",
  "totalSteps": 10,
  "estimatedTotalTime": 240,
  "overview": "Learn this codebase by...",
  "learningPath": [...],
  "keyTakeaways": [...]
}
```

## Progress Persistence

### localStorage Structure
```javascript
{
  "onboarding-owner/repo": {
    "step-1": true,
    "step-3": true,
    "step-5": true
  }
}
```

### Behavior
- ✅ Automatically saves when marking steps complete
- 🔄 Restores progress when reopening
- 🗑️ Clear by regenerating path
- 👤 Per-repository, per-user basis

## Business Value

### For New Developers
- **Confidence**: Clear path, no confusion
- **Speed**: 3-6 hours vs 2+ weeks to productivity
- **Quality**: Learn correct patterns from day 1
- **Engagement**: Gamified learning experience

### For Teams
- **Onboarding Cost**: Reduce senior time from hours to minutes
- **Consistency**: Everyone learns the same way
- **Standards**: Enforces pattern learning
- **Documentation**: Living, always-updated guide

### For Companies
- **ROI**: $3000+ saved per new hire (reduced onboarding time)
- **Quality**: Fewer bugs from misunderstood patterns
- **Retention**: Better first experience → happier devs
- **Scalability**: Onboard 10 devs as easily as 1

## Pricing Justification

**Time Saved Per New Developer:**
- Senior dev mentoring: 8 hours × $100/hr = **$800**
- Faster productivity: 1.5 weeks earlier × $1000/week = **$1500**
- Fewer bugs from wrong patterns: **$500**
- **Total value per onboarding: ~$2800**

**For a team hiring 2 devs/year:**
- Value: $5600/year
- **Pro Tier cost: $149/month × 12 = $1788/year**
- **ROI: 313%**

## Future Enhancements

### 1. **Video Walkthroughs**
- Record screen captures for each step
- Senior dev explains while navigating
- Embed in learning path

### 2. **Live Code Challenges**
- In-browser code editor
- Auto-check solutions
- Instant feedback

### 3. **Team Onboarding Paths**
- Role-specific paths (frontend, backend, fullstack)
- Custom company standards
- Integration with HR systems

### 4. **Mentorship Integration**
- Assign mentor to shadow progress
- Auto-notify on step completion
- Suggest pair programming sessions

### 5. **Onboarding Analytics**
- Track completion rates
- Identify confusing areas
- Improve paths based on data

### 6. **Multi-Language Support**
- Generate paths in developer's language
- Technical terms stay in English
- Improve accessibility

## Implementation Details

### Files
- `/app/api/onboarding/route.ts` - Backend API with Claude streaming
- `/app/dashboard/action/[repo]/action-interface.tsx` - UI integration

### Dependencies
- Anthropic API (Claude Sonnet 4)
- React Flow (for visual path)
- localStorage (progress tracking)
- Supabase (blueprint retrieval)

### Performance
- Generation: 15-30 seconds
- Uses streaming for large repos
- Caches blueprint (no re-analysis needed)
- UI renders progressively

## Usage Instructions

### For Team Leads
1. Analyze repository once
2. New dev joins → Give them access
3. They click "Onboarding"
4. AI generates personalized path
5. Track their progress
6. Ready for first PR in hours

### For New Developers
1. Open repository dashboard
2. Click purple "Onboarding" button
3. Read overview and key takeaways
4. Expand Step 1
5. Read the files listed
6. Complete checkpoints
7. Mark as complete
8. Move to next step
9. Repeat until confident
10. Make first contribution!

---

**Status**: ✅ Fully Implemented
**Version**: 1.0
**Date**: January 2026
**Premium Tier**: Pro ($149/month) or Enterprise
