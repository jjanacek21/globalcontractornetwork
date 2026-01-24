-- Clear ALL fake placeholder URLs (floridabuilding.org with fake FL numbers)
UPDATE product_approvals 
SET 
  file_url = NULL, 
  noa_pdf_url = NULL, 
  fl_approval_pdf_url = NULL,
  source_status = 'pending',
  last_source_attempt = NULL
WHERE file_url LIKE '%floridabuilding.org%'
   OR fl_approval_pdf_url LIKE '%floridabuilding.org%'
   OR noa_pdf_url LIKE '%floridabuilding.org%';

-- Also clear any remaining miamidade.gov URLs
UPDATE product_approvals 
SET 
  file_url = NULL, 
  noa_pdf_url = NULL,
  source_status = 'pending',
  last_source_attempt = NULL
WHERE file_url LIKE '%miamidade.gov%'
   OR noa_pdf_url LIKE '%miamidade.gov%';