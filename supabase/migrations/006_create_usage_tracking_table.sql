-- Create table for tracking user analysis usage
CREATE TABLE IF NOT EXISTS public.user_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scans_used integer NOT NULL DEFAULT 0,
  scans_limit integer NOT NULL DEFAULT 5, -- 5 scans per month for paid users
  period_start timestamp with time zone NOT NULL DEFAULT now(),
  period_end timestamp with time zone NOT NULL DEFAULT (now() + interval '1 month'),
  last_reset_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_usage_pkey PRIMARY KEY (id),
  CONSTRAINT user_usage_user_id_key UNIQUE (user_id),
  CONSTRAINT user_usage_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id 
  ON public.user_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_user_usage_period 
  ON public.user_usage(period_end);

-- Enable Row Level Security
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own usage" 
  ON public.user_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" 
  ON public.user_usage 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" 
  ON public.user_usage 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to check and reset usage if period expired
CREATE OR REPLACE FUNCTION check_and_reset_usage(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if period has expired
  UPDATE public.user_usage
  SET 
    scans_used = 0,
    period_start = now(),
    period_end = now() + interval '1 month',
    last_reset_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id 
    AND period_end < now();
    
  -- Initialize usage record if doesn't exist
  INSERT INTO public.user_usage (user_id, scans_used, scans_limit)
  VALUES (p_user_id, 0, 5)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON TABLE public.user_usage IS 
  'Tracks analysis usage limits for paid users (5 full scans per month)';
