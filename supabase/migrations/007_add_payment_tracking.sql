-- Add payment tracking columns to user_usage table
ALTER TABLE public.user_usage
ADD COLUMN IF NOT EXISTS has_paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_id text,
ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_amount integer, -- Amount in cents (1499 = $14.99)
ADD COLUMN IF NOT EXISTS payment_status text; -- 'pending', 'succeeded', 'failed'

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_user_usage_payment_id 
  ON public.user_usage(payment_id) 
  WHERE payment_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.user_usage.has_paid IS 
  'Whether user has completed the one-time $14.99 payment';
COMMENT ON COLUMN public.user_usage.payment_id IS 
  'Dodo Payments payment ID';
COMMENT ON COLUMN public.user_usage.payment_amount IS 
  'Payment amount in cents (1499 = $14.99)';
