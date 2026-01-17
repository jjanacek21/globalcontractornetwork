import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, ClipboardList, Trash2, Edit2, Sparkles, FileQuestion } from "lucide-react";

interface RequiredInfo {
  id: string;
  building_dept_id: string;
  trade_type: string;
  info_type: string;
  info_name: string;
  info_description: string | null;
  is_required: boolean;
  ai_extractable: boolean;
  field_key: string | null;
  example_value: string | null;
  sort_order: number;
}

interface RequiredInfoChecklistProps {
  departmentId: string;
  departmentName: string;
}

const TRADE_TYPES = ['roofing', 'hvac', 'electrical', 'plumbing', 'windows_doors', 'solar', 'general'];
const INFO_TYPES = [
  { value: 'measurement', label: 'Measurement' },
  { value: 'document', label: 'Document Upload' },
  { value: 'product_spec', label: 'Product Specification' },
  { value: 'contractor_info', label: 'Contractor Info' },
  { value: 'property_info', label: 'Property Info' },
  { value: 'other', label: 'Other' },
];

export function RequiredInfoChecklist({ departmentId, departmentName }: RequiredInfoChecklistProps) {
  const [infoItems, setInfoItems] = useState<RequiredInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RequiredInfo | null>(null);
  const [formData, setFormData] = useState({
    trade_type: 'roofing',
    info_type: 'measurement',
    info_name: '',
    info_description: '',
    is_required: true,
    ai_extractable: false,
    field_key: '',
    example_value: '',
    sort_order: 0,
  });

  useEffect(() => {
    fetchInfoItems();
  }, [departmentId]);

  const fetchInfoItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('permit_required_info')
      .select('*')
      .eq('building_dept_id', departmentId)
      .order('trade_type')
      .order('sort_order');

    if (error) {
      console.error('Error fetching required info:', error);
      toast.error('Failed to load required info');
    } else {
      setInfoItems(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (item?: RequiredInfo) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        trade_type: item.trade_type,
        info_type: item.info_type,
        info_name: item.info_name,
        info_description: item.info_description || '',
        is_required: item.is_required,
        ai_extractable: item.ai_extractable,
        field_key: item.field_key || '',
        example_value: item.example_value || '',
        sort_order: item.sort_order,
      });
    } else {
      setEditingItem(null);
      setFormData({
        trade_type: 'roofing',
        info_type: 'measurement',
        info_name: '',
        info_description: '',
        is_required: true,
        ai_extractable: false,
        field_key: '',
        example_value: '',
        sort_order: infoItems.length,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.info_name) {
      toast.error('Info name is required');
      return;
    }

    const itemData = {
      building_dept_id: departmentId,
      trade_type: formData.trade_type,
      info_type: formData.info_type,
      info_name: formData.info_name,
      info_description: formData.info_description || null,
      is_required: formData.is_required,
      ai_extractable: formData.ai_extractable,
      field_key: formData.field_key || null,
      example_value: formData.example_value || null,
      sort_order: formData.sort_order,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('permit_required_info')
        .update(itemData)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Failed to update item');
        return;
      }
      toast.success('Item updated');
    } else {
      const { error } = await supabase
        .from('permit_required_info')
        .insert(itemData);

      if (error) {
        toast.error('Failed to add item');
        return;
      }
      toast.success('Item added');
    }

    setDialogOpen(false);
    fetchInfoItems();
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const { error } = await supabase
      .from('permit_required_info')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to delete item');
      return;
    }

    toast.success('Item deleted');
    fetchInfoItems();
  };

  // Group items by trade type
  const groupedItems = infoItems.reduce((acc, item) => {
    if (!acc[item.trade_type]) acc[item.trade_type] = [];
    acc[item.trade_type].push(item);
    return acc;
  }, {} as Record<string, RequiredInfo[]>);

  const getInfoTypeIcon = (type: string) => {
    switch (type) {
      case 'measurement': return '📏';
      case 'document': return '📄';
      case 'product_spec': return '🏷️';
      case 'contractor_info': return '👷';
      case 'property_info': return '🏠';
      default: return '📋';
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Required Information Checklist
        </CardTitle>
        <Button onClick={() => handleOpenDialog()} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-slate-400 text-center py-8">Loading checklist...</p>
        ) : infoItems.length === 0 ? (
          <div className="text-center py-8">
            <FileQuestion className="h-12 w-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">No checklist items configured</p>
            <p className="text-sm text-slate-500">Add items that users need to provide for permit applications</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([tradeType, items]) => (
              <div key={tradeType}>
                <h3 className="text-lg font-semibold text-amber-400 mb-2 capitalize">
                  {tradeType.replace('_', ' & ')}
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Item</TableHead>
                      <TableHead className="text-slate-400">Required</TableHead>
                      <TableHead className="text-slate-400">AI Extract</TableHead>
                      <TableHead className="text-slate-400">Example</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="border-slate-700">
                        <TableCell>
                          <span className="text-lg mr-2">{getInfoTypeIcon(item.info_type)}</span>
                          <span className="text-slate-400 text-sm capitalize">{item.info_type.replace('_', ' ')}</span>
                        </TableCell>
                        <TableCell>
                          <p className="text-white font-medium">{item.info_name}</p>
                          {item.info_description && (
                            <p className="text-sm text-slate-400">{item.info_description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.is_required ? 'default' : 'secondary'} className={item.is_required ? 'bg-red-500/20 text-red-400' : ''}>
                            {item.is_required ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.ai_extractable ? (
                            <Badge className="bg-purple-500/20 text-purple-400">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          ) : (
                            <span className="text-slate-500">Manual</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {item.example_value || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(item)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300">
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

        {/* Add/Edit Item Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Checklist Item' : 'Add Checklist Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label className="text-slate-300">Info Type</Label>
                  <Select value={formData.info_type} onValueChange={(v) => setFormData(prev => ({ ...prev, info_type: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {INFO_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Item Name</Label>
                <Input
                  value={formData.info_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, info_name: e.target.value }))}
                  placeholder="e.g., Roof Square Footage"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div>
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  value={formData.info_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, info_description: e.target.value }))}
                  placeholder="Explain what this information is used for..."
                  className="bg-slate-800 border-slate-700"
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-slate-300">Example Value</Label>
                <Input
                  value={formData.example_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, example_value: e.target.value }))}
                  placeholder="e.g., 2,500 sq ft"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div>
                <Label className="text-slate-300">Field Key (for form mapping)</Label>
                <Input
                  value={formData.field_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_key: e.target.value }))}
                  placeholder="e.g., roof_sqft"
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
                    checked={formData.ai_extractable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ai_extractable: checked }))}
                  />
                  <Label className="text-slate-300 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    AI Can Extract
                  </Label>
                </div>
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
