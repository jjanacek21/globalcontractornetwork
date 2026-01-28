import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MASTER_SYSTEM_PROMPT = `## Role & Identity
You are an expert AI Building Permit Expediter specializing in Florida jurisdictions.
You function as a senior permit coordinator who has processed thousands of residential
and commercial permit applications across Florida counties and municipalities.

## Core Objective
Your primary objective is to:
1. Analyze all data already entered into the permit portal
2. Identify what is missing, incomplete, inconsistent, or jurisdiction-specific
3. Proactively ask clear, intelligent follow-up questions to close gaps
4. Provide real answers using Florida Building Code and municipal rules
5. Guide the user step-by-step until the permit packet is 100% complete

## Data Awareness
You MUST:
- Reference all existing data provided in the context - NEVER ask for information already provided
- Track permit status: Not Started → In Progress → Missing Items → Ready for Submission
- Be aware of uploaded documents and their validation status

## Jurisdiction Intelligence (Florida-Specific)
You reason based on:
- County and city building departments across Florida
- FBC 7th/8th Edition requirements
- Product Approvals & NOAs (required in HVHZ zones)
- Wind load calculations
- Energy forms (windows/doors)
- Owner-Builder vs Contractor rules
- Notice of Commencement requirements
- Contractor licensing & insurance

## HVHZ Zones (Require NOA Products)
- Miami-Dade County (most areas)
- Broward County (coastal areas)
- Palm Beach County (coastal areas)

## Confidence Levels
For every assertion about requirements, indicate:
- "Required" - Mandatory per code/jurisdiction
- "Commonly Required" - Most jurisdictions require
- "Best Practice" - Recommended but not mandated
- When uncertain, state your confidence percentage (0-100%)

## Response Behavior
- Ask ONE logical question at a time (unless tightly related)
- Explain WHY information is needed and what document/form it affects
- Offer examples or selectable options when helpful
- Use contractor-friendly language, not bureaucratic jargon
- Be concise but thorough

## Document Types You Know
- Notice of Commencement (NOC)
- Contractor License
- Certificate of Insurance (COI)
- Workers Compensation Certificate
- Product Approvals / NOAs
- Signed Contract
- Energy Calculations
- Engineered Drawings
- Roof-to-Wall Mitigation Forms (for jobs >$300k)
- Asbestos Affidavit
- Owner Authorization

## Never Do
- Hallucinate specific municipal requirements without stating confidence
- Give legal advice
- Overwhelm users with too many questions at once
- Ask for information already provided in the context`;

interface PermitContext {
  permit: Record<string, unknown> | null;
  documents: Record<string, unknown>[];
  rules: Record<string, unknown>[];
  training: Record<string, unknown>[];
  knowledge: Record<string, unknown>[];
  rejections: Record<string, unknown>[];
}

// deno-lint-ignore no-explicit-any
async function buildContext(supabase: any, permitId: string): Promise<PermitContext> {
  // Fetch permit project with all data
  const { data: permit } = await supabase
    .from('permit_projects')
    .select('*')
    .eq('id', permitId)
    .single();

  // Fetch uploaded documents
  const { data: documents } = await supabase
    .from('permit_project_documents')
    .select('*')
    .eq('project_id', permitId);

  // Fetch jurisdiction rules if we have a county
  let rules: Record<string, unknown>[] = [];
  const jurisdictionCounty = permit?.jurisdiction_county as string | undefined;
  if (jurisdictionCounty) {
    const { data: rulesData } = await supabase
      .from('building_department_rules')
      .select('*')
      .eq('county', jurisdictionCounty)
      .eq('is_active', true);
    rules = rulesData || [];
  }

  // Fetch training data for this jurisdiction/trade
  let training: Record<string, unknown>[] = [];
  if (jurisdictionCounty) {
    const { data: trainingData } = await supabase
      .from('permit_packet_training')
      .select('extracted_documents, extracted_fields, county, trade_type')
      .eq('county', jurisdictionCounty)
      .limit(5);
    training = trainingData || [];
  }

  // Fetch AI knowledge for this jurisdiction
  let knowledge: Record<string, unknown>[] = [];
  if (jurisdictionCounty) {
    const { data: knowledgeData } = await supabase
      .from('permit_ai_knowledge')
      .select('*')
      .eq('jurisdiction_county', jurisdictionCounty)
      .limit(20);
    knowledge = knowledgeData || [];
  }

  // Fetch rejection patterns for learning
  let rejections: Record<string, unknown>[] = [];
  if (jurisdictionCounty) {
    const { data: rejectionsData } = await supabase
      .from('permit_rejections')
      .select('rejection_reason, rejection_category, resolution')
      .eq('jurisdiction_county', jurisdictionCounty)
      .limit(10);
    rejections = rejectionsData || [];
  }

  return {
    permit,
    documents: documents || [],
    rules,
    training,
    knowledge,
    rejections,
  };
}

function formatContextForPrompt(context: PermitContext): string {
  const { permit, documents, rules, knowledge, rejections } = context;
  
  if (!permit) return "No permit data available.";

  let contextStr = `## CURRENT PERMIT DATA (Already Provided - Do NOT ask for this again)

### Property Information
- Address: ${permit.property_address || 'Not provided'}
- City: ${permit.city || 'Not specified'}
- County/Jurisdiction: ${permit.jurisdiction_county || 'Not specified'}
- Permit Type: ${permit.permit_type || 'Not specified'}
- Valuation: ${permit.valuation ? `$${permit.valuation}` : 'Not provided'}

### Owner Information
- Name: ${permit.owner_name || permit.customer_name || 'Not provided'}
- Email: ${permit.owner_email || permit.customer_email || 'Not provided'}
- Phone: ${permit.owner_phone || permit.customer_phone || 'Not provided'}

### Project Details
- Scope: ${permit.scope_description || 'Not described'}
- Complexity Tier: ${permit.complexity_tier || 'Not set'}
- Expedited: ${permit.expedited ? 'Yes' : 'No'}
- Pipeline Status: ${permit.pipeline_status || 'Unknown'}
- Completion: ${permit.completion_percentage || 0}%

### Uploaded Documents (${documents.length} total)
${documents.length > 0 ? documents.map((d: Record<string, unknown>) => `- ${d.document_type}: ${d.file_name} (${d.validation_status})`).join('\n') : '- No documents uploaded yet'}
`;

  if (rules.length > 0) {
    contextStr += `\n### Jurisdiction-Specific Rules
${rules.map((r: Record<string, unknown>) => `- ${r.rule_type}: ${r.rule_description}`).join('\n')}
`;
  }

  if (knowledge.length > 0) {
    contextStr += `\n### Learned Patterns for ${permit.jurisdiction_county}
${knowledge.map((k: Record<string, unknown>) => `- [${k.knowledge_type}] ${k.pattern_description} (confidence: ${k.confidence})`).join('\n')}
`;
  }

  if (rejections.length > 0) {
    contextStr += `\n### Common Rejection Reasons for ${permit.jurisdiction_county}
${rejections.map((r: Record<string, unknown>) => `- ${r.rejection_reason}${r.resolution ? ` → Resolution: ${r.resolution}` : ''}`).join('\n')}
`;
  }

  return contextStr;
}

function calculateConfidenceScore(context: PermitContext): number {
  const { permit, documents, rules } = context;
  if (!permit) return 0;

  let score = 0;
  const maxScore = 100;

  // Required fields completeness (40 points)
  const requiredFields = [
    'property_address', 'owner_name', 'permit_type', 'jurisdiction_county',
    'scope_description', 'valuation'
  ];
  const filledFields = requiredFields.filter(f => permit[f]);
  score += (filledFields.length / requiredFields.length) * 40;

  // Documents uploaded (30 points)
  const requiredDocTypes = ['noc', 'contract', 'license', 'insurance'];
  const uploadedTypes = documents.map((d: Record<string, unknown>) => d.document_type);
  const matchedDocs = requiredDocTypes.filter(t => uploadedTypes.includes(t));
  score += (matchedDocs.length / requiredDocTypes.length) * 30;

  // Jurisdiction rules satisfied (20 points)
  if (rules.length === 0) {
    score += 20; // No specific rules = assume OK
  } else {
    const docRules = rules.filter((r: Record<string, unknown>) => r.document_required);
    const satisfiedRules = docRules.filter((r: Record<string, unknown>) => 
      uploadedTypes.includes(r.document_required)
    );
    if (docRules.length > 0) {
      score += (satisfiedRules.length / docRules.length) * 20;
    } else {
      score += 20;
    }
  }

  // Valuation provided (10 points)
  if (permit.valuation && Number(permit.valuation) > 0) {
    score += 10;
  }

  return Math.round(Math.min(maxScore, score));
}

async function analyzePermit(context: PermitContext): Promise<Record<string, unknown>> {
  const { permit, documents, rules } = context;
  
  const missingFields: { field: string; reason: string; priority: string }[] = [];
  const missingDocuments: { docType: string; reason: string; priority: string }[] = [];
  const complianceIssues: { issue: string; regulation: string; severity: string }[] = [];
  const suggestedQuestions: string[] = [];

  if (!permit) {
    return { missingFields, missingDocuments, complianceIssues, suggestedQuestions, confidenceScore: 0 };
  }

  // Check required fields
  if (!permit.owner_name && !permit.customer_name) {
    missingFields.push({ field: 'owner_name', reason: 'Property owner name required for permit application', priority: 'high' });
  }
  if (!permit.valuation) {
    missingFields.push({ field: 'valuation', reason: 'Job valuation needed for permit fees calculation', priority: 'high' });
  }
  if (!permit.scope_description) {
    missingFields.push({ field: 'scope_description', reason: 'Scope of work must be detailed for permit review', priority: 'high' });
  }

  // Check required documents
  const uploadedTypes = documents.map((d: Record<string, unknown>) => d.document_type);
  const requiredDocs = [
    { type: 'noc', name: 'Notice of Commencement', reason: 'Required for all permits over $2,500' },
    { type: 'contract', name: 'Signed Contract', reason: 'Proof of contractor-owner agreement' },
    { type: 'license', name: 'Contractor License', reason: 'Valid state license required' },
    { type: 'insurance', name: 'Certificate of Insurance', reason: 'Liability and workers comp proof' },
  ];

  for (const doc of requiredDocs) {
    if (!uploadedTypes.includes(doc.type)) {
      missingDocuments.push({ docType: doc.type, reason: doc.reason, priority: 'high' });
    }
  }

  // Check jurisdiction-specific rules
  for (const rule of rules) {
    if (rule.document_required && !uploadedTypes.includes(rule.document_required)) {
      missingDocuments.push({
        docType: rule.document_required as string,
        reason: rule.rule_description as string,
        priority: 'high',
      });
    }
  }

  // Generate suggested questions
  if (missingFields.length > 0) {
    suggestedQuestions.push(`What is the ${missingFields[0].field.replace(/_/g, ' ')} for this project?`);
  }
  if (!permit.permit_type) {
    suggestedQuestions.push('What type of permit is needed? (roofing, electrical, solar, etc.)');
  }

  const confidenceScore = calculateConfidenceScore(context);

  return {
    missingFields,
    missingDocuments,
    complianceIssues,
    suggestedQuestions,
    confidenceScore,
    completionPercentage: Math.round((1 - (missingFields.length + missingDocuments.length) / 10) * 100),
    packetReady: missingFields.length === 0 && missingDocuments.length === 0,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, permitId, messages, conversationHistory } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build context if we have a permit ID
    let context: PermitContext = { permit: null, documents: [], rules: [], training: [], knowledge: [], rejections: [] };
    if (permitId) {
      context = await buildContext(supabase, permitId);
    }

    // Handle different actions
    switch (action) {
      case 'analyze': {
        const analysis = await analyzePermit(context);
        
        // Update permit with confidence score
        if (permitId && context.permit) {
          await supabase
            .from('permit_projects')
            .update({
              ai_confidence_score: analysis.confidenceScore,
              ai_analysis_timestamp: new Date().toISOString(),
            })
            .eq('id', permitId);
        }

        return new Response(JSON.stringify({ success: true, data: analysis }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'getConfidence': {
        const confidenceScore = calculateConfidenceScore(context);
        return new Response(JSON.stringify({ success: true, confidenceScore }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'chat':
      default: {
        if (!lovableKey) {
          throw new Error("LOVABLE_API_KEY is not configured");
        }

        const contextPrompt = formatContextForPrompt(context);
        const analysis = await analyzePermit(context);

        const systemMessages = [
          { role: "system", content: MASTER_SYSTEM_PROMPT },
          { role: "system", content: contextPrompt },
          { role: "system", content: `## CURRENT ANALYSIS
Confidence Score: ${analysis.confidenceScore}%
Missing Fields: ${(analysis.missingFields as { field: string }[]).map(f => f.field).join(', ') || 'None'}
Missing Documents: ${(analysis.missingDocuments as { docType: string }[]).map(d => d.docType).join(', ') || 'None'}
Packet Ready: ${analysis.packetReady ? 'Yes' : 'No'}` },
        ];

        const chatMessages = messages || conversationHistory || [];

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            messages: [...systemMessages, ...chatMessages],
            stream: true,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (response.status === 402) {
            return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds." }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          const text = await response.text();
          console.error("AI gateway error:", response.status, text);
          throw new Error("AI gateway error");
        }

        return new Response(response.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
    }
  } catch (error) {
    console.error("permit-expediter-brain error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
