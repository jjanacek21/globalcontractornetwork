
# Plan: Fix Re-analyze and Enable Field Mapping Extraction

## Problem Summary

Based on my investigation and testing, I found two critical issues:

### Issue 1: Re-analyze Button Doesn't Send File Content
- **PermitTrainingUploader**: Correctly converts file to base64 and sends `fileContent` with the request
- **TrainingDetailDialog** (Re-analyze): Only sends `trainingId` and `fileName` - no file content
- **Result**: Edge function logs show `Has Content: false` and quality scores drop from 0.50 to 0.10

### Issue 2: Field Mappings Not Being Saved
- Current logic requires finding a matching `permit_form_templates` entry first
- If no template matches the form name, the mappings are silently skipped
- Need to either: (a) Create templates on-the-fly, or (b) Save mappings without template_id

---

## Implementation Plan

### Step 1: Fix Re-analyze to Fetch and Send File Content

**File:** `src/components/admin/TrainingDetailDialog.tsx`

Update `handleReanalyze` to:
1. Get the file path from the training record's `file_url`
2. Download the file from storage using `supabase.storage.from().download()`
3. Convert to base64 (same method as PermitTrainingUploader)
4. Send with the edge function request

```typescript
const handleReanalyze = async () => {
  setReanalyzing(true);
  try {
    // Reset status to pending first
    await supabase
      .from("permit_packet_training")
      .update({ processing_status: "pending" })
      .eq("id", sample.id);

    let fileContent: string | undefined;

    // Try to fetch file from storage for re-analysis
    if (sample.file_url) {
      try {
        // Extract path from the URL
        const urlParts = sample.file_url.split("/permit-training-packets/");
        if (urlParts.length > 1) {
          const filePath = decodeURIComponent(urlParts[1]);
          
          // Download file from storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from("permit-training-packets")
            .download(filePath);

          if (!downloadError && fileData) {
            // Convert to base64
            const arrayBuffer = await fileData.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            fileContent = btoa(binary);
            console.log("File content loaded for re-analysis");
          }
        }
      } catch (fetchError) {
        console.warn("Could not fetch file for re-analysis:", fetchError);
      }
    }

    // Call the analyzer with file content
    const { error } = await supabase.functions.invoke("permit-packet-analyzer", {
      body: {
        mode: "analyze_only",
        trainingId: sample.id,
        fileName: sample.source_file_name,
        fileContent, // Now included!
        fileUrl: sample.file_url,
      },
    });

    if (error) throw error;
    toast.success("Re-analysis started");
    onUpdate();
  } catch (error: any) {
    console.error("Re-analyze error:", error);
    toast.error("Failed to re-analyze: " + (error.message || "Unknown error"));
  } finally {
    setReanalyzing(false);
  }
};
```

### Step 2: Improve Field Mapping Extraction (Save Without Template)

**File:** `supabase/functions/permit-packet-analyzer/index.ts`

Update the field mapping save logic to:
1. First try to match to existing template
2. If no template match, save with `template_id = null` and include `county` for context
3. This allows mappings to be discovered and later linked to templates

```typescript
// 2. SAVE FORM FIELD MAPPINGS
if (analysisResult.formFieldMappings && analysisResult.formFieldMappings.length > 0) {
  console.log(`[permit-packet-analyzer] Processing ${analysisResult.formFieldMappings.length} form mappings...`);
  
  for (const form of analysisResult.formFieldMappings) {
    try {
      // Try to find matching template
      let templateId: string | null = null;
      
      const { data: templates } = await supabase
        .from("permit_form_templates")
        .select("id, form_name")
        .ilike("form_name", `%${form.formName.substring(0, 30)}%`)
        .limit(1);

      if (templates && templates.length > 0) {
        templateId = templates[0].id;
        console.log(`[permit-packet-analyzer] Matched form to template: ${templates[0].form_name}`);
      } else {
        console.log(`[permit-packet-analyzer] No template match for form: ${form.formName}`);
      }

      for (const field of form.fields) {
        // Check if mapping exists (by pdf_field name and county)
        const { data: existingMapping } = await supabase
          .from("permit_field_mappings")
          .select("id")
          .eq("pdf_field", field.pdfFieldName)
          .eq("county", trainingRecord.county || "")
          .maybeSingle();

        if (!existingMapping) {
          const { error: mapError } = await supabase.from("permit_field_mappings").insert({
            template_id: templateId, // Can be null now
            our_field: field.ourFieldName,
            pdf_field: field.pdfFieldName,
            field_type: field.fieldType || "text",
            transform_type: field.transform,
            page_number: field.pageNumber || 1,
            county: trainingRecord.county || null, // Add county context
            notes: `Learned from training: ${trainingId}, Form: ${form.formName}`,
          });

          if (!mapError) {
            mappingsLearned++;
            console.log(`[permit-packet-analyzer] Saved field mapping: ${field.ourFieldName} -> ${field.pdfFieldName}`);
          } else {
            console.warn(`[permit-packet-analyzer] Failed to save mapping:`, mapError);
          }
        } else {
          console.log(`[permit-packet-analyzer] Mapping already exists: ${field.pdfFieldName}`);
        }
      }
    } catch (mapError) {
      console.warn(`[permit-packet-analyzer] Error saving form mapping:`, mapError);
    }
  }
}
```

### Step 3: Enhance AI Prompt for Better Field Mapping Extraction

Update the system prompt in the edge function to emphasize field mapping extraction:

```typescript
// Add more specific examples in the AI prompt:
2. FORM FIELD MAPPINGS (CRITICAL - Learn PDF field names for smart-fill):
   For EACH filled form page, extract:
   - Form name/title exactly as printed
   - Form type: permit_application, hvhz_affidavit, noc, owner_affidavit, etc.
   - Field mappings - LOOK FOR FILLED-IN FIELDS and map them:
   
   COMMON FIELD MAPPINGS TO FIND:
   - Owner/Applicant Name -> "owner_name"
   - Job/Site/Property Address -> "property_address" 
   - Contractor Name/Company -> "contractor_name"
   - License Number/License # -> "contractor_license"
   - Phone/Telephone -> "phone"
   - Email -> "email"
   - Permit Type -> "permit_type"
   - Scope of Work -> "scope_of_work"
   - Roof Squares / Square Footage -> "roof_sqft"
   - Contract Amount/Value -> "contract_value"
   - Date -> various date fields
   
   Example output:
   {
     "formName": "City of Boca Raton Building Permit Application",
     "formType": "permit_application",
     "fields": [
       {"ourFieldName": "owner_name", "pdfFieldName": "Owner Name", "sampleValue": "JOHN DOE", "fieldType": "text", "transform": "uppercase", "pageNumber": 1},
       {"ourFieldName": "property_address", "pdfFieldName": "Job Site Address", "sampleValue": "123 MAIN ST", "fieldType": "text", "transform": null, "pageNumber": 1}
     ]
   }
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/TrainingDetailDialog.tsx` | Fetch file from storage and send as base64 when re-analyzing |
| `supabase/functions/permit-packet-analyzer/index.ts` | Save field mappings without requiring template_id, enhance prompt |

---

## Testing Plan

After implementation:
1. Navigate to Admin Dashboard > Permit Expediting > AI Training
2. Find an existing completed sample
3. Click "View" to open TrainingDetailDialog
4. Click "Re-analyze" button
5. Verify in edge function logs that `Has Content: true`
6. Check database:
   - `permit_packet_training` - quality_score should be higher
   - `permit_field_mappings` - should have new entries
   - `product_approvals` - should have products with `source_status = 'training_extracted'`
7. Check Analytics tab shows increased counts

---

## Technical Notes

- The private storage bucket `permit-training-packets` requires authenticated download
- Using `supabase.storage.from().download()` handles auth automatically
- Base64 encoding uses the same method as the original uploader for consistency
- Field mappings now save with `county` context to help differentiate between jurisdictions
