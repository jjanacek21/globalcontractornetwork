## Problem

Two issues are stacking on the New Permit Request screen:

1. **"Failed to generate packet"** — the `permit-packet-assembler` edge function is crash-looping on boot:
   ```
   Uncaught SyntaxError: Identifier 'authHeader' has already been declared
   at index.ts:1247:11
   ```
   `const authHeader` is declared twice in the same function scope (line 783 and line 1309 — actual line 1247 after compilation). Until this is fixed, **every** packet generation attempt returns an error.

2. **Signed NOC shows as not uploaded** — the "Notice of Commencement (NOC)" row in `PacketContentsPreview` only flips to ready when `hasOwnerInfo` is true. It never checks whether the user already uploaded a signed NOC via SmartDocumentUploader (which tags it `document_type = 'signed_noc'` or `'noc'` in `permit_project_documents`). So even after upload, the row stays amber and the cover sheet under-reports readiness.

## Fix

### 1. `supabase/functions/permit-packet-assembler/index.ts` — remove duplicate declaration

Around line 1309, the second occurrence of:
```ts
const authHeader = req.headers.get('Authorization');
let userId = null;
if (authHeader) {
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  userId = user?.id;
}
```

`authHeader` is already in scope from line 783. Replace the second `const authHeader = ...` with a reuse (or a fresh `const userAuthHeader = ...`) and derive `userId` from the existing variable. No re-declaration.

### 2. `src/components/permit-queens/PacketContentsPreview.tsx` — detect uploaded NOC

- Accept a new prop `hasUploadedNOC: boolean` (or pass the `uploadedDocs` array directly so the component can scan for `document_type` in `['noc', 'signed_noc', 'notice_of_commencement']`).
- Update the NOC row logic:
  ```
  status: hasUploadedNOC ? 'ready'
        : hasOwnerInfo   ? 'ready'   // will auto-generate
        : 'pending'
  ```
  When `hasUploadedNOC` is true, also change the source label to `upload` and badge to "Uploaded" instead of "Auto-generated" so the user sees their file was recognized.

### 3. `src/pages/PermitPacketAssembly.tsx` — wire the new flag

Where `uploadedDocumentCount` is computed from the `permit_project_documents` query (around line 118), also derive:
```ts
const hasUploadedNOC = (uploadedDocs || []).some(d =>
  ['noc', 'signed_noc', 'notice_of_commencement'].includes(d.document_type)
);
```
Pass it into `<PacketContentsPreview hasUploadedNOC={hasUploadedNOC} ... />`.

### 4. Assembler: prefer uploaded signed NOC over auto-generated

In the assembler's NOC document handling (around line 739, the `'noc'` structure entry), check `uploadedDocs` first for a `signed_noc`/`noc` row and, if present, mark that document `status: 'included'`, `source: 'user_upload'`, and use its `file_path` instead of triggering the NOC auto-generation path. This keeps the user's notarized version in the final merged PDF.

## Verification

After deploy:
1. Reload `/permit-queens/new-request` — Packet Contents Preview should show NOC as green/Uploaded (not amber).
2. Click **Generate Packet Now** — should succeed with no "Failed to generate packet" toast.
3. Confirm `permit-packet-assembler` logs show `booted` (not `BootFailure`) and a successful invocation.
4. Open the generated packet — the NOC pages inside should be the user's uploaded signed PDF.

## Files touched

| File | Change |
|------|--------|
| `supabase/functions/permit-packet-assembler/index.ts` | Remove duplicate `const authHeader`; prefer uploaded NOC over auto-gen |
| `src/components/permit-queens/PacketContentsPreview.tsx` | New `hasUploadedNOC` prop + ready/Uploaded badge |
| `src/pages/PermitPacketAssembly.tsx` | Compute and pass `hasUploadedNOC` |
