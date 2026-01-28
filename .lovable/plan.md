

# Fix search-and-store-documents Edge Function

## Problem

The current `search-and-store-documents/index.ts` has TypeScript errors:
1. Parameter `c` implicitly has `any` type in `.filter()` and `.map()` calls
2. `error` is of type `unknown` in the catch block

## Solution

Replace the current complex implementation with your simpler, cleaner version that uses the Lovable AI Gateway, with proper TypeScript types added.

## Code to Deploy

Your provided code with TypeScript fixes applied:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Type for content blocks in the response
interface ContentBlock {
  type: string;
  text?: string;
}

serve(async (req) => {
  // ... (your code with these fixes)

  // Fix 1: Add type annotation to filter/map
  responseText = message.content
    .filter((c: ContentBlock) => c.type === 'text')
    .map((c: ContentBlock) => c.text)
    .join('\n')

  // Fix 2: Properly handle unknown error type
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## Key Differences from Current Code

| Aspect | Current (Complex) | Your Version (Simple) |
|--------|-------------------|----------------------|
| API Used | Anthropic Direct | Lovable AI Gateway |
| Features | AI + Firecrawl + Storage | AI Search Only |
| Lines of Code | ~547 | ~120 |
| Purpose | Full orchestration | Document search |

## Files to Modify

| File | Action |
|------|--------|
| `supabase/functions/search-and-store-documents/index.ts` | Replace with your code + TypeScript fixes |

## TypeScript Fixes Applied

1. **ContentBlock interface**: Defines the shape of content blocks in the AI response
2. **Type annotations**: `(c: ContentBlock)` instead of implicit `any`
3. **Error handling**: `error instanceof Error ? error.message : 'Unknown error'`

