import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    console.error('Embedding error:', await response.text());
    throw new Error('Failed to generate embedding');
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

async function getRelevantContext(supabase: any, question: string, transcript: string): Promise<string[]> {
  try {
    // Create query combining question and transcript for better semantic matching
    const query = `${question}\n\nResponse: ${transcript}`;
    const queryEmbedding = await getEmbedding(query);

    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_count: 6,
    });

    if (error) {
      console.error('Chunk search error:', error);
      return [];
    }

    return chunks?.map((c: any) => c.chunk_text) || [];
  } catch (error) {
    console.error('Context retrieval error:', error);
    return [];
  }
}

const buildSystemPrompt = (frameworkContext: string[]) => {
  const contextSection = frameworkContext.length > 0 
    ? `\n\nFRAMEWORK CONTEXT (use this to ground your evaluation):\n${frameworkContext.map((c, i) => `[${i+1}] ${c}`).join('\n\n')}`
    : '';

  return `You are an expert Ofsted inspector evaluating responses from children's home managers against SCCIF criteria.
${contextSection}

Respond ONLY with valid JSON matching this schema:
{
  "score": number (0-5),
  "judgementBand": "Outstanding" | "Good" | "Requires Improvement" | "Inadequate",
  "strengths": ["string"],
  "gaps": ["string"],
  "riskFlags": ["string"],
  "followUpQuestions": ["string"],
  "recommendedActions": ["string"],
  "frameworkAlignment": ["string"],
  "missingExpectations": ["string"],
  "evidenceUsed": ["string"]
}

Field guidance:
- score: 5=Outstanding, 4=Good, 3=Requires Improvement, 2=Requires Improvement, 1-0=Inadequate
- frameworkAlignment: bullet points explaining which framework expectations were demonstrated
- missingExpectations: specific framework requirements not evidenced in the response
- evidenceUsed: short quotes or paraphrases from the framework context that informed your evaluation
- followUpQuestions: questions an inspector would ask to probe gaps (max 3)

Be specific, professional, and constructive. Reference the framework context when available.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, question, domain } = await req.json();
    
    if (!transcript) throw new Error('No transcript provided');

    console.log(`Evaluating response for domain: ${domain}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get relevant framework context
    const frameworkContext = await getRelevantContext(supabase, question, transcript);
    console.log(`Retrieved ${frameworkContext.length} framework chunks`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: buildSystemPrompt(frameworkContext) },
          { role: 'user', content: `DOMAIN: ${domain}\nQUESTION: ${question}\nRESPONSE: "${transcript}"\n\nEvaluate against Ofsted SCCIF criteria.` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Try again.' }), { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    const evaluation = JSON.parse(jsonMatch?.[0] || '{}');

    // Ensure all expected fields exist
    const result = {
      score: evaluation.score ?? 0,
      judgementBand: evaluation.judgementBand ?? 'Inadequate',
      strengths: evaluation.strengths ?? [],
      gaps: evaluation.gaps ?? [],
      riskFlags: evaluation.riskFlags ?? [],
      followUpQuestions: evaluation.followUpQuestions ?? [],
      recommendedActions: evaluation.recommendedActions ?? [],
      frameworkAlignment: evaluation.frameworkAlignment ?? [],
      missingExpectations: evaluation.missingExpectations ?? [],
      evidenceUsed: evaluation.evidenceUsed ?? [],
    };

    console.log(`Evaluation complete: score=${result.score}, band=${result.judgementBand}`);

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Evaluation error:', message);
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
