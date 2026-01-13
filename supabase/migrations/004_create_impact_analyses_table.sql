-- Create table for storing impact analysis results
CREATE TABLE IF NOT EXISTS public.impact_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  repo_full_name text NOT NULL,
  owner text NOT NULL,
  repo text NOT NULL,
  target_file text NOT NULL,
  directly_affected_nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  indirectly_affected_nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  downstream_nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  affected_edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_affected_features integer NOT NULL DEFAULT 0,
  risk_score integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  analyzed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT impact_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT impact_analyses_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT impact_analyses_unique_file UNIQUE (user_id, repo_full_name, target_file)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_impact_analyses_user_repo 
  ON public.impact_analyses(user_id, repo_full_name);

CREATE INDEX IF NOT EXISTS idx_impact_analyses_target_file 
  ON public.impact_analyses(user_id, repo_full_name, target_file);

CREATE INDEX IF NOT EXISTS idx_impact_analyses_analyzed_at 
  ON public.impact_analyses(analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_impact_analyses_risk_level 
  ON public.impact_analyses(risk_level);

-- Enable Row Level Security
ALTER TABLE public.impact_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own impact analyses" 
  ON public.impact_analyses 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own impact analyses" 
  ON public.impact_analyses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own impact analyses" 
  ON public.impact_analyses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own impact analyses" 
  ON public.impact_analyses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.impact_analyses IS 
  'Stores impact analysis results for file changes across repositories';
