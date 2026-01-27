import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  FileUp, 
  Loader2, 
  CheckCircle2,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentUploadZoneProps {
  buildingDeptId: string;
  onDocumentUploaded: (template: any) => void;
}

const TRADE_OPTIONS = [
  { value: 'Roofing', label: 'Roofing' },
  { value: 'Windows/Doors', label: 'Windows & Doors' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'General', label: 'General / Multi-Trade' },
];

const FORM_TYPES = [
  { value: 'permit_application', label: 'Permit Application' },
  { value: 'noc', label: 'Notice of Commencement' },
  { value: 'section_1524', label: 'Section 1524 Disclosure' },
  { value: 'supplemental', label: 'Supplemental Form' },
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'compliance', label: 'Compliance Statement' },
  { value: 'other', label: 'Other' },
];

export function DocumentUploadZone({ buildingDeptId, onDocumentUploaded }: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formName, setFormName] = useState('');
  const [tradeType, setTradeType] = useState('Roofing');
  const [formType, setFormType] = useState('permit_application');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      setSelectedFile(files[0]);
      setFormName(files[0].name.replace('.pdf', ''));
    } else {
      toast.error('Please upload a PDF file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files[0].type === 'application/pdf') {
        setSelectedFile(files[0]);
        setFormName(files[0].name.replace('.pdf', ''));
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formName.trim()) {
      toast.error('Please provide a file and form name');
      return;
    }

    setUploading(true);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const safeName = formName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filePath = `${buildingDeptId}/${tradeType.toLowerCase().replace('/', '-')}/${safeName}-${timestamp}.pdf`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('permit-form-templates')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create template record using raw insert to handle new columns
      const { data: template, error: insertError } = await supabase
        .from('permit_form_templates')
        .insert({
          form_name: formName,
          form_type: formType,
          file_path: filePath,
          trade_types: [tradeType],
          is_fillable: false
        } as any)
        .select()
        .single();

      // Update new columns separately (they may not be in types yet)
      if (template) {
        await supabase
          .from('permit_form_templates')
          .update({
            building_dept_id: buildingDeptId,
            field_count: 0,
            analysis_status: 'analyzing'
          } as any)
          .eq('id', template.id);
      }

      if (insertError) throw insertError;

      // Get public URL and trigger AI analysis
      const { data: urlData } = supabase.storage
        .from('permit-form-templates')
        .getPublicUrl(filePath);

      // Trigger analysis in background
      supabase.functions.invoke('permit-packet-analyzer', {
        body: {
          mode: 'detect_and_analyze',
          templateId: template.id,
          fileUrl: urlData.publicUrl
        }
      }).catch(err => console.warn('Analysis trigger failed:', err));

      toast.success('Document uploaded successfully', {
        description: 'AI analysis has started to detect fillable fields'
      });

      onDocumentUploaded(template);
      
      // Reset form
      setSelectedFile(null);
      setFormName('');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setFormName('');
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        {!selectedFile ? (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag & drop a blank PDF form here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse your files
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected File */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Form Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Roofing Permit Application"
                />
              </div>
              <div className="space-y-2">
                <Label>Trade Type</Label>
                <Select value={tradeType} onValueChange={setTradeType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Form Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_TYPES.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Upload Button */}
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !formName.trim()}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading & Analyzing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Upload & Start AI Analysis
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
