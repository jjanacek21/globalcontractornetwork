## Fix two Phase 2 wizard bugs

### Bug 1 — ZIP parser grabs street number

`src/pages/PermitQueensNewRequest.tsx` (~line 451) regexes the formatted address with `\b(\d{5})\b`, which matches the leading street number ("15361 62nd Place North…") before the actual ZIP ("33470"). Addresses come from Mapbox (not Google Places), so use the structured `context` array instead of regexing.

**Change `PermitAddressInput.tsx`** — extend the `onJurisdictionDetected` signature to also pass the Mapbox `context` and `place_name`:

```ts
// In handleSelectResult (line ~96), pass the full result through
onJurisdictionDetected(info, fullAddress, result.context);
```

And update the prop type:

```ts
onJurisdictionDetected: (
  info: JurisdictionInfo,
  fullAddress: string,
  context?: Array<{ id: string; text: string; short_code?: string }>,
) => void;
```

**Change `handleJurisdictionDetected` in `PermitQueensNewRequest.tsx`** — read ZIP from context first, then fall back to the *last* 5-digit token in the formatted string (never the first):

```ts
const handleJurisdictionDetected = async (
  info: JurisdictionInfo,
  fullAddress?: string,
  context?: Array<{ id: string; text: string; short_code?: string }>,
) => {
  const addr = fullAddress || formData.property_address;

  // Prefer Mapbox postcode context entry
  let zip = '';
  const postcodeCtx = context?.find((c) => c.id?.startsWith('postcode'));
  if (postcodeCtx?.text) zip = postcodeCtx.text.match(/\d{5}/)?.[0] ?? '';

  // Fallback: last 5-digit token in the string (skips street numbers)
  if (!zip) {
    const all = [...addr.matchAll(/\b(\d{5})(?:-\d{4})?\b/g)].map((m) => m[1]);
    zip = all[all.length - 1] ?? '';
  }
  console.log('[wizard] zip parsed', zip);
  // …rest of handler unchanged
};
```

### Bug 2 — Stale `tempPermitId` closure

`handleJurisdictionDetected` is created once when the component mounts and captures `tempPermitId = null`. Even after the draft permit is created and `setTempPermitId(draft.id)` runs, the handler's closure still sees `null`, so the persist branch never fires.

**Change `src/pages/PermitQueensNewRequest.tsx`:**

1. Add `useRef` to the React import (line 1).
2. Right below the existing `useState` (line 183), mirror the value into a ref:

```ts
const [tempPermitId, setTempPermitId] = useState<string | null>(null);
const tempPermitIdRef = useRef<string | null>(null);
useEffect(() => { tempPermitIdRef.current = tempPermitId; }, [tempPermitId]);
```

3. In `handleJurisdictionDetected` (lines 499–525), replace every read of `tempPermitId` with `tempPermitIdRef.current`:

```ts
const currentDraftId = tempPermitIdRef.current;
console.log('[jurisdiction] persist check — tempPermitId:', currentDraftId);
if (currentDraftId) {
  // …existing payload + supabase.update().eq('id', currentDraftId)
}
```

### Verification (after deploy)

Browser console should show, in order:

```
[wizard] zip parsed 33470
[wizard] dept result {id: "6481720e…", county: "Palm Beach", …}
[jurisdiction] persist check — tempPermitId: <uuid>
[jurisdiction] persist OK
```

…and the Request Summary "Detecting…" pill resolves to **Palm Beach County**.

### Files touched

- `src/components/permit-queens/PermitAddressInput.tsx` — pass `context` through `onJurisdictionDetected`.
- `src/pages/PermitQueensNewRequest.tsx` — add `useRef` import, add `tempPermitIdRef`, accept + use `context` for ZIP parsing, persist via `tempPermitIdRef.current`.

No DB / edge function changes.