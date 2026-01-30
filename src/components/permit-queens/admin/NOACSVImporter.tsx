import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

interface CSVRow {
  noa_number: string;
  manufacturer: string;
  subcategory: string;
  material: string;
  description: string;
  mdp_minus: string;
  expires: string;
  pdf_url: string;
}

interface ParsedRow extends CSVRow {
  id: string;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
}

interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: { row: number; error: string }[];
}

export function NOACSVImporter() {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Map expected column names
    const columnMap: Record<string, string> = {
      'noa_number': 'noa_number',
      'noa': 'noa_number',
      'manufacturer': 'manufacturer',
      'applicant': 'manufacturer',
      'subcategory': 'subcategory',
      'sub_category': 'subcategory',
      'material': 'material',
      'description': 'description',
      'mdp_minus': 'mdp_minus',
      'mdp-': 'mdp_minus',
      'expires': 'expires',
      'expiration': 'expires',
      'expiration_date': 'expires',
      'pdf_url': 'pdf_url',
      'pdf': 'pdf_url',
      'url': 'pdf_url',
    };

    const headerIndices: Record<string, number> = {};
    headers.forEach((h, idx) => {
      const mapped = columnMap[h];
      if (mapped) {
        headerIndices[mapped] = idx;
      }
    });

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      rows.push({
        noa_number: values[headerIndices['noa_number']] || '',
        manufacturer: values[headerIndices['manufacturer']] || '',
        subcategory: values[headerIndices['subcategory']] || '',
        material: values[headerIndices['material']] || '',
        description: values[headerIndices['description']] || '',
        mdp_minus: values[headerIndices['mdp_minus']] || '',
        expires: values[headerIndices['expires']] || '',
        pdf_url: values[headerIndices['pdf_url']] || '',
      });
    }

    return rows;
  };

  // Parse a single CSV line handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  };

  const validateRow = (row: CSVRow): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!row.noa_number || row.noa_number.trim() === '') {
      errors.push('Missing NOA number');
    }

    if (!row.manufacturer || row.manufacturer.trim() === '') {
      errors.push('Missing manufacturer');
    }

    // Validate date format if provided
    if (row.expires && row.expires.trim() !== '') {
      const dateMatch = row.expires.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!dateMatch) {
        const isoMatch = row.expires.match(/^\d{4}-\d{2}-\d{2}$/);
        if (!isoMatch) {
          errors.push('Invalid date format (expected MM/DD/YYYY or YYYY-MM-DD)');
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const parseExpirationDate = (dateStr: string): string | null => {
    if (!dateStr || dateStr.trim() === '') return null;

    // Try MM/DD/YYYY format
    const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try YYYY-MM-DD format
    const isoMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
    if (isoMatch) {
      return dateStr;
    }

    return null;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsParsing(true);
    setParsedRows([]);
    setSelectedRows(new Set());
    setImportResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error('No valid data found in CSV');
        setIsParsing(false);
        return;
      }

      // Check for existing NOA numbers in database
      const noaNumbers = rows.map(r => r.noa_number).filter(n => n);
      const { data: existingProducts } = await supabase
        .from('product_approvals')
        .select('noa_number')
        .in('noa_number', noaNumbers);

      const existingNOAs = new Set(existingProducts?.map(p => p.noa_number) || []);

      // Validate and mark duplicates
      const parsed: ParsedRow[] = rows.map((row, idx) => {
        const { isValid, errors } = validateRow(row);
        const isDuplicate = existingNOAs.has(row.noa_number);
        
        return {
          ...row,
          id: `row-${idx}`,
          isValid: isValid && !isDuplicate,
          errors: isDuplicate ? [...errors, 'Already exists in database'] : errors,
          isDuplicate,
        };
      });

      setParsedRows(parsed);
      
      // Select all valid non-duplicate rows by default
      const validIds = new Set(parsed.filter(r => r.isValid && !r.isDuplicate).map(r => r.id));
      setSelectedRows(validIds);

      const validCount = parsed.filter(r => r.isValid).length;
      const duplicateCount = parsed.filter(r => r.isDuplicate).length;
      
      toast.success(`Parsed ${rows.length} rows: ${validCount} valid, ${duplicateCount} duplicates`);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV file');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const selectAll = () => {
    const allValidIds = parsedRows.filter(r => r.isValid && !r.isDuplicate).map(r => r.id);
    setSelectedRows(new Set(allValidIds));
  };

  const selectNone = () => {
    setSelectedRows(new Set());
  };

  const handleImport = async () => {
    const rowsToImport = parsedRows.filter(r => selectedRows.has(r.id));
    
    if (rowsToImport.length === 0) {
      toast.error('No rows selected for import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    const result: ImportResult = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
    };

    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < rowsToImport.length; i += batchSize) {
      batches.push(rowsToImport.slice(i, i + batchSize));
    }

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      
      const insertData = batch.map(row => ({
        noa_number: row.noa_number.trim(),
        manufacturer: row.manufacturer.trim(),
        product_name: row.description.trim() || row.material.trim() || 'Unknown Product',
        product_category: mapSubcategoryToCategory(row.subcategory),
        product_line: row.material.trim() || null,
        wind_speed_rating: parseWindSpeed(row.mdp_minus),
        expiration_date: parseExpirationDate(row.expires),
        file_url: row.pdf_url.trim() || null,
        hvhz_approved: true, // Miami-Dade NOAs are HVHZ approved
        is_active: true,
        applicable_trades: ['roofing'],
        source_status: 'imported',
      }));

      try {
        const { data, error } = await supabase
          .from('product_approvals')
          .upsert(insertData, { 
            onConflict: 'noa_number',
            ignoreDuplicates: false 
          })
          .select();

        if (error) {
          console.error('Batch insert error:', error);
          result.failed += batch.length;
          result.errors.push({
            row: batchIdx * batchSize,
            error: error.message,
          });
        } else {
          result.success += data?.length || 0;
        }
      } catch (err) {
        console.error('Batch error:', err);
        result.failed += batch.length;
      }

      setImportProgress(Math.round(((batchIdx + 1) / batches.length) * 100));
    }

    setIsImporting(false);
    setImportResult(result);

    if (result.success > 0) {
      toast.success(`Successfully imported ${result.success} NOA records`);
    }
    if (result.failed > 0) {
      toast.error(`Failed to import ${result.failed} records`);
    }
  };

  const mapSubcategoryToCategory = (subcategory: string): string => {
    const lower = subcategory.toLowerCase();
    
    if (lower.includes('tile')) return 'Roof Tile';
    if (lower.includes('shingle')) return 'Shingles';
    if (lower.includes('metal')) return 'Metal Roofing';
    if (lower.includes('underlayment') || lower.includes('membrane')) return 'Underlayment';
    if (lower.includes('fastener') || lower.includes('nail') || lower.includes('screw')) return 'Fasteners';
    if (lower.includes('flashing')) return 'Flashing';
    if (lower.includes('coating')) return 'Roof Coating';
    
    return subcategory || 'Other';
  };

  const parseWindSpeed = (mdpMinus: string): number | null => {
    if (!mdpMinus) return null;
    const match = mdpMinus.match(/[-]?(\d+)/);
    return match ? Math.abs(parseInt(match[1], 10)) : null;
  };

  const clearAll = () => {
    setParsedRows([]);
    setSelectedRows(new Set());
    setImportResult(null);
    setImportProgress(0);
  };

  const validCount = parsedRows.filter(r => r.isValid && !r.isDuplicate).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;
  const duplicateCount = parsedRows.filter(r => r.isDuplicate).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          CSV NOA Importer
        </CardTitle>
        <CardDescription>
          Import Miami-Dade NOA records from a CSV file. Expected columns: noa_number, manufacturer, subcategory, material, description, mdp_minus, expires, pdf_url
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        {parsedRows.length === 0 && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'}
            `}
          >
            <input {...getInputProps()} />
            {isParsing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Parsing CSV file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Drop your CSV file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {parsedRows.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="text-foreground">
              {parsedRows.length} Total Rows
            </Badge>
            <Badge className="bg-green-500/10 text-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {validCount} Valid
            </Badge>
            <Badge className="bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {duplicateCount} Duplicates
            </Badge>
            <Badge className="bg-red-500/10 text-red-600">
              <XCircle className="h-3 w-3 mr-1" />
              {invalidCount} Invalid
            </Badge>
            <Badge variant="outline" className="text-primary">
              {selectedRows.size} Selected
            </Badge>
          </div>
        )}

        {/* Actions */}
        {parsedRows.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All Valid
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Select None
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <div className="flex-1" />
            <Button 
              onClick={handleImport} 
              disabled={isImporting || selectedRows.size === 0}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import {selectedRows.size} Records
                </>
              )}
            </Button>
          </div>
        )}

        {/* Progress */}
        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Importing records...</span>
              <span>{importProgress}%</span>
            </div>
            <Progress value={importProgress} />
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h4 className="font-medium">Import Complete</h4>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">✓ {importResult.success} imported</span>
              <span className="text-red-600">✗ {importResult.failed} failed</span>
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Errors:</p>
                {importResult.errors.slice(0, 5).map((err, idx) => (
                  <p key={idx}>Row {err.row}: {err.error}</p>
                ))}
                {importResult.errors.length > 5 && (
                  <p>...and {importResult.errors.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Preview Table */}
        {parsedRows.length > 0 && showPreview && (
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>NOA Number</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 100).map((row) => (
                    <TableRow 
                      key={row.id}
                      className={row.isDuplicate ? 'bg-amber-500/5' : row.isValid ? '' : 'bg-red-500/5'}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(row.id)}
                          onCheckedChange={() => toggleRowSelection(row.id)}
                          disabled={!row.isValid || row.isDuplicate}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.noa_number}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{row.manufacturer}</TableCell>
                      <TableCell>{row.subcategory}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{row.description || row.material}</TableCell>
                      <TableCell>{row.expires}</TableCell>
                      <TableCell>
                        {row.isDuplicate ? (
                          <Badge variant="outline" className="text-amber-600 text-xs">Duplicate</Badge>
                        ) : row.isValid ? (
                          <Badge variant="outline" className="text-green-600 text-xs">Valid</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 text-xs" title={row.errors.join(', ')}>
                            Invalid
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedRows.length > 100 && (
              <div className="p-2 text-center text-sm text-muted-foreground bg-muted/50">
                Showing first 100 of {parsedRows.length} rows
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
