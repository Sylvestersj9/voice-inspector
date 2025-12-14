import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const baseCors = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const buildCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";

  const allowAny = allowedOrigins.length === 0 || allowedOrigins.includes("*");
  if (allowAny) {
    return { ...baseCors, "Access-Control-Allow-Origin": origin || "*" };
  }

  if (origin && allowedOrigins.includes(origin)) {
    return { ...baseCors, "Access-Control-Allow-Origin": origin };
  }

  // If we don't recognize the origin, still echo it back to avoid blocking beta traffic.
  if (origin) {
    return { ...baseCors, "Access-Control-Allow-Origin": origin };
  }

  return { ...baseCors, "Access-Control-Allow-Origin": allowedOrigins[0] };
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

const evaluationSchema = z.object({
  score_0_to_5: z.number().min(0).max(5),
  judgement_band: z.enum(["Outstanding", "Good", "Requires Improvement", "Inadequate"]),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  risk_flags: z.array(z.string()).default([]),
  recommended_actions: z.array(z.string()).default([]),
  follow_up_question: z.string().optional().default(""),
  framework_alignment: z.array(z.string()).default([]),
  missing_expectations: z.array(z.string()).default([]),
  evidence_used: z.array(z.string()).default([]),
});

const buildSystemPrompt = (frameworkContext: string[]) => {
  const contextSection = frameworkContext.length > 0 
    ? `\n\nFRAMEWORK CONTEXT (use this to ground your evaluation):\n${frameworkContext.map((c, i) => `[${i+1}] ${c}`).join('\n\n')}`
    : '';

  return `You are an expert Ofsted inspector evaluating responses from children's home managers against SCCIF criteria.
${contextSection}

Respond ONLY with valid JSON matching this schema:
{
  "score_0_to_5": number between 0 and 5,
  "judgement_band": "Outstanding" | "Good" | "Requires Improvement" | "Inadequate",
  "strengths": ["string"],
  "gaps": ["string"],
  "risk_flags": ["string"],
  "recommended_actions": ["string"],
  "follow_up_question": "string",
  "framework_alignment": ["string"],
  "missing_expectations": ["string"],
  "evidence_used": ["string"]
}

Rules:
- ALWAYS return valid JSON (no markdown, no commentary).
- Keep arrays concise (max 5 items each).
- If the response is weak or incomplete, set score_0_to_5 accordingly and use follow_up_question to probe the biggest gap.
- Reference the framework context when available.`;
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

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
    const rawEvaluation = JSON.parse(jsonMatch?.[0] || '{}');

    const normalized = {
      score_0_to_5: rawEvaluation.score_0_to_5 ?? rawEvaluation.score ?? 0,
      judgement_band: rawEvaluation.judgement_band ?? rawEvaluation.judgementBand ?? 'Inadequate',
      strengths: rawEvaluation.strengths ?? [],
      gaps: rawEvaluation.gaps ?? [],
      risk_flags: rawEvaluation.risk_flags ?? rawEvaluation.riskFlags ?? [],
      recommended_actions: rawEvaluation.recommended_actions ?? rawEvaluation.recommendedActions ?? [],
      follow_up_question: rawEvaluation.follow_up_question ?? rawEvaluation.followUpQuestion ?? rawEvaluation.followUpQuestions?.[0] ?? '',
      framework_alignment: rawEvaluation.framework_alignment ?? rawEvaluation.frameworkAlignment ?? [],
      missing_expectations: rawEvaluation.missing_expectations ?? rawEvaluation.missingExpectations ?? [],
      evidence_used: rawEvaluation.evidence_used ?? rawEvaluation.evidenceUsed ?? [],
    };

    const parsed = evaluationSchema.safeParse(normalized);

    if (!parsed.success) {
      console.error('Evaluation schema validation failed', parsed.error);
      return new Response(JSON.stringify({ error: 'Model returned invalid evaluation shape' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = {
      score: parsed.data.score_0_to_5,
      judgementBand: parsed.data.judgement_band,
      strengths: parsed.data.strengths,
      gaps: parsed.data.gaps,
      riskFlags: parsed.data.risk_flags,
      followUpQuestions: parsed.data.follow_up_question ? [parsed.data.follow_up_question] : [],
      recommendedActions: parsed.data.recommended_actions,
      frameworkAlignment: parsed.data.framework_alignment,
      missingExpectations: parsed.data.missing_expectations,
      evidenceUsed: parsed.data.evidence_used,
      schemaVersion: "phase2-v1",
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
