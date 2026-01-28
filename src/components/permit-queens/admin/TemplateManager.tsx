import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  Eye,
  Edit
} from 'lucide-react';

interface FormTemplate {
  id: string;
  form_name: string;
  form_type: string;
  jurisdiction_name: string | null;
  county: string | null;
  city: string | null;
  file_path: string;
  is_fillable: boolean | null;
  requires_notary: boolean | null;
  created_at: string;
}

const FORM_TYPES = [
  { value: 'permit_application', label: 'Permit Application' },
  { value: 'noc', label: 'Notice of Commencement' },
  { value: 'owner_affidavit', label: 'Owner Affidavit' },
  { value: 'contractor_affidavit', label: 'Contractor Affidavit' },
  { value: 'section_1524', label: 'Section 1524 Disclosure' },
  { value: 'roof_to_wall', label: 'Roof-to-Wall Affidavit' },
  { value: 'hoa_affidavit', label: 'HOA Awareness Affidavit' },
  { value: 'energy_compliance', label: 'Energy Compliance Certificate' },
  { value: 'supplemental', label: 'Supplemental Form' },
  { value: 'other', label: 'Other' },
];

const JURISDICTIONS = [
  'Florida',
  'Miami-Dade County',
  'Broward County',
  'Palm Beach County',
  'City of Boca Raton',
  'City of Fort Lauderdale',
  'City of Hollywood',
  'City of Miami Beach',
  'City of Wellington',
  'Village of Parkland',
  'City of Riviera Beach',
];

export function TemplateManager() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    form_name: '',
    form_type: '',
    jurisdiction_name: '',
    requires_notary: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('permit_form_templates')
        .select('id, form_name, form_type, jurisdiction_name, county, city, file_path, is_fillable, requires_notary, created_at')
        .order('jurisdiction_name', { ascending: true });

      if (error) throw error;
      setTemplates((data || []) as FormTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadTemplate = async () => {
    if (!selectedFile || !newTemplate.form_name || !newTemplate.form_type || !newTemplate.jurisdiction_name) {
      toast.error('Please fill all required fields and select a PDF');
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileName = `${newTemplate.jurisdiction_name.replace(/\s+/g, '-').toLowerCase()}-${newTemplate.form_type}-${Date.now()}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('permit-form-templates')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Insert template record
      const { error: insertError } = await supabase
        .from('permit_form_templates')
        .insert({
          form_name: newTemplate.form_name,
          form_type: newTemplate.form_type,
          jurisdiction_name: newTemplate.jurisdiction_name,
          file_path: fileName,
          is_fillable: true,
          requires_notary: newTemplate.requires_notary,
        });

      if (insertError) throw insertError;

      toast.success('Template uploaded successfully!');
      setShowAddDialog(false);
      setNewTemplate({
        form_name: '',
        form_type: '',
        jurisdiction_name: '',
        requires_notary: false,
      });
      setSelectedFile(null);
      fetchTemplates();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload template');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('permit_form_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete template');
    }
  };


  const viewTemplate = async (filePath: string, formName: string) => {
    // Check if file path looks like a placeholder that doesn't exist
    if (filePath.startsWith('pending/')) {
      toast.error('This template file is missing. Please re-upload the PDF.');
      return;
    }
    
    try {
      const { data, error } = await supabase.storage
        .from('permit-form-templates')
        .createSignedUrl(filePath, 3600);
      
      if (error || !data?.signedUrl) {
        toast.error('Failed to access document. The file may be missing from storage.');
        console.error('Signed URL error:', error);
        return;
      }
      
      setViewingTemplate({ url: data.signedUrl, name: formName });
    } catch (err) {
      console.error('View template error:', err);
      toast.error('Error accessing template');
    }
  };

  const analyzeTemplate = async (templateId: string, filePath: string) => {
    // Generate signed URL for the analyzer
    const { data: urlData, error: signedError } = await supabase.storage
      .from('permit-form-templates')
      .createSignedUrl(filePath, 3600);

    if (signedError || !urlData?.signedUrl) {
      toast.error('Failed to access file for analysis');
      return;
    }

    toast.info('Analyzing template fields... This may take a moment.');

    try {
      const { data, error } = await supabase.functions.invoke('permit-packet-analyzer', {
        body: {
          mode: 'detect_and_analyze',
          fileUrl: urlData.signedUrl,
          filePath: filePath,
          fileName: `template-${templateId}.pdf`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Analysis complete! Detected: ${data.detection?.detected?.county || 'Unknown'} County`);
      } else {
        toast.error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze template');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Form Template Manager
              </CardTitle>
              <CardDescription>
                Upload and manage blank PDF forms for auto-filling
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Form Template</DialogTitle>
                  <DialogDescription>
                    Upload a blank PDF form to enable auto-filling
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Form Name *</Label>
                    <Input
                      placeholder="e.g., City of Boca Raton Re-Roofing Application"
                      value={newTemplate.form_name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, form_name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Form Type *</Label>
                    <Select
                      value={newTemplate.form_type}
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, form_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FORM_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Jurisdiction *</Label>
                    <Select
                      value={newTemplate.jurisdiction_name}
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, jurisdiction_name: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select jurisdiction" />
                      </SelectTrigger>
                      <SelectContent>
                        {JURISDICTIONS.map(j => (
                          <SelectItem key={j} value={j}>{j}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>PDF File *</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                    />
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTemplate.requires_notary}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, requires_notary: e.target.checked }))}
                      />
                      <span className="text-sm">Requires Notary</span>
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUploadTemplate} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No templates uploaded yet. Click "Add Template" to upload blank PDF forms.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.form_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {FORM_TYPES.find(t => t.value === template.form_type)?.label || template.form_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.jurisdiction_name || template.county || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {template.file_path ? (
                          template.file_path.startsWith('pending/') ? (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/30">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              File Missing
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              PDF Uploaded
                            </Badge>
                          )
                        ) : (
                          <Badge variant="secondary">No File</Badge>
                        )}
                        {template.requires_notary && (
                          <Badge variant="outline" className="text-xs">Notary</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {template.file_path && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => viewTemplate(template.file_path, template.form_name)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => analyzeTemplate(template.id, template.file_path)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-muted-foreground text-sm">Total Templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {templates.filter(t => t.file_path).length}
            </div>
            <p className="text-muted-foreground text-sm">With PDFs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {[...new Set(templates.map(t => t.jurisdiction_name || t.county))].length}
            </div>
            <p className="text-muted-foreground text-sm">Jurisdictions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {templates.filter(t => t.requires_notary).length}
            </div>
            <p className="text-muted-foreground text-sm">Require Notary</p>
          </CardContent>
        </Card>
      </div>

      {/* PDF Viewer Dialog */}
      <PDFViewerDialog
        open={!!viewingTemplate}
        onOpenChange={(open) => !open && setViewingTemplate(null)}
        url={viewingTemplate?.url || ''}
        title={viewingTemplate?.name || 'Template Preview'}
        filename={`${viewingTemplate?.name || 'template'}.pdf`}
      />
    </div>
  );
}
