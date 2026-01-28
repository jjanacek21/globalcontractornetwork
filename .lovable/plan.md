

# Use Anthropic API for Permit Document Search

## Overview

Update the `permit-document-search` edge function to use your `ANTHROPIC_API_KEY` directly with Claude models instead of the Lovable AI Gateway.

## What Changes

### Edge Function Update

The `permit-document-search/index.ts` function will be modified to:

1. **Use Anthropic API directly** - Call `https://api.anthropic.com/v1/messages` instead of the Lovable AI Gateway
2. **Use Claude model** - Leverage Claude 3.5 Sonnet (`claude-sonnet-4-20250514`) for permit document searches
3. **Use your ANTHROPIC_API_KEY** - Already configured in your secrets

### API Differences

| Current (Lovable Gateway) | New (Anthropic Direct) |
|---------------------------|------------------------|
| `ai.gateway.lovable.dev/v1/chat/completions` | `api.anthropic.com/v1/messages` |
| OpenAI-compatible format | Anthropic Messages API format |
| `LOVABLE_API_KEY` | `ANTHROPIC_API_KEY` |
| `google/gemini-3-flash-preview` | `claude-sonnet-4-20250514` |

## Technical Implementation

```typescript
// Before: Lovable AI Gateway
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
  body: JSON.stringify({
    model: "google/gemini-3-flash-preview",
    messages: [...]
  })
});

// After: Anthropic API Direct
const response = await fetch("https://api.anthropic.com/v1/messages", {
  headers: {
    "x-api-key": ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  })
});
```

## Response Parsing Adjustment

Anthropic's response format differs from OpenAI:
- OpenAI: `data.choices[0].message.content`
- Anthropic: `data.content[0].text`

The parsing logic will be updated accordingly.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/permit-document-search/index.ts` | Switch from Lovable Gateway to Anthropic API |

## Benefits of Using Claude

- **Your own API key** - Full control over usage and billing
- **Claude's strengths** - Excellent at structured data extraction and following complex instructions
- **Direct access** - No intermediary gateway

