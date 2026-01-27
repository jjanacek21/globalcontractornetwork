
# Fix Plan: JSON Parsing Robustness for Permit Packet Analyzer

## Problem Summary

The `permit-packet-analyzer` edge function is failing to parse AI responses because:
1. **Token truncation**: AI responses are ~26K+ characters but may be cut off mid-JSON
2. **Greedy regex failure**: The partial extraction regex `/"productApprovals"\s*:\s*\[([\s\S]*?)\]/` fails on truncated arrays because `*?` is non-greedy and matches the first `]` even if it's inside a nested object
3. **Complex schema**: Requesting 7+ categories in one call increases response size and truncation risk

## Solution Architecture

```text
+------------------+     +---------------------+     +-------------------+
| AI Response      | --> | Enhanced JSON       | --> | Incremental       |
| (truncated)      |     | Recovery Logic      |     | Array Extraction  |
+------------------+     +---------------------+     +-------------------+
                                  |
                                  v
                         +---------------------+
                         | Bracket-Aware       |
                         | Array Splitter      |
                         +---------------------+
```

## Implementation Details

### Phase 1: Fix JSON Extraction Logic

Update the `extractJSON` function in `permit-packet-analyzer/index.ts` with:

1. **Increase max_tokens** from 8000 to 16000 to reduce truncation likelihood
2. **Bracket-aware array extraction**: Replace regex with a bracket-counting parser that handles nested objects
3. **Incremental object recovery**: Extract each valid object from truncated arrays rather than failing entirely
4. **Add streaming fallback prompt**: Tell AI to prioritize most important data (products) first

### Phase 2: Enhanced Partial Recovery

Create a new `extractArrayItems` helper that:
- Counts `{` and `}` brackets to find complete objects
- Returns all fully-formed objects from a truncated array
- Logs how many objects were recovered vs. estimated total

### Phase 3: Update Quality Scoring

Adjust quality score calculation to reflect partial extraction:
- 90%+ objects recovered = 0.8 quality
- 50-90% recovered = 0.5 quality  
- Under 50% = 0.3 quality (current behavior for failures)

## Technical Changes

### File: `supabase/functions/permit-packet-analyzer/index.ts`

1. **Increase token limit** (line ~778):
```typescript
max_tokens: 16000, // Increased from 8000
```

2. **Add bracket-aware array extractor** (new helper function):
```typescript
function extractArrayItems(arrayContent: string): any[] {
  const items: any[] = [];
  let depth = 0;
  let currentItem = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < arrayContent.length; i++) {
    const char = arrayContent[i];
    
    if (escapeNext) {
      currentItem += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      currentItem += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') {
        depth--;
        if (depth === 0) {
          currentItem += char;
          try {
            items.push(JSON.parse(currentItem.trim()));
          } catch (e) {
            // Skip malformed item
          }
          currentItem = '';
          continue;
        }
      }
    }
    
    if (depth > 0) {
      currentItem += char;
    }
  }
  
  return items;
}
```

3. **Update Strategy 5 for partial extraction**:
```typescript
// Strategy 5: Bracket-aware extraction of productApprovals
const productStartMatch = cleanContent.match(/"productApprovals"\s*:\s*\[/);
if (productStartMatch) {
  const startIndex = productStartMatch.index! + productStartMatch[0].length;
  const arrayContent = cleanContent.substring(startIndex);
  const products = extractArrayItems(arrayContent);
  
  if (products.length > 0) {
    console.log(`[permit-packet-analyzer] Recovered ${products.length} products from truncated response`);
    // ... return partial result with recovered products
  }
}
```

4. **Add AI prompt optimization** to prioritize most important data:
```typescript
// Add to system prompt:
"PRIORITY ORDER: If response must be truncated, ensure productApprovals array is complete first, then formFieldMappings, then others."
```

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/permit-packet-analyzer/index.ts` | Add `extractArrayItems()` helper, update `extractJSON()` Strategy 5, increase `max_tokens` to 16000, update prompt with priority ordering |

## Expected Outcomes

After implementation:
- Truncated responses will recover 80-90% of product approvals instead of 0%
- Quality scores will accurately reflect partial extraction success
- UI will show "Recovered X of Y products" instead of generic "Parsing failed"
- Fewer "Re-analyze" retries needed

## Post-Implementation Verification

1. Re-analyze the Wellington permit packet that shows 50% quality
2. Verify products are extracted even if other categories fail
3. Confirm quality score reflects actual extraction success
