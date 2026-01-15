# Dodo Payments Integration Setup Guide 💳

## Overview

This guide explains how to set up Dodo Payments for one-time $14.99 payments to unlock 5 repository scans.

**Now uses the official `dodopayments` SDK and `standardwebhooks` for proper verification.**

---

## ✅ What's Implemented

### 1. **Dodo SDK Client**

File: `lib/dodo/server.ts`

**Features**:

- ✅ Lazy-initialized Dodo Payments SDK client
- ✅ Automatic test/live mode switching via `DODO_LIVE_MODE`
- ✅ Centralized configuration

### 2. **Supabase Admin Client**

File: `lib/supabase/admin.ts`

**Features**:

- ✅ Service role client for webhook operations
- ✅ Bypasses RLS for admin updates

### 3. **Database Migration**

File: `supabase/migrations/007_add_payment_tracking.sql`

**Features**:

- ✅ Adds `has_paid` column to track payment status
- ✅ Stores `payment_id`, `payment_date`, `payment_amount`, `payment_status`
- ✅ Indexes for payment lookups

**Apply Migration**:

```bash
# Apply via Supabase dashboard SQL editor or CLI
psql <your-connection-string> < supabase/migrations/007_add_payment_tracking.sql
```

### 4. **Checkout Session API**

File: `app/api/payments/create-checkout/route.ts`

**Features**:

- ✅ Uses official `dodopayments` SDK
- ✅ Supports test/live modes via `DODO_LIVE_MODE` environment variable
- ✅ Returns checkout URL for redirect
- ✅ Detailed error logging for debugging
- ✅ Prevents duplicate payments

### 5. **Webhook Handler**

File: `app/api/payments/webhook/route.ts`

**Features**:

- ✅ Uses `standardwebhooks` library for proper signature verification
- ✅ Processes `payment.succeeded` events
- ✅ Updates user payment status and grants 5 scans
- ✅ Handles payment failures

### 6. **Payment Success Page**

File: `app/dashboard/action/payment-success/page.tsx`

**Features**:

- ✅ Auto-polls for payment confirmation
- ✅ Shows available scans
- ✅ Redirects to dashboard

### 7. **Usage Gating**

File: `app/api/analyze/route.ts`

**Features**:

- ✅ Checks `has_paid` before allowing scans
- ✅ Returns `PAYMENT_REQUIRED` (402) if not paid
- ✅ Returns `USAGE_LIMIT_REACHED` (429) when scans exhausted
- ✅ Prompts for re-payment when limit reached

### 8. **Paywall UI**

File: `app/dashboard/action/[repo]/action-interface.tsx`

**Features**:

- ✅ Modal paywall when payment required
- ✅ Shows $14.99 pricing and benefits
- ✅ Redirects to Dodo Payments hosted checkout
- ✅ Handles payment errors

---

## 🔧 Environment Variables

Add these to your `.env.local` (and production environment):

```bash
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_api_key_here     # API key from Dodo dashboard
DODO_PAYMENTS_PRODUCT_ID=prod_xxxxx          # Product ID from Dodo dashboard
DODO_LIVE_MODE=true                          # Set to "true" for production
DODO_WEBHOOK_SECRET=your_webhook_secret_here # Webhook secret from Dodo

# Supabase (required for webhook admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site URL (required for checkout return URL)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Environment Mode

- **Test Mode** (default): Set `DODO_LIVE_MODE=false` or omit it

  - Use test API key from Dodo dashboard
  - Test product ID from test mode
  - Test webhook secret

- **Live Mode**: Set `DODO_LIVE_MODE=true`
  - Use **live** API key from Dodo dashboard
  - **Live** product ID (create product in live mode)
  - **Live** webhook secret

⚠️ **Important**: Test and Live modes have separate:

- API keys
- Product IDs
- Webhook secrets

Make sure all three match the same environment!

### Getting Your Credentials

1. **API Key**:

   - Go to [Dodo Payments Dashboard](https://app.dodopayments.com/)
   - Navigate to **Developer > API**
   - Toggle to **Live** mode if going to production
   - Generate and copy your API key

2. **Product ID**:

   - Go to **Products** in dashboard
   - Toggle to **Live** mode if going to production
   - Create a product with price **$14.99** (one-time payment)
   - Copy the Product ID (starts with `prod_`)

3. **Webhook Secret**:
   - Go to **Developer > Webhooks**
   - Toggle to **Live** mode if going to production
   - Create webhook URL: `https://your-domain.com/api/payments/webhook`
   - Copy the webhook secret key

---

## 🚀 Setup Steps

### Step 1: Install Dependencies

```bash
npm install dodopayments standardwebhooks
```

### Step 2: Create Product in Dodo Dashboard

1. Log into [Dodo Payments Dashboard](https://app.dodopayments.com/)
2. **Toggle to Live mode** if deploying to production
3. Go to **Products**
4. Click **Create Product**
5. Set:
   - **Name**: "Cadracode - 5 Scans"
   - **Price**: $14.99
   - **Type**: One-time payment
6. Copy the **Product ID** (e.g., `prod_abc123`)

### Step 3: Configure Webhook

1. Go to **Developer > Webhooks**
2. **Toggle to Live mode** if deploying to production
3. Click **Create Webhook**
4. Set:
   - **URL**: `https://your-domain.com/api/payments/webhook`
   - **Events**: Select `payment.succeeded` and `payment.failed`
5. Copy the **Webhook Secret Key**

### Step 4: Set Environment Variables

Add to your production environment (Vercel, etc.):

```bash
# Dodo Payments - LIVE MODE
DODO_PAYMENTS_API_KEY=sk_live_xxxxx      # LIVE API key
DODO_PAYMENTS_PRODUCT_ID=prod_xxxxx      # LIVE product ID
DODO_LIVE_MODE=true                       # Enable live mode
DODO_WEBHOOK_SECRET=whsec_xxxxx          # LIVE webhook secret

# Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...      # Service role key

# Site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Step 5: Apply Database Migration

Run the migration to add payment tracking columns:

```sql
-- Run via Supabase SQL editor
ALTER TABLE public.user_usage
ADD COLUMN IF NOT EXISTS has_paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_id text,
ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_amount integer,
ADD COLUMN IF NOT EXISTS payment_status text;

CREATE INDEX IF NOT EXISTS idx_user_usage_payment_id
  ON public.user_usage(payment_id)
  WHERE payment_id IS NOT NULL;
```

### Step 6: Deploy and Test

1. **Deploy** your application
2. **Test the payment flow**:

   - Click "START ANALYSIS" on a repo
   - Should see the paywall modal
   - Click "Pay $14.99"
   - Complete payment on Dodo checkout
   - Should redirect to success page
   - Check that `has_paid = true` in database

3. **Verify Webhook**:
   - Check webhook deliveries in Dodo dashboard
   - Verify payment status updates in database

---

## 🎯 User Flow

### **First-Time User**

```
User clicks "START ANALYSIS"
         ↓
Check payment: has_paid = false
         ↓
Show paywall modal
         ↓
User clicks "Pay $14.99"
         ↓
Redirect to Dodo Payments checkout
         ↓
User completes payment
         ↓
Webhook updates has_paid = true, grants 5 scans
         ↓
Redirect to success page
         ↓
User can now analyze repositories
```

### **User Hits Limit**

```
User uses all 5 scans
         ↓
Tries to analyze again
         ↓
Check: scans_used >= scans_limit
         ↓
Show paywall modal
         ↓
User pays $14.99 again
         ↓
Webhook resets scans_used = 0, grants 5 more scans
```

---

## 🔒 Security Notes

1. **Webhook Verification**: Now uses the official `standardwebhooks` library for proper HMAC signature verification.

2. **Service Role**: The webhook handler uses `SUPABASE_SERVICE_ROLE_KEY` to update user records, bypassing RLS.

3. **Payment Amount**: Configured in Dodo dashboard. The webhook receives the actual amount from the event.

---

## 🐛 Troubleshooting

### Payment Not Processing

- **Check API Key**: Verify `DODO_PAYMENTS_API_KEY` is correct
- **Check Product ID**: Ensure `DODO_PAYMENTS_PRODUCT_ID` matches dashboard
- **Check Environment**: Verify `DODO_PAYMENTS_ENVIRONMENT` matches API key type

### Webhook Not Receiving Events

- **Check Webhook URL**: Must be publicly accessible (use ngrok for local testing)
- **Check Webhook Secret**: Verify `DODO_WEBHOOK_KEY` matches dashboard
- **Check Logs**: Review webhook delivery logs in Dodo dashboard

### Payment Status Not Updating

- **Check Database**: Verify migration applied successfully
- **Check RLS**: Ensure webhook can update `user_usage` table
- **Check Logs**: Review server logs for webhook processing errors

---

## 📝 Next Steps

1. ✅ Implement proper Standard Webhooks verification
2. ✅ Add payment history page for users
3. ✅ Add email notifications on payment success
4. ✅ Add refund handling (if needed)

---

## 📚 Resources

- [Dodo Payments Documentation](https://docs.dodopayments.com/)
- [Standard Webhooks Spec](https://standardwebhooks.com/)
- [Dodo Payments Dashboard](https://app.dodopayments.com/)
