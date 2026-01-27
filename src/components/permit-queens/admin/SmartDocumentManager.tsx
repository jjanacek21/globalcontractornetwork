import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  FileText, 
  Sparkles, 
  Upload, 
  Eye, 
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentUploadZone } from './DocumentUploadZone';

interface BuildingDepartment {
  id: string;
  name: string;
  county: string;
  city: string | null;
}

interface SmartDocument {
  id: string;
  form_name: string;
  form_type: string;
  file_path: string;
  is_fillable: boolean;
  field_count: number;
  analysis_status: string;
  building_dept_id: string | null;
  trade_types: string[];
  created_at: string;
}

interface GroupedDocuments {
  [tradeType: string]: SmartDocument[];
}

const TRADE_TYPES = ['Roofing', 'Windows/Doors', 'HVAC', 'Electrical', 'Plumbing', 'General'];

export function SmartDocumentManager() {
  const [departments, setDepartments] = useState<BuildingDepartment[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [documents, setDocuments] = useState<SmartDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchDocuments();
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('permit_building_departments')
      .select('id, name, county, city')
      .order('county')
      .order('name');

    if (error) {
      toast.error('Failed to fetch building departments');
      console.error(error);
      return;
    }

    setDepartments(data || []);
    setLoading(false);
  };

  const fetchDocuments = async () => {
    if (!selectedDepartment) return;

    const { data, error } = await supabase
      .from('permit_form_templates')
      .select('*')
      .eq('building_dept_id', selectedDepartment)
      .order('form_name');

    if (error) {
      toast.error('Failed to fetch documents');
      console.error(error);
      return;
    }

    setDocuments(data || []);
  };

  const groupDocumentsByTrade = (docs: SmartDocument[]): GroupedDocuments => {
    const grouped: GroupedDocuments = {};
    
    TRADE_TYPES.forEach(trade => {
      grouped[trade] = [];
    });

    docs.forEach(doc => {
      const trades = doc.trade_types || ['General'];
      trades.forEach(trade => {
        if (grouped[trade]) {
          grouped[trade].push(doc);
        } else {
          grouped['General'].push(doc);
        }
      });
    });

    return grouped;
  };

  const handleDocumentUploaded = (template: SmartDocument) => {
    setDocuments(prev => [...prev, template]);
  };

  const triggerReanalysis = async (doc: SmartDocument) => {
    setAnalyzing(doc.id);
    try {
      // Get public URL for the document
      const { data: urlData } = supabase.storage
        .from('permit-form-templates')
        .getPublicUrl(doc.file_path);

      await supabase.functions.invoke('permit-packet-analyzer', {
        body: {
          mode: 'detect_and_analyze',
          templateId: doc.id,
          fileUrl: urlData.publicUrl
        }
      });

      toast.success('Re-analysis started', {
        description: 'The document is being analyzed for fillable fields'
      });

      // Refresh documents after a delay
      setTimeout(fetchDocuments, 3000);
    } catch (error) {
      toast.error('Failed to start re-analysis');
      console.error(error);
    } finally {
      setAnalyzing(null);
    }
  };

  const viewDocument = (doc: SmartDocument) => {
    const { data } = supabase.storage
      .from('permit-form-templates')
      .getPublicUrl(doc.file_path);
    window.open(data.publicUrl, '_blank');
  };

  const selectedDept = departments.find(d => d.id === selectedDepartment);
  const groupedDocs = groupDocumentsByTrade(documents);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Ready</Badge>;
      case 'analyzing':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analyzing</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Document Manager
          </CardTitle>
          <CardDescription>
            Upload and manage blank permit forms organized by building department. 
            AI automatically detects fillable fields for smart form filling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Department Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Building Department</label>
            <Select value={selectedDepartment || ''} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Choose a building department..." />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{dept.name}</span>
                      <Badge variant="outline" className="text-xs ml-2">{dept.county}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Department View */}
          {selectedDepartment && selectedDept && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedDept.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedDept.city ? `${selectedDept.city}, ` : ''}{selectedDept.county} County
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDocuments}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Upload Zone */}
              <DocumentUploadZone 
                buildingDeptId={selectedDepartment}
                buildingDeptName={selectedDept?.name || ''}
                onDocumentUploaded={handleDocumentUploaded}
              />

              {/* Documents by Trade */}
              <Tabs defaultValue="Roofing" className="w-full">
                <TabsList className="flex-wrap h-auto gap-1">
                  {TRADE_TYPES.map(trade => (
                    <TabsTrigger key={trade} value={trade} className="text-xs">
                      {trade} ({groupedDocs[trade]?.length || 0})
                    </TabsTrigger>
                  ))}
                </TabsList>

                {TRADE_TYPES.map(trade => (
                  <TabsContent key={trade} value={trade} className="mt-4">
                    {groupedDocs[trade]?.length === 0 ? (
                      <Alert>
                        <FolderOpen className="h-4 w-4" />
                        <AlertDescription>
                          No {trade.toLowerCase()} documents uploaded yet. 
                          Use the upload zone above to add blank forms.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid gap-3">
                        {groupedDocs[trade]?.map(doc => (
                          <div 
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{doc.form_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {getStatusBadge(doc.analysis_status)}
                                  {doc.field_count > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {doc.field_count} fields
                                    </Badge>
                                  )}
                                  {doc.is_fillable && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      AI-Fillable
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewDocument(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => triggerReanalysis(doc)}
                                disabled={analyzing === doc.id}
                              >
                                {analyzing === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {!selectedDepartment && (
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                Select a building department above to view and manage its permit form templates.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
