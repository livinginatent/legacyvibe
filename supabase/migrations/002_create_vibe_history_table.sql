-- Create vibe_history table to store chat history analysis results
CREATE TABLE IF NOT EXISTS public.vibe_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  repo_full_name text NOT NULL,
  owner text NOT NULL,
  repo text NOT NULL,
  chat_file_name text NOT NULL,
  chat_file_size integer NOT NULL,
  vibe_links jsonb NOT NULL,
  total_messages integer NOT NULL DEFAULT 0,
  total_changes integer NOT NULL DEFAULT 0,
  analyzed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vibe_history_pkey PRIMARY KEY (id),
  CONSTRAINT vibe_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_repo_vibe UNIQUE (user_id, repo_full_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vibe_history_user_repo ON public.vibe_history(user_id, repo_full_name);
CREATE INDEX IF NOT EXISTS idx_vibe_history_analyzed_at ON public.vibe_history(analyzed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.vibe_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own vibe history
CREATE POLICY "Users can view their own vibe history"
  ON public.vibe_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own vibe history
CREATE POLICY "Users can insert their own vibe history"
  ON public.vibe_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own vibe history
CREATE POLICY "Users can update their own vibe history"
  ON public.vibe_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own vibe history
CREATE POLICY "Users can delete their own vibe history"
  ON public.vibe_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE public.vibe_history IS 'Stores chat history analysis linking conversations to code changes';
