# Impact Analysis Engine 🎯

## Overview
The Impact Analysis Engine is a premium feature that helps developers understand the ripple effects of code changes before they make them. It analyzes file dependencies across the business logic blueprint and highlights all affected features.

## How It Works

### 1. **Search for File**
- Click "Impact Analysis" button when viewing a blueprint
- Enter any file path from your repository (e.g., `app/auth/actions.ts`)
- Supports partial matches and case-insensitive search

### 2. **Visual Highlighting**
The canvas automatically highlights affected nodes:
- 🔴 **Red Border** = Direct Impact (file is in this feature)
- 🟠 **Orange Border** = Indirect Impact (connected to affected features)
- 🟡 **Yellow Border** = Downstream Dependencies (2nd degree connections)

### 3. **Impact Levels**

#### Direct Impact
Features that contain the target file in their critical files list.
- **Weight**: Highest
- **Risk Multiplier**: 3x
- **Action Required**: Must be tested

#### Indirect Impact
Features that are directly connected to affected features via edges.
- **Weight**: Medium
- **Risk Multiplier**: 1.5x
- **Action Required**: Integration tests recommended

#### Downstream
Features that depend on indirectly affected features.
- **Weight**: Low
- **Risk Multiplier**: 0.5x
- **Action Required**: Monitor for unexpected behavior

### 4. **Risk Scoring Algorithm**

```typescript
score = 0

// Direct nodes
for each direct_node:
  if risk = "High": score += 30
  if risk = "Med": score += 20
  if risk = "Low": score += 10

// Indirect nodes
for each indirect_node:
  if risk = "High": score += 15
  if risk = "Med": score += 10
  if risk = "Low": score += 5

// Downstream nodes
for each downstream_node:
  if risk = "High": score += 5
  if risk = "Med": score += 3
  if risk = "Low": score += 1

total_score = min(score, 100)
```

### 5. **Risk Levels**
- **Critical** (70-100): 🚨 Core features affected, extensive testing required
- **High** (50-69): ⚠️ Multiple important features affected
- **Medium** (25-49): 📊 Some features affected, standard testing
- **Low** (0-24): ✅ Minimal impact, proceed with caution

## Smart Recommendations

The engine provides context-aware recommendations based on:

### Pattern Detection
- **Auth/User features**: Warns about permission checks
- **Payment features**: Extra caution for financial transactions
- **High-risk nodes**: Security review suggested

### Test Coverage
Calculates recommended test suites based on affected features:
```
Recommended: Run 5 feature test suites before deploying
```

### Deployment Strategy
For critical changes (score >= 70):
- Feature flag recommendation
- Gradual rollout strategy
- Extra monitoring

## Example Output

```
IMPACT ANALYSIS: app/auth/actions.ts
Risk Score: 75/100
Risk Level: CRITICAL

DIRECT IMPACT: 2 features
- The User Gateway (High Risk)
- The Session Manager (Med Risk)

INDIRECT IMPACT: 4 features
- The Money Flow
- The Profile Dashboard
- The Admin Panel
- The API Gateway

RECOMMENDATIONS:
🚨 CRITICAL: This change affects core features. Extensive testing required.
🔒 Authentication/Authorization features affected. Verify permission checks.
📊 4 features have indirect dependencies. Update integration tests.
✓ Recommended: Run 6 feature test suites before deploying.
```

## API Endpoint

### POST `/api/impact-analysis`

**Request:**
```json
{
  "repoFullName": "owner/repo",
  "filePath": "app/auth/actions.ts"
}
```

**Response:**
```json
{
  "targetFile": "app/auth/actions.ts",
  "directlyAffectedNodes": [...],
  "indirectlyAffectedNodes": [...],
  "downstreamNodes": [...],
  "totalAffectedFeatures": 6,
  "riskScore": 75,
  "riskLevel": "Critical",
  "recommendations": [...],
  "affectedEdges": [...]
}
```

## UI Features

### Interactive Canvas
- Click highlighted nodes to view details in side panel
- Animated edges show data flow to affected features
- Color-coded highlighting for impact levels

### Impact Panel
- Real-time risk score with color coding
- Breakdown by impact level
- Clickable feature cards
- Actionable recommendations

### Search UX
- Auto-complete suggestions (future)
- Recent searches (future)
- File browser integration (future)

## Business Value

### For Developers
- **Confidence**: Know exactly what breaks before changing code
- **Speed**: No more "let me grep the codebase" sessions
- **Safety**: Catch unexpected dependencies early

### For Teams
- **Onboarding**: New devs understand impact immediately
- **Code Review**: PR reviewers see scope instantly
- **Planning**: Better sprint estimates with impact visibility

### For Managers
- **Risk Management**: Quantified change risk
- **Resource Planning**: Allocate testing resources effectively
- **Quality Metrics**: Track high-impact changes over time

## Future Enhancements

1. **Historical Impact Tracking**
   - See how impact has changed over time
   - Identify growing dependencies

2. **Pre-commit Hooks**
   - Automatically analyze staged files
   - Block high-risk commits without review

3. **Slack/Discord Integration**
   - Post impact analysis to channels
   - Alert relevant team members

4. **ML-Powered Predictions**
   - Learn from past incidents
   - Predict hidden dependencies

5. **GitHub PR Comments**
   - Auto-comment on PRs with impact analysis
   - Block merges for critical changes

## Pricing Tier

This is a **Premium Feature** suitable for:
- **Pro Tier**: $149/month (unlimited analyses)
- **Enterprise**: Custom pricing with API access

## Implementation Details

### Files
- `/app/api/impact-analysis/route.ts` - Backend API
- `/app/dashboard/action/[repo]/action-interface.tsx` - UI integration

### Dependencies
- Requires cached blueprint from `/api/analyze`
- Uses React Flow for visual highlighting
- Integrates with Supabase for data retrieval

### Performance
- Analysis completes in < 200ms for most repos
- Scales to 100+ node blueprints
- No external API calls required

---

**Status**: ✅ Fully Implemented
**Version**: 1.0
**Date**: January 2026
