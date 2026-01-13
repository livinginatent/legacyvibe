-- Create table for storing onboarding learning paths
CREATE TABLE IF NOT EXISTS public.onboarding_paths (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  repo_full_name text NOT NULL,
  owner text NOT NULL,
  repo text NOT NULL,
  user_level text NOT NULL DEFAULT 'intermediate',
  focus_area text,
  learning_path jsonb NOT NULL,
  total_steps integer NOT NULL DEFAULT 0,
  estimated_total_time integer NOT NULL DEFAULT 0,
  overview text,
  key_takeaways jsonb,
  generated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT onboarding_paths_pkey PRIMARY KEY (id),
  CONSTRAINT onboarding_paths_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT onboarding_paths_unique_repo UNIQUE (user_id, repo_full_name, user_level)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_paths_user_repo 
  ON public.onboarding_paths(user_id, repo_full_name);

CREATE INDEX IF NOT EXISTS idx_onboarding_paths_generated_at 
  ON public.onboarding_paths(generated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.onboarding_paths ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own onboarding paths" 
  ON public.onboarding_paths 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding paths" 
  ON public.onboarding_paths 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding paths" 
  ON public.onboarding_paths 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding paths" 
  ON public.onboarding_paths 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.onboarding_paths IS 
  'Stores AI-generated onboarding learning paths for repositories';
