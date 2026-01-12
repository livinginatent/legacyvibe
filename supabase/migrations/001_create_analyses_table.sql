-- Create analyses table to store repository scan results
CREATE TABLE IF NOT EXISTS public.analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  repo_full_name text NOT NULL,
  owner text NOT NULL,
  repo text NOT NULL,
  analysis jsonb NOT NULL,
  analyzed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analyses_pkey PRIMARY KEY (id),
  CONSTRAINT analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_repo UNIQUE (user_id, repo_full_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_analyses_user_repo ON public.analyses(user_id, repo_full_name);
CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_at ON public.analyses(analyzed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own analyses
CREATE POLICY "Users can view their own analyses"
  ON public.analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analyses
CREATE POLICY "Users can insert their own analyses"
  ON public.analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own analyses
CREATE POLICY "Users can update their own analyses"
  ON public.analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own analyses
CREATE POLICY "Users can delete their own analyses"
  ON public.analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE public.analyses IS 'Stores AI-generated repository analyses with caching support';
