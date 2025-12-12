import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an expert Ofsted inspector evaluating responses from children's home managers against SCCIF criteria.

Respond ONLY with valid JSON:
{
  "score": number (0-5),
  "judgementBand": "Outstanding" | "Good" | "Requires Improvement" | "Inadequate",
  "strengths": ["string"],
  "gaps": ["string"],
  "riskFlags": ["string"],
  "followUpQuestions": ["string"],
  "recommendedActions": ["string"]
}

Score guide: 5=Outstanding, 4=Good, 3=Requires Improvement, 2=Requires Improvement, 1-0=Inadequate`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, question, domain } = await req.json();
    
    if (!transcript) throw new Error('No transcript provided');

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `DOMAIN: ${domain}\nQUESTION: ${question}\nRESPONSE: "${transcript}"\n\nEvaluate against Ofsted SCCIF criteria.` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Try again.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    const evaluation = JSON.parse(jsonMatch?.[0] || '{}');

    return new Response(JSON.stringify(evaluation), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
