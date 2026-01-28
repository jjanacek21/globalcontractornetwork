

# Add Anthropic SDK - Options & Recommendation

## Current Situation

Your project already uses the **Lovable AI Gateway** for AI capabilities, which provides access to Google Gemini and OpenAI GPT-5 models without requiring additional API keys or SDKs.

## Important Technical Consideration

The `@anthropic-ai/sdk` is a **server-side SDK** - it's designed for Node.js/Deno backends, not browser environments. Using it in frontend React code would:
- Expose your API key (security risk)
- Fail due to CORS restrictions
- Require a backend proxy anyway

## Options

### Option 1: Add to package.json (Limited Utility)
Add the npm package to the frontend, though it won't work in browser code.

```json
"@anthropic-ai/sdk": "^0.39.0"
```

### Option 2: Create Anthropic Edge Function (Recommended if you need Claude)
Create a new Supabase Edge Function that uses the Anthropic SDK via Deno:

```typescript
// supabase/functions/anthropic-chat/index.ts
import Anthropic from "npm:@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY")
});

// Handle chat requests...
```

This would require adding your `ANTHROPIC_API_KEY` as a secret.

### Option 3: Continue Using Lovable AI Gateway (No Changes)
Your current implementation already works with powerful AI models. No additional SDK needed.

## Recommendation

If you specifically need **Claude** models (Claude 3.5 Sonnet, Claude 3 Opus, etc.), go with **Option 2** - I'll create an edge function that properly uses the Anthropic SDK.

If you just need general AI capabilities, your existing Lovable AI Gateway integration already provides this without extra setup.

---

**Please let me know which option you'd like to proceed with**, and I'll implement it accordingly.

