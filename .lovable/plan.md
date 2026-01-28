

# Fix AI Model & Template Viewing Issues

## Overview

Two issues need to be addressed:
1. Update edge functions to use Claude instead of Gemini for AI operations
2. Fix template viewing by handling missing storage files gracefully

---

## Issue 1: Switch AI Functions to Claude

### Functions to Update

| Function | Current Model | New Model |
|----------|--------------|-----------|
| `permit-expediter-brain` | `google/gemini-3-flash-preview` | `claude-sonnet-4-20250514` |
| `ai-quote-generator` | `google/gemini-2.5-flash` | `claude-sonnet-4-20250514` |
| `process-training-book` | `google/gemini-2.5-flash` | `claude-sonnet-4-20250514` |
| `homeowner-assistant` | `google/gemini-2.5-flash` | `claude-sonnet-4-20250514` |
| `coating-quote-ai` | `google/gemini-2.5-flash` | `claude-sonnet-4-20250514` |
| `permit-gap-detector-ai` | `google/gemini-3-flash-preview` | `claude-sonnet-4-20250514` |
| `noa-metadata-extractor` | `google/gemini-2.5-flash` | `claude-sonnet-4-20250514` |
| `permit-packet-analyzer` | `google/gemini-2.5-flash` | `claude-sonnet-4-20250514` |

### What Changes

Each function's AI call will change from:
```typescript
body: JSON.stringify({
  model: "google/gemini-2.5-flash",
  // or "google/gemini-3-flash-preview"
  ...
})
```

To:
```typescript
body: JSON.stringify({
  model: "claude-sonnet-4-20250514",
  ...
})
```

---

## Issue 2: Fix Template Viewing

### Root Cause

The database contains templates with placeholder file paths that don't exist in storage:
- `pending/miami-dade-hvhz-roofing.pdf` - File doesn't exist
- `pending/florida-noc.pdf` - File doesn't exist
- `pending/broward-permit-app.pdf` - File doesn't exist

When you click "View" on these templates, the signed URL generation fails with "Object not found (404)".

### Solution: Add File Existence Validation

Update `TemplateManager.tsx` to:
1. Check if the file actually exists before trying to generate a signed URL
2. Show a clear "File Missing" status badge for templates with missing files
3. Allow re-uploading files for templates with missing PDFs

### Code Changes

**File: `src/components/permit-queens/admin/TemplateManager.tsx`**

1. Add validation before viewing:
```typescript
const viewTemplate = async (filePath: string, formName: string) => {
  // Check if file path looks like a placeholder
  if (filePath.startsWith('pending/')) {
    toast.error('This template file is missing. Please re-upload the PDF.');
    return;
  }
  
  try {
    const { data, error } = await supabase.storage
      .from('permit-form-templates')
      .createSignedUrl(filePath, 3600);
    // ... rest of function
  }
};
```

2. Update status display to show "Missing File" for pending paths:
```typescript
{template.file_path ? (
  template.file_path.startsWith('pending/') ? (
    <Badge variant="destructive" className="...">
      <AlertTriangle className="h-3 w-3 mr-1" />
      File Missing
    </Badge>
  ) : (
    <Badge className="bg-green-500/10 text-green-600 ...">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      PDF Uploaded
    </Badge>
  )
) : (
  <Badge variant="secondary">No File</Badge>
)}
```

3. Add a file re-upload button for templates with missing files

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/permit-expediter-brain/index.ts` | Change model to Claude |
| `supabase/functions/ai-quote-generator/index.ts` | Change model to Claude |
| `supabase/functions/process-training-book/index.ts` | Change model to Claude |
| `supabase/functions/homeowner-assistant/index.ts` | Change model to Claude |
| `supabase/functions/coating-quote-ai/index.ts` | Change model to Claude |
| `supabase/functions/permit-gap-detector-ai/index.ts` | Change model to Claude |
| `supabase/functions/noa-metadata-extractor/index.ts` | Change model to Claude |
| `supabase/functions/permit-packet-analyzer/index.ts` | Change model to Claude |
| `src/components/permit-queens/admin/TemplateManager.tsx` | Add file validation and missing file handling |

---

## Technical Notes

### Claude Model Compatibility
The Lovable AI Gateway supports Claude models with the same API format as Gemini. No changes needed to the request structure beyond the model name.

### Storage File Paths
- Old placeholder format: `pending/[name].pdf`
- New correct format: `[building_dept_uuid]/[trade]/[filename]-[timestamp].pdf`

Templates with `pending/` paths need either:
1. The actual PDF to be uploaded
2. The database record to be deleted if the template is no longer needed

