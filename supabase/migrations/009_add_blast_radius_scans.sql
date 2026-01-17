-- 009_add_blast_radius_scans.sql
-- Add separate tracking for blast radius scans (10 scans) vs regular blueprint scans (5 scans)

-- Add new columns for blast radius scans
ALTER TABLE public.user_usage
ADD COLUMN IF NOT EXISTS blast_radius_scans_used integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS blast_radius_scans_limit integer NOT NULL DEFAULT 10;

-- Update the reset function to also reset blast radius scans
CREATE OR REPLACE FUNCTION check_and_reset_usage(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if period has expired
  UPDATE public.user_usage
  SET 
    scans_used = 0,
    blast_radius_scans_used = 0,
    period_start = now(),
    period_end = now() + interval '1 month',
    last_reset_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id 
    AND period_end < now();
    
  -- Initialize usage record if doesn't exist
  INSERT INTO public.user_usage (
    user_id, 
    scans_used, 
    scans_limit, 
    blast_radius_scans_used, 
    blast_radius_scans_limit
  )
  VALUES (p_user_id, 0, 5, 0, 10)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON COLUMN public.user_usage.scans_used IS 'Number of blueprint analysis scans used (limit: 5)';
COMMENT ON COLUMN public.user_usage.scans_limit IS 'Maximum blueprint analysis scans per period (default: 5)';
COMMENT ON COLUMN public.user_usage.blast_radius_scans_used IS 'Number of blast radius scans used (limit: 10)';
COMMENT ON COLUMN public.user_usage.blast_radius_scans_limit IS 'Maximum blast radius scans per period (default: 10)';
