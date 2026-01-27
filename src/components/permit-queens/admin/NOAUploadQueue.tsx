import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  FileText,
  Brain,
  Eye,
  Trash2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'extracting' | 'complete' | 'error';
  progress: number;
  storageUrl?: string;
  metadata?: any;
  error?: string;
}

export function NOAUploadQueue() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles
      .filter(f => f.type === 'application/pdf')
      .map(f => ({
        id: crypto.randomUUID(),
        file: f,
        status: 'pending' as const,
        progress: 0
      }));

    if (newFiles.length !== acceptedFiles.length) {
      toast.warning('Some files were skipped - only PDFs are accepted');
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true
  });

  const processFiles = async () => {
    setIsProcessing(true);
    const pendingFiles = files.filter(f => f.status === 'pending');

    for (const uploadFile of pendingFiles) {
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 10 } : f
        ));

        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:... prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile.file);
        });

        // Generate storage path from filename
        const fileName = uploadFile.file.name.replace(/\s+/g, '-');
        const storagePath = `noa-pdfs/uploaded/${fileName}`;

        // Upload to storage
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: 30 } : f
        ));

        const { error: uploadError } = await supabase.storage
          .from('product-approvals')
          .upload(storagePath, uploadFile.file, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-approvals')
          .getPublicUrl(storagePath);

        const storageUrl = urlData.publicUrl;

        // Update status to extracting
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'extracting' as const, 
            progress: 50,
            storageUrl 
          } : f
        ));

        // Call AI extraction
        const { data: extractData, error: extractError } = await supabase.functions.invoke(
          'noa-metadata-extractor',
          {
            body: { 
              pdfUrl: storageUrl,
              pdfBase64: base64
            }
          }
        );

        if (extractError) {
          throw new Error(`Extraction failed: ${extractError.message}`);
        }

        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: 80 } : f
        ));

        // If extraction successful, create product approval record
        if (extractData?.success && extractData?.metadata) {
          const metadata = extractData.metadata;
          
          // Check if product already exists
          const { data: existing } = await supabase
            .from('product_approvals')
            .select('id')
            .eq('noa_number', metadata.noa_number)
            .maybeSingle();

          if (existing) {
            // Update existing
            await supabase
              .from('product_approvals')
              .update({
                file_url: storageUrl,
                noa_pdf_url: storageUrl,
                source_status: 'found',
                manufacturer: metadata.manufacturer || undefined,
                product_name: metadata.product_name || undefined,
                product_category: metadata.product_category || undefined,
                expiration_date: metadata.expiration_date || undefined,
                hvhz_approved: metadata.hvhz_approved,
                wind_speed_rating: metadata.wind_speed_rating || undefined,
                specifications: metadata.specifications || undefined,
                ai_extracted_at: new Date().toISOString(),
                extraction_confidence: metadata.confidence_score,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
          } else if (metadata.noa_number) {
            // Create new
            await supabase
              .from('product_approvals')
              .insert({
                noa_number: metadata.noa_number,
                manufacturer: metadata.manufacturer || 'Unknown',
                product_name: metadata.product_name || 'Extracted from PDF',
                product_category: metadata.product_category || 'Roofing',
                file_url: storageUrl,
                noa_pdf_url: storageUrl,
                source_status: 'found',
                expiration_date: metadata.expiration_date || undefined,
                hvhz_approved: metadata.hvhz_approved || false,
                wind_speed_rating: metadata.wind_speed_rating || undefined,
                specifications: metadata.specifications || undefined,
                ai_extracted_at: new Date().toISOString(),
                extraction_confidence: metadata.confidence_score,
                is_active: true
              });
          }

          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { 
              ...f, 
              status: 'complete' as const, 
              progress: 100,
              metadata 
            } : f
          ));
        } else {
          throw new Error('AI extraction returned no metadata');
        }

      } catch (error) {
        console.error('Processing error:', error);
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'error' as const, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } : f
        ));
      }
    }

    setIsProcessing(false);
    toast.success('Processing complete!');
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'complete'));
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completeCount = files.filter(f => f.status === 'complete').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          NOA Upload & AI Extraction
        </CardTitle>
        <CardDescription>
          Upload NOA PDFs and let AI extract metadata automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-primary font-medium">Drop PDFs here...</p>
          ) : (
            <>
              <p className="font-medium">Drag & drop NOA PDFs here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
            </>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline">{pendingCount} Pending</Badge>
                <Badge className="bg-green-500/10 text-green-600">{completeCount} Complete</Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive">{errorCount} Errors</Badge>
                )}
              </div>
              <div className="flex gap-2">
                {completeCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCompleted}>
                    Clear Completed
                  </Button>
                )}
                <Button 
                  onClick={processFiles}
                  disabled={isProcessing || pendingCount === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Process {pendingCount} Files
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {files.map(file => (
                <div key={file.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate font-medium">{file.file.name}</span>
                      {file.status === 'pending' && (
                        <Badge variant="outline">Pending</Badge>
                      )}
                      {file.status === 'uploading' && (
                        <Badge variant="secondary">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Uploading
                        </Badge>
                      )}
                      {file.status === 'extracting' && (
                        <Badge className="bg-purple-500/10 text-purple-600">
                          <Brain className="h-3 w-3 mr-1 animate-pulse" />
                          Extracting
                        </Badge>
                      )}
                      {file.status === 'complete' && (
                        <Badge className="bg-green-500/10 text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                      {file.status === 'error' && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {file.storageUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={file.storageUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {file.status !== 'uploading' && file.status !== 'extracting' && (
                        <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {(file.status === 'uploading' || file.status === 'extracting') && (
                    <Progress value={file.progress} className="mt-2 h-1" />
                  )}
                  
                  {file.error && (
                    <p className="text-xs text-destructive mt-1">{file.error}</p>
                  )}
                  
                  {file.metadata && file.status === 'complete' && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                      <div className="flex gap-4">
                        <span><strong>NOA:</strong> {file.metadata.noa_number || 'N/A'}</span>
                        <span><strong>Mfr:</strong> {file.metadata.manufacturer || 'N/A'}</span>
                      </div>
                      <div>
                        <strong>Product:</strong> {file.metadata.product_name || 'N/A'}
                      </div>
                      <div className="flex gap-4">
                        <span><strong>Category:</strong> {file.metadata.product_category || 'N/A'}</span>
                        <span><strong>HVHZ:</strong> {file.metadata.hvhz_approved ? 'Yes' : 'No'}</span>
                        <span><strong>Confidence:</strong> {((file.metadata.confidence_score || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
