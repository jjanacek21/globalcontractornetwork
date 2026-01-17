import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface BuildingDepartment {
  id?: string;
  county: string;
  city: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  fax: string | null;
  website: string | null;
  portal_url: string | null;
  hours: string | null;
  jurisdiction_type: string | null;
  zip_codes: string[];
  is_hvhz: boolean;
  submission_method: string;
  processing_time: string | null;
  notes: string | null;
}

interface DepartmentEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (department: BuildingDepartment) => Promise<void>;
  department?: BuildingDepartment | null;
}

const FLORIDA_COUNTIES = [
  'Alachua', 'Baker', 'Bay', 'Bradford', 'Brevard', 'Broward', 'Calhoun', 'Charlotte',
  'Citrus', 'Clay', 'Collier', 'Columbia', 'DeSoto', 'Dixie', 'Duval', 'Escambia',
  'Flagler', 'Franklin', 'Gadsden', 'Gilchrist', 'Glades', 'Gulf', 'Hamilton', 'Hardee',
  'Hendry', 'Hernando', 'Highlands', 'Hillsborough', 'Holmes', 'Indian River', 'Jackson',
  'Jefferson', 'Lafayette', 'Lake', 'Lee', 'Leon', 'Levy', 'Liberty', 'Madison', 'Manatee',
  'Marion', 'Martin', 'Miami-Dade', 'Monroe', 'Nassau', 'Okaloosa', 'Okeechobee', 'Orange',
  'Osceola', 'Palm Beach', 'Pasco', 'Pinellas', 'Polk', 'Putnam', 'Santa Rosa', 'Sarasota',
  'Seminole', 'St. Johns', 'St. Lucie', 'Sumter', 'Suwannee', 'Taylor', 'Union', 'Volusia',
  'Wakulla', 'Walton', 'Washington'
];

export function DepartmentEditor({ open, onClose, onSave, department }: DepartmentEditorProps) {
  const [formData, setFormData] = useState<BuildingDepartment>({
    county: '',
    city: null,
    name: '',
    address: null,
    phone: null,
    email: null,
    fax: null,
    website: null,
    portal_url: null,
    hours: null,
    jurisdiction_type: 'city',
    zip_codes: [],
    is_hvhz: false,
    submission_method: 'online',
    processing_time: null,
    notes: null,
  });
  const [zipInput, setZipInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({
        ...department,
        zip_codes: department.zip_codes || [],
      });
    } else {
      setFormData({
        county: '',
        city: null,
        name: '',
        address: null,
        phone: null,
        email: null,
        fax: null,
        website: null,
        portal_url: null,
        hours: null,
        jurisdiction_type: 'city',
        zip_codes: [],
        is_hvhz: false,
        submission_method: 'online',
        processing_time: null,
        notes: null,
      });
    }
  }, [department, open]);

  const handleAddZip = () => {
    const zips = zipInput.split(/[,\s]+/).filter(z => z.match(/^\d{5}$/));
    if (zips.length > 0) {
      setFormData(prev => ({
        ...prev,
        zip_codes: [...new Set([...prev.zip_codes, ...zips])],
      }));
      setZipInput('');
    } else if (zipInput.trim()) {
      toast.error('Enter valid 5-digit ZIP codes');
    }
  };

  const handleRemoveZip = (zip: string) => {
    setFormData(prev => ({
      ...prev,
      zip_codes: prev.zip_codes.filter(z => z !== zip),
    }));
  };

  const handleSave = async () => {
    if (!formData.county || !formData.name) {
      toast.error('County and Department Name are required');
      return;
    }
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error('Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {department?.id ? 'Edit Building Department' : 'Add Building Department'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Basic Info */}
          <div className="col-span-2">
            <Label className="text-slate-300">County *</Label>
            <Select value={formData.county} onValueChange={(v) => setFormData(prev => ({ ...prev, county: v }))}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Select County" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                {FLORIDA_COUNTIES.map(county => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">City (leave empty for county-level)</Label>
            <Input
              value={formData.city || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value || null }))}
              placeholder="e.g., Fort Lauderdale"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div>
            <Label className="text-slate-300">Jurisdiction Type</Label>
            <Select value={formData.jurisdiction_type || 'city'} onValueChange={(v) => setFormData(prev => ({ ...prev, jurisdiction_type: v }))}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="county">County</SelectItem>
                <SelectItem value="municipality">Municipality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label className="text-slate-300">Department Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., City of Fort Lauderdale Building Services"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="col-span-2">
            <Label className="text-slate-300">Address</Label>
            <Input
              value={formData.address || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value || null }))}
              placeholder="123 Main St, City, FL 33301"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {/* Contact Info */}
          <div>
            <Label className="text-slate-300">Phone</Label>
            <Input
              value={formData.phone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value || null }))}
              placeholder="954-555-1234"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div>
            <Label className="text-slate-300">Email</Label>
            <Input
              value={formData.email || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value || null }))}
              placeholder="building@city.gov"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div>
            <Label className="text-slate-300">Fax</Label>
            <Input
              value={formData.fax || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, fax: e.target.value || null }))}
              placeholder="954-555-1235"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div>
            <Label className="text-slate-300">Hours</Label>
            <Input
              value={formData.hours || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value || null }))}
              placeholder="Mon-Fri 8am-5pm"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {/* Online Info */}
          <div className="col-span-2">
            <Label className="text-slate-300">Website</Label>
            <Input
              value={formData.website || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value || null }))}
              placeholder="https://www.city.gov/building"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="col-span-2">
            <Label className="text-slate-300">Permit Portal URL</Label>
            <Input
              value={formData.portal_url || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, portal_url: e.target.value || null }))}
              placeholder="https://permits.city.gov"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {/* Operations */}
          <div>
            <Label className="text-slate-300">Submission Method</Label>
            <Select value={formData.submission_method} onValueChange={(v) => setFormData(prev => ({ ...prev, submission_method: v }))}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="online">Online Portal</SelectItem>
                <SelectItem value="in-person">In Person</SelectItem>
                <SelectItem value="mail">Mail</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Processing Time</Label>
            <Input
              value={formData.processing_time || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, processing_time: e.target.value || null }))}
              placeholder="3-5 business days"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {/* HVHZ Toggle */}
          <div className="col-span-2 flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
            <Switch
              checked={formData.is_hvhz}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_hvhz: checked }))}
            />
            <div>
              <Label className="text-slate-200 font-medium">High Velocity Hurricane Zone (HVHZ)</Label>
              <p className="text-sm text-slate-400">Requires Miami-Dade NOA approved products</p>
            </div>
          </div>

          {/* ZIP Codes */}
          <div className="col-span-2">
            <Label className="text-slate-300">ZIP Codes Covered</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                placeholder="Enter ZIP codes (comma separated)"
                className="bg-slate-800 border-slate-700"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddZip())}
              />
              <Button type="button" variant="secondary" onClick={handleAddZip}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.zip_codes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.zip_codes.map(zip => (
                  <Badge key={zip} variant="secondary" className="bg-slate-700 hover:bg-slate-600">
                    {zip}
                    <button onClick={() => handleRemoveZip(zip)} className="ml-1 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <Label className="text-slate-300">Notes</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value || null }))}
              placeholder="Internal notes about this department..."
              className="bg-slate-800 border-slate-700"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
            {saving ? 'Saving...' : 'Save Department'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
