import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, FileText, Settings, Eye, Trash2, Plus, Crown, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FormTemplate {
  id: string;
  jurisdiction_name: string;
  form_type: string;
  form_name: string;
  file_path: string;
  category: string;
  trade_types: string[] | null;
  hvhz_only: boolean | null;
  field_mapping: unknown;
  requires_signature: boolean | null;
  requires_notary: boolean | null;
  page_count: number | null;
  instructions: string | null;
}

interface FieldMapping {
  id: string;
  template_id: string;
  our_field: string;
  pdf_field: string;
  field_type: string;
  is_required: boolean;
  page_number: number;
}

const OUR_FIELDS = [
  // Property
  { id: 'property_address', label: 'Property Address', category: 'Property' },
  { id: 'property_unit', label: 'Property Unit/Suite', category: 'Property' },
  { id: 'property_city', label: 'Property City', category: 'Property' },
  { id: 'property_state', label: 'Property State', category: 'Property' },
  { id: 'property_zip', label: 'Property ZIP', category: 'Property' },
  { id: 'folio_number', label: 'Folio/Parcel #', category: 'Property' },
  { id: 'legal_description', label: 'Legal Description', category: 'Property' },
  { id: 'flood_zone', label: 'Flood Zone', category: 'Property' },
  { id: 'wind_speed_zone', label: 'Wind Speed Zone', category: 'Property' },

  // Owner
  { id: 'owner_name', label: 'Owner Name', category: 'Owner' },
  { id: 'owner_address', label: 'Owner Address', category: 'Owner' },
  { id: 'owner_city', label: 'Owner City', category: 'Owner' },
  { id: 'owner_state', label: 'Owner State', category: 'Owner' },
  { id: 'owner_zip', label: 'Owner ZIP', category: 'Owner' },
  { id: 'owner_phone', label: 'Owner Phone', category: 'Owner' },
  { id: 'owner_fax', label: 'Owner Fax', category: 'Owner' },
  { id: 'owner_email', label: 'Owner Email', category: 'Owner' },
  { id: 'tenant_name', label: 'Tenant Name', category: 'Owner' },

  // Contractor
  { id: 'contractor_name', label: 'Contractor Name', category: 'Contractor' },
  { id: 'contractor_company', label: 'Contractor Company/DBA', category: 'Contractor' },
  { id: 'contractor_license', label: 'Contractor License #', category: 'Contractor' },
  { id: 'contractor_address', label: 'Contractor Address', category: 'Contractor' },
  { id: 'contractor_suite', label: 'Contractor Suite', category: 'Contractor' },
  { id: 'contractor_city', label: 'Contractor City', category: 'Contractor' },
  { id: 'contractor_state', label: 'Contractor State', category: 'Contractor' },
  { id: 'contractor_zip', label: 'Contractor ZIP', category: 'Contractor' },
  { id: 'contractor_phone', label: 'Contractor Phone', category: 'Contractor' },
  { id: 'contractor_fax', label: 'Contractor Fax', category: 'Contractor' },
  { id: 'contractor_email', label: 'Contractor Email', category: 'Contractor' },
  { id: 'contractor_qualifier', label: 'Qualifier Name', category: 'Contractor' },

  // Project
  { id: 'permit_type', label: 'Permit Type', category: 'Project' },
  { id: 'scope_description', label: 'Scope of Work', category: 'Project' },
  { id: 'work_type', label: 'Work Type (New/Repair/etc)', category: 'Project' },
  { id: 'valuation', label: 'Project Valuation', category: 'Project' },
  { id: 'square_footage', label: 'Square Footage', category: 'Project' },
  { id: 'commencement_date', label: 'Commencement Date', category: 'Project' },
  { id: 'expiration_date', label: 'Expiration Date', category: 'Project' },

  // Roofing
  { id: 'roof_work_type', label: 'Roof Work Type', category: 'Roofing' },
  { id: 'roof_size_sqft', label: 'Roof Size (sq ft)', category: 'Roofing' },
  { id: 'roof_pitch', label: 'Roof Pitch', category: 'Roofing' },
  { id: 'roof_stories', label: '# of Stories', category: 'Roofing' },
  { id: 'existing_roof_material', label: 'Existing Roof Material', category: 'Roofing' },
  { id: 'new_roof_material', label: 'New Roof Material', category: 'Roofing' },
  { id: 'underlayment_product', label: 'Underlayment Product', category: 'Roofing' },
  { id: 'underlayment_noa', label: 'Underlayment NOA #', category: 'Roofing' },
  { id: 'roof_covering_product', label: 'Roof Covering Product', category: 'Roofing' },
  { id: 'roof_covering_noa', label: 'Roof Covering NOA #', category: 'Roofing' },
  { id: 'fastener_product', label: 'Fastener Product', category: 'Roofing' },
  { id: 'fastener_noa', label: 'Fastener NOA #', category: 'Roofing' },
  { id: 'deck_type', label: 'Deck Type', category: 'Roofing' },
  { id: 'deck_attachment_confirmed', label: 'Deck Attachment Confirmed', category: 'Roofing' },
  { id: 'year_built', label: 'Year Built', category: 'Roofing' },
  { id: 'building_type', label: 'Building Type', category: 'Roofing' },
  { id: 'has_exposed_ceilings', label: 'Has Exposed Ceilings', category: 'Roofing' },
  { id: 'has_ponding_water', label: 'Has Ponding Water', category: 'Roofing' },
  { id: 'requires_overflow_scuppers', label: 'Requires Overflow Scuppers', category: 'Roofing' },
  { id: 'obstacles', label: 'Roof Obstacles', category: 'Roofing' },

  // Windows & Doors
  { id: 'window_count', label: 'Window Count', category: 'Windows & Doors' },
  { id: 'door_count', label: 'Door Count', category: 'Windows & Doors' },
  { id: 'sliding_door_count', label: 'Sliding Door Count', category: 'Windows & Doors' },
  { id: 'frame_material', label: 'Frame Material', category: 'Windows & Doors' },
  { id: 'u_factor', label: 'U-Factor', category: 'Windows & Doors' },
  { id: 'shgc', label: 'SHGC', category: 'Windows & Doors' },
  { id: 'window_product', label: 'Window Product', category: 'Windows & Doors' },
  { id: 'window_noa', label: 'Window NOA #', category: 'Windows & Doors' },
  { id: 'door_product', label: 'Door Product', category: 'Windows & Doors' },
  { id: 'door_noa', label: 'Door NOA #', category: 'Windows & Doors' },

  // NOC
  { id: 'improvement_description', label: 'Improvement Description', category: 'NOC' },
  { id: 'lender_name', label: 'Lender Name', category: 'NOC' },
  { id: 'lender_address', label: 'Lender Address', category: 'NOC' },
  { id: 'bond_amount', label: 'Bond Amount', category: 'NOC' },
  { id: 'surety_name', label: 'Surety Name', category: 'NOC' },

  // Compliance
  { id: 'is_hvhz', label: 'Is HVHZ', category: 'Compliance' },
  { id: 'hvhz_protocol', label: 'HVHZ Protocol', category: 'Compliance' },
  { id: 'energy_code_compliant', label: 'Energy Code Compliant', category: 'Compliance' },
  { id: 'engineer_required', label: 'Engineer Required', category: 'Compliance' },

  // Auto
  { id: 'date_today', label: 'Today\'s Date', category: 'Auto' },
  { id: 'application_number', label: 'Application Number', category: 'Auto' },
];

const FIELD_CATEGORIES = ['Property', 'Owner', 'Contractor', 'Project', 'Roofing', 'Windows & Doors', 'NOC', 'Compliance', 'Auto'];

export default function PermitQueensAdminTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [extractedFields, setExtractedFields] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  const [newTemplate, setNewTemplate] = useState({
    jurisdiction_name: '',
    form_type: 'permit_application',
    form_name: '',
    category: 'application',
    trade_types: ['*'],
    hvhz_only: false,
    instructions: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('permit_form_templates')
        .select('*')
        .order('jurisdiction_name');
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, templateId?: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.includes('pdf')) {
      toast.error('Only PDF files are allowed');
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const filePath = `templates/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('permit-form-templates')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      if (templateId) {
        const { error: updateError } = await supabase
          .from('permit_form_templates')
          .update({ file_path: filePath })
          .eq('id', templateId);
        
        if (updateError) throw updateError;
        toast.success('PDF uploaded successfully');
        fetchTemplates();
      } else {
        // Creating new template
        const { data, error: insertError } = await supabase
          .from('permit_form_templates')
          .insert({
            ...newTemplate,
            file_path: filePath,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        toast.success('Template created successfully');
        setShowUploadDialog(false);
        setNewTemplate({
          jurisdiction_name: '',
          form_type: 'permit_application',
          form_name: '',
          category: 'application',
          trade_types: ['*'],
          hvhz_only: false,
          instructions: '',
        });
        fetchTemplates();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const extractPdfFields = async (template: FormTemplate, autoMap = true) => {
    setSelectedTemplate(template);
    setExtracting(true);
    setShowMappingDialog(true);

    try {
      const { data, error } = await supabase.functions.invoke('permit-form-extractor', {
        body: { templateId: template.id, filePath: template.file_path, autoMap },
      });

      if (error) throw error;
      setExtractedFields(data?.fields || []);

      const { data: mappings } = await supabase
        .from('permit_field_mappings')
        .select('*')
        .eq('template_id', template.id);

      setFieldMappings(mappings || []);

      if (autoMap && data?.saved_mappings > 0) {
        toast.success(`AI auto-mapped ${data.saved_mappings} of ${data.count} fields`);
      } else if (data?.count === 0) {
        toast.warning('No fillable AcroForm fields detected in this PDF');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to extract PDF fields');
      setExtractedFields([]);
    } finally {
      setExtracting(false);
    }
  };

  const reRunAiMapping = async () => {
    if (!selectedTemplate) return;
    await extractPdfFields(selectedTemplate, true);
  };

  const saveFieldMapping = async (pdfField: string, ourField: string) => {
    if (!selectedTemplate) return;
    
    try {
      const { error } = await supabase
        .from('permit_field_mappings')
        .upsert({
          template_id: selectedTemplate.id,
          pdf_field: pdfField,
          our_field: ourField,
          field_type: 'text',
          is_required: true,
        }, { onConflict: 'template_id,pdf_field' });
      
      if (error) throw error;
      
      // Refresh mappings
      const { data: mappings } = await supabase
        .from('permit_field_mappings')
        .select('*')
        .eq('template_id', selectedTemplate.id);
      
      setFieldMappings(mappings || []);
      toast.success('Mapping saved');
    } catch (error) {
      console.error('Mapping error:', error);
      toast.error('Failed to save mapping');
    }
  };

  const deleteTemplate = async (id: string) => {
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
      toast.error('Failed to delete template');
    }
  };

  const getStatusBadge = (template: FormTemplate) => {
    if (template.file_path?.startsWith('pending/')) {
      return <Badge variant="outline" className="text-orange-600 border-orange-300">Pending Upload</Badge>;
    }
    const mappingCount = fieldMappings.filter(m => m.template_id === template.id).length;
    if (mappingCount === 0) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Needs Mapping</Badge>;
    }
    return <Badge className="bg-green-500">Ready</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/permit-queens/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Crown className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Form Template Manager</span>
            </div>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Form Template</DialogTitle>
                  <DialogDescription>
                    Upload a blank PDF permit form to map fields for auto-fill
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Jurisdiction Name</Label>
                    <Input 
                      value={newTemplate.jurisdiction_name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, jurisdiction_name: e.target.value }))}
                      placeholder="e.g., Miami-Dade County"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Form Name</Label>
                    <Input 
                      value={newTemplate.form_name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, form_name: e.target.value }))}
                      placeholder="e.g., Building Permit Application"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Form Type</Label>
                    <Select 
                      value={newTemplate.form_type}
                      onValueChange={(v) => setNewTemplate(prev => ({ ...prev, form_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permit_application">Permit Application</SelectItem>
                        <SelectItem value="noc">Notice of Commencement</SelectItem>
                        <SelectItem value="affidavit">Affidavit</SelectItem>
                        <SelectItem value="disclosure">Disclosure Form</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <Textarea 
                      value={newTemplate.instructions}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder="Notes about when this form is required..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload PDF</Label>
                    <Input 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e)}
                      disabled={uploading || !newTemplate.jurisdiction_name || !newTemplate.form_name}
                    />
                    {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{templates.length}</div>
                <p className="text-sm text-muted-foreground">Total Templates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {templates.filter(t => !t.file_path?.startsWith('pending/')).length}
                </div>
                <p className="text-sm text-muted-foreground">PDFs Uploaded</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">
                  {templates.filter(t => t.file_path?.startsWith('pending/')).length}
                </div>
                <p className="text-sm text-muted-foreground">Pending Upload</p>
              </CardContent>
            </Card>
          </div>

          {/* Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Form Templates</CardTitle>
              <CardDescription>
                Manage PDF templates and field mappings for auto-fill
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No templates yet. Add your first form template to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Form Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map(template => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.jurisdiction_name}</TableCell>
                        <TableCell>{template.form_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.form_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {template.file_path?.startsWith('pending/') ? (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Pending Upload
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ready
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {template.file_path?.startsWith('pending/') ? (
                              <Label className="cursor-pointer">
                                <Input 
                                  type="file" 
                                  accept=".pdf" 
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, template.id)}
                                />
                                <Button variant="outline" size="sm" asChild>
                                  <span>
                                    <Upload className="h-4 w-4 mr-1" />
                                    Upload
                                  </span>
                                </Button>
                              </Label>
                            ) : (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => extractPdfFields(template)}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Map Fields
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteTemplate(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </div>
      </main>

      {/* Field Mapping Dialog */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Map PDF Fields</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.form_name} - {selectedTemplate?.jurisdiction_name}
            </DialogDescription>
          </DialogHeader>
          
          {extracting ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p>Extracting PDF fields...</p>
            </div>
          ) : extractedFields.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No fillable fields found in this PDF.</p>
              <p className="text-sm">Make sure the PDF has fillable form fields.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {extractedFields.length} fillable fields • {fieldMappings.length} mapped
                </p>
                <Button variant="outline" size="sm" onClick={reRunAiMapping} disabled={extracting}>
                  {extracting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Settings className="h-4 w-4 mr-1" />}
                  Re-run AI Auto-Map
                </Button>
              </div>
              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {extractedFields.map((pdfField, idx) => {
                  const existingMapping = fieldMappings.find(m => m.pdf_field === pdfField);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3">
                      <div className="flex-1">
                        <p className="font-mono text-sm">{pdfField}</p>
                        {existingMapping && (
                          <p className="text-xs text-green-600">
                            → {OUR_FIELDS.find(f => f.id === existingMapping.our_field)?.label || existingMapping.our_field}
                          </p>
                        )}
                      </div>
                      <Select
                        value={existingMapping?.our_field || ''}
                        onValueChange={(v) => saveFieldMapping(pdfField, v)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Map to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_CATEGORIES.map(cat => (
                            <SelectGroup key={cat}>
                              <SelectLabel>{cat}</SelectLabel>
                              {OUR_FIELDS.filter(f => f.category === cat).map(field => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
