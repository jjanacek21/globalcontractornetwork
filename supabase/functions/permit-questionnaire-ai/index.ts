import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionnaireRequest {
  action: 'generateQuestion' | 'validateAnswer' | 'saveAnswers';
  permitId: string;
  field?: string;
  answer?: string;
  permitType?: string;
  jurisdiction?: string;
  collectedAnswers?: Record<string, string>;
  missingFields?: Array<{ field: string; description: string; priority: string }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: QuestionnaireRequest = await req.json();
    const { action, permitId, field, answer, permitType, jurisdiction, collectedAnswers, missingFields } = request;

    console.log('Questionnaire request:', { action, permitId, field });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'validateAnswer') {
      // Validate the user's answer using AI
      const validationResult = await validateAnswerWithAI(field!, answer!, permitType!, jurisdiction!);
      
      return new Response(JSON.stringify(validationResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generateQuestion') {
      // Generate a natural language question for the field
      const question = await generateQuestionWithAI(field!, permitType!, jurisdiction!);
      
      return new Response(JSON.stringify({ question }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'saveAnswers') {
      // Save all collected answers to the permit project
      const { data: permit } = await supabase
        .from('permit_projects')
        .select('form_data')
        .eq('id', permitId)
        .single();

      const currentFormData = (permit?.form_data as Record<string, unknown>) || {};
      const updatedFormData = { ...currentFormData, ...collectedAnswers };

      const { error } = await supabase
        .from('permit_projects')
        .update({ form_data: updatedFormData })
        .eq('id', permitId);

      if (error) {
        throw new Error(`Failed to save answers: ${error.message}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Questionnaire error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function validateAnswerWithAI(
  field: string,
  answer: string,
  permitType: string,
  jurisdiction: string
): Promise<{
  isValid: boolean;
  correctedValue?: string;
  feedback: string;
  fieldMapping?: string;
}> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    // Fallback: Accept the answer if AI is unavailable
    console.log('No LOVABLE_API_KEY, accepting answer as-is');
    return {
      isValid: true,
      correctedValue: answer,
      feedback: '✓ Got it!',
    };
  }

  try {
    const prompt = `You are validating a user's answer for a Florida ${permitType} permit application in ${jurisdiction}.

Field being answered: ${field}
User's answer: ${answer}

Validate the answer and respond with a JSON object containing:
- isValid: boolean (true if the answer is acceptable)
- correctedValue: string (the normalized/cleaned version of the answer, e.g., format phone numbers, dates, etc.)
- feedback: string (a brief, friendly confirmation or correction request)
- fieldMapping: string (the database field name this maps to)

For validation:
- Phone numbers should be 10 digits (accept various formats)
- Dates should be recognizable (accept various formats, normalize to MM/DD/YYYY)
- Measurements should include units (feet, inches, etc.)
- Dollar amounts should be numeric
- License numbers should follow Florida format patterns

Be lenient and helpful. If the answer is close but needs minor formatting, accept it and provide the corrected value.

Respond ONLY with the JSON object, no other text.`;

    const response = await fetch('https://api.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if parsing fails
    return {
      isValid: true,
      correctedValue: answer,
      feedback: '✓ Got it!',
    };

  } catch (error) {
    console.error('AI validation error:', error);
    // Fallback: Accept the answer
    return {
      isValid: true,
      correctedValue: answer,
      feedback: '✓ Got it!',
    };
  }
}

async function generateQuestionWithAI(
  field: string,
  permitType: string,
  jurisdiction: string
): Promise<string> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  // Fallback question generation without AI
  const fallbackQuestions: Record<string, string> = {
    'mean_roof_height': 'What is the mean roof height of the building?',
    'roof_slope': 'What is the roof slope or pitch?',
    'building_sqft': 'What is the total square footage of the building?',
    'property_value': 'What is the estimated property value or project valuation?',
    'contractor_license': 'What is your Florida contractor license number?',
    'owner_phone': 'What is the property owner\'s phone number?',
    'owner_email': 'What is the property owner\'s email address?',
  };

  if (!lovableApiKey) {
    return fallbackQuestions[field] || `Please provide the ${field.replace(/_/g, ' ')}`;
  }

  try {
    const prompt = `Generate a friendly, conversational question to ask a user for the following permit application field:

Field: ${field}
Permit Type: ${permitType}
Jurisdiction: ${jurisdiction}

The question should:
1. Be in plain English (not technical jargon)
2. Include an example of the expected format if applicable
3. Be concise (one sentence)

Respond with ONLY the question, no other text.`;

    const response = await fetch('https://api.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || fallbackQuestions[field] || `Please provide the ${field.replace(/_/g, ' ')}`;

  } catch (error) {
    console.error('AI question generation error:', error);
    return fallbackQuestions[field] || `Please provide the ${field.replace(/_/g, ' ')}`;
  }
}
