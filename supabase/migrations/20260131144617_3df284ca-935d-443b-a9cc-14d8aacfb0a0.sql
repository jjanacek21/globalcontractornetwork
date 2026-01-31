-- Fix URLs with "No: " prefix (e.g., "No: 25012112.pdf" -> "25012112.pdf")
UPDATE product_approvals 
SET file_url = REGEXP_REPLACE(file_url, 'No: ', '')
WHERE file_url LIKE '%miamidade.gov%/noa/No: %';

-- Fix URLs with "NOA" prefix in the filename (e.g., "NOA22070609.pdf" -> "22070609.pdf")
UPDATE product_approvals 
SET file_url = REGEXP_REPLACE(
  file_url, 
  '/noa/NOA([0-9]+)\.pdf', 
  '/noa/\1.pdf'
)
WHERE file_url LIKE '%miamidade.gov%/noa/NOA%';

-- Fix URLs with spaces in them (URL encode spaces)
UPDATE product_approvals 
SET file_url = REPLACE(file_url, ' ', '')
WHERE file_url LIKE '%miamidade.gov%' AND file_url LIKE '% %';