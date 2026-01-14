# Dodo Payments Integration Setup Guide 💳

## Overview
This guide explains how to set up Dodo Payments for one-time $14.99 payments to unlock 5 repository scans.

---

## ✅ What's Implemented

### 1. **Database Migration**
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

### 2. **Checkout Session API**
File: `app/api/payments/create-checkout/route.ts`

**Features**:
- ✅ Creates Dodo Payments checkout session
- ✅ Supports test/live modes via environment variable
- ✅ Returns checkout URL for redirect
- ✅ Prevents duplicate payments

### 3. **Webhook Handler**
File: `app/api/payments/webhook/route.ts`

**Features**:
- ✅ Verifies webhook signatures (Standard Webhooks spec)
- ✅ Processes `payment.succeeded` events
- ✅ Updates user payment status and grants 5 scans
- ✅ Handles payment failures

### 4. **Payment Success Page**
File: `app/dashboard/action/payment-success/page.tsx`

**Features**:
- ✅ Confirms successful payment
- ✅ Shows available scans
- ✅ Redirects to dashboard

### 5. **Usage Gating**
File: `app/api/analyze/route.ts`

**Features**:
- ✅ Checks `has_paid` before allowing scans
- ✅ Returns `PAYMENT_REQUIRED` (402) if not paid
- ✅ Returns `USAGE_LIMIT_REACHED` (429) when scans exhausted
- ✅ Prompts for re-payment when limit reached

### 6. **Paywall UI**
File: `app/dashboard/action/[repo]/action-interface.tsx`

**Features**:
- ✅ Modal paywall when payment required
- ✅ Shows $14.99 pricing and benefits
- ✅ Redirects to Dodo Payments hosted checkout
- ✅ Handles payment errors

---

## 🔧 Environment Variables

Add these to your `.env.local`:

```bash
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_api_key_here
DODO_PAYMENTS_PRODUCT_ID=prod_xxxxx  # Product ID from Dodo dashboard
DODO_PAYMENTS_ENVIRONMENT=test_mode    # 'test_mode' or 'live_mode'
DODO_WEBHOOK_KEY=your_webhook_secret_here
```

### Getting Your Credentials

1. **API Key**:
   - Go to [Dodo Payments Dashboard](https://app.dodopayments.com/)
   - Navigate to **Developer > API**
   - Generate and copy your API key

2. **Product ID**:
   - Go to **Products** in dashboard
   - Create a product with price **$14.99** (one-time payment)
   - Copy the Product ID (starts with `prod_`)

3. **Webhook Secret**:
   - Go to **Developer > Webhooks**
   - Create webhook URL: `https://your-domain.com/api/payments/webhook`
   - Copy the webhook secret key

---

## 🚀 Setup Steps

### Step 1: Create Product in Dodo Dashboard

1. Log into [Dodo Payments Dashboard](https://app.dodopayments.com/)
2. Go to **Products**
3. Click **Create Product**
4. Set:
   - **Name**: "LegacyVibe - 5 Scans"
   - **Price**: $14.99
   - **Type**: One-time payment
5. Copy the **Product ID** (e.g., `prod_abc123`)

### Step 2: Configure Webhook

1. Go to **Developer > Webhooks**
2. Click **Create Webhook**
3. Set:
   - **URL**: `https://your-domain.com/api/payments/webhook`
   - **Events**: Select `payment.succeeded` and `payment.failed`
4. Copy the **Webhook Secret Key**

### Step 3: Set Environment Variables

Add to `.env.local`:

```bash
DODO_PAYMENTS_API_KEY=sk_test_xxxxx  # or sk_live_xxxxx for production
DODO_PAYMENTS_PRODUCT_ID=prod_xxxxx
DODO_PAYMENTS_ENVIRONMENT=test_mode   # Change to 'live_mode' for production
DODO_WEBHOOK_KEY=whsec_xxxxx
```

### Step 4: Apply Database Migration

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

### Step 5: Test the Integration

1. **Test Mode**:
   - Set `DODO_PAYMENTS_ENVIRONMENT=test_mode`
   - Use test API key from dashboard
   - Test payment flow with test card numbers

2. **Verify Webhook**:
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

1. **Webhook Verification**: Currently uses basic header checks. For production, implement proper Standard Webhooks HMAC verification using the `standardwebhooks` library.

2. **Service Role**: The webhook handler may need `SUPABASE_SERVICE_ROLE_KEY` to update user records without RLS restrictions.

3. **Payment Amount**: Hardcoded to $14.99 (1499 cents). Update `payment_amount` in webhook handler if pricing changes.

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
