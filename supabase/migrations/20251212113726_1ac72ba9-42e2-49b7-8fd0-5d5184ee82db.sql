
-- Move vector extension to separate schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- Fix function search path
CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding extensions.vector(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
