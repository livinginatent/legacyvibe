-- Create table for storing generated documentation
CREATE TABLE IF NOT EXISTS public.generated_documentation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  repo_full_name text NOT NULL,
  owner text NOT NULL,
  repo text NOT NULL,
  format text NOT NULL DEFAULT 'markdown', -- 'markdown' or 'mdx'
  content text NOT NULL,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb, -- Structured sections for partial updates
  file_count integer NOT NULL DEFAULT 0,
  feature_count integer NOT NULL DEFAULT 0,
  total_lines integer NOT NULL DEFAULT 0,
  generated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT generated_documentation_pkey PRIMARY KEY (id),
  CONSTRAINT generated_documentation_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT generated_documentation_unique_repo UNIQUE (user_id, repo_full_name, format)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_documentation_user_repo 
  ON public.generated_documentation(user_id, repo_full_name);

CREATE INDEX IF NOT EXISTS idx_generated_documentation_generated_at 
  ON public.generated_documentation(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_documentation_format 
  ON public.generated_documentation(format);

-- Enable Row Level Security
ALTER TABLE public.generated_documentation ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own documentation" 
  ON public.generated_documentation 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documentation" 
  ON public.generated_documentation 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documentation" 
  ON public.generated_documentation 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documentation" 
  ON public.generated_documentation 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.generated_documentation IS 
  'Stores auto-generated documentation for repositories in Markdown/MDX format';
