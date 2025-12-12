
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table for knowledge base
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('SCCIF', 'Regulations', 'Internal Guidance')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chunks table with embeddings
CREATE TABLE public.chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  overall_score NUMERIC(3,1),
  overall_band TEXT
);

-- Session answers table
CREATE TABLE public.session_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_domain TEXT NOT NULL,
  transcript TEXT NOT NULL,
  evaluation_json JSONB NOT NULL,
  attempt_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for similarity search
CREATE INDEX ON public.chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for session lookups
CREATE INDEX idx_session_answers_session_id ON public.session_answers(session_id);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for MVP)
CREATE POLICY "Allow public read on documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert on documents" ON public.documents FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on chunks" ON public.chunks FOR SELECT USING (true);
CREATE POLICY "Allow public insert on chunks" ON public.chunks FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public all on sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on session_answers" ON public.session_answers FOR ALL USING (true) WITH CHECK (true);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chunks.id,
    chunks.document_id,
    chunks.chunk_text,
    1 - (chunks.embedding <=> query_embedding) AS similarity
  FROM chunks
  WHERE chunks.embedding IS NOT NULL
  ORDER BY chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
