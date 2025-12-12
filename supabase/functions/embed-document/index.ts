import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Chunk text into overlapping segments
function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);
    
    // Try to end at sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
      }
    }
    
    chunks.push(chunk.trim());
    start += chunk.length - overlap;
    if (start < 0) start = chunk.length;
  }
  
  return chunks.filter(c => c.length > 50);
}

// Get embedding from OpenAI
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embedding error: ${error}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, source, content } = await req.json();
    
    if (!title || !source || !content) {
      throw new Error('Missing required fields: title, source, content');
    }

    console.log(`Processing document: ${title}, source: ${source}, length: ${content.length}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({ title, source, content })
      .select()
      .single();

    if (docError) throw docError;
    console.log(`Document inserted with id: ${doc.id}`);

    // Chunk the content
    const chunks = chunkText(content);
    console.log(`Created ${chunks.length} chunks`);

    // Process chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      
      const embedding = await getEmbedding(chunkText);
      
      const { error: chunkError } = await supabase
        .from('chunks')
        .insert({
          document_id: doc.id,
          chunk_text: chunkText,
          embedding: embedding,
        });

      if (chunkError) {
        console.error(`Error inserting chunk ${i}:`, chunkError);
        throw chunkError;
      }
    }

    console.log(`Successfully processed document with ${chunks.length} chunks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId: doc.id, 
        chunksCreated: chunks.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in embed-document:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
