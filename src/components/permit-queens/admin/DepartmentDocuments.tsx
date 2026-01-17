import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, Trash2, Edit2, Upload, Sparkles } from "lucide-react";

interface DepartmentDocument {
  id: string;
  building_dept_id: string;
  template_id: string | null;
  trade_type: string;
  document_name: string;
  document_url: string | null;
  is_required: boolean;
  is_smart_doc: boolean;
  field_mapping: any;
  sort_order: number;
  notes: string | null;
}

interface DepartmentDocumentsProps {
  departmentId: string;
  departmentName: string;
}

const TRADE_TYPES = ['roofing', 'hvac', 'electrical', 'plumbing', 'windows_doors', 'solar', 'general'];

export function DepartmentDocuments({ departmentId, departmentName }: DepartmentDocumentsProps) {
  const [documents, setDocuments] = useState<DepartmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DepartmentDocument | null>(null);
  const [formData, setFormData] = useState({
    trade_type: 'roofing',
    document_name: '',
    document_url: '',
    is_required: true,
    is_smart_doc: false,
    sort_order: 0,
    notes: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, [departmentId]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('permit_department_documents')
      .select('*')
      .eq('building_dept_id', departmentId)
      .order('trade_type')
      .order('sort_order');

    if (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (doc?: DepartmentDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        trade_type: doc.trade_type,
        document_name: doc.document_name,
        document_url: doc.document_url || '',
        is_required: doc.is_required,
        is_smart_doc: doc.is_smart_doc,
        sort_order: doc.sort_order,
        notes: doc.notes || '',
      });
    } else {
      setEditingDoc(null);
      setFormData({
        trade_type: 'roofing',
        document_name: '',
        document_url: '',
        is_required: true,
        is_smart_doc: false,
        sort_order: documents.length,
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.document_name) {
      toast.error('Document name is required');
      return;
    }

    const docData = {
      building_dept_id: departmentId,
      trade_type: formData.trade_type,
      document_name: formData.document_name,
      document_url: formData.document_url || null,
      is_required: formData.is_required,
      is_smart_doc: formData.is_smart_doc,
      sort_order: formData.sort_order,
      notes: formData.notes || null,
      field_mapping: {},
    };

    if (editingDoc) {
      const { error } = await supabase
        .from('permit_department_documents')
        .update(docData)
        .eq('id', editingDoc.id);

      if (error) {
        toast.error('Failed to update document');
        return;
      }
      toast.success('Document updated');
    } else {
      const { error } = await supabase
        .from('permit_department_documents')
        .insert(docData);

      if (error) {
        toast.error('Failed to add document');
        return;
      }
      toast.success('Document added');
    }

    setDialogOpen(false);
    fetchDocuments();
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const { error } = await supabase
      .from('permit_department_documents')
      .delete()
      .eq('id', docId);

    if (error) {
      toast.error('Failed to delete document');
      return;
    }

    toast.success('Document deleted');
    fetchDocuments();
  };

  // Group documents by trade type
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.trade_type]) acc[doc.trade_type] = [];
    acc[doc.trade_type].push(doc);
    return acc;
  }, {} as Record<string, DepartmentDocument[]>);

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Required Documents for {departmentName}
        </CardTitle>
        <Button onClick={() => handleOpenDialog()} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-slate-400 text-center py-8">Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No documents configured for this department</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDocs).map(([tradeType, docs]) => (
              <div key={tradeType}>
                <h3 className="text-lg font-semibold text-amber-400 mb-2 capitalize">
                  {tradeType.replace('_', ' & ')}
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Document</TableHead>
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Required</TableHead>
                      <TableHead className="text-slate-400">Smart Doc</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.map((doc) => (
                      <TableRow key={doc.id} className="border-slate-700">
                        <TableCell className="text-white font-medium">{doc.document_name}</TableCell>
                        <TableCell>
                          {doc.document_url ? (
                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                              View PDF
                            </a>
                          ) : (
                            <span className="text-slate-500">No file</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={doc.is_required ? 'default' : 'secondary'} className={doc.is_required ? 'bg-red-500/20 text-red-400' : ''}>
                            {doc.is_required ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {doc.is_smart_doc ? (
                            <Badge className="bg-purple-500/20 text-purple-400">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI-Fillable
                            </Badge>
                          ) : (
                            <span className="text-slate-500">Manual</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(doc)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Document Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{editingDoc ? 'Edit Document' : 'Add Document'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-slate-300">Trade Type</Label>
                <Select value={formData.trade_type} onValueChange={(v) => setFormData(prev => ({ ...prev, trade_type: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {TRADE_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type.replace('_', ' & ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Document Name</Label>
                <Input
                  value={formData.document_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_name: e.target.value }))}
                  placeholder="e.g., Permit Application Form"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div>
                <Label className="text-slate-300">Document URL (PDF)</Label>
                <Input
                  value={formData.document_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_url: e.target.value }))}
                  placeholder="https://city.gov/forms/permit-app.pdf"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
                  />
                  <Label className="text-slate-300">Required</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_smart_doc}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_smart_doc: checked }))}
                  />
                  <Label className="text-slate-300 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    AI Smart Doc
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-800 border-slate-700 w-24"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
