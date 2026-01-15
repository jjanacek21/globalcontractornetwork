import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight, ArrowLeft, Check, Upload, X, Image } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    service_category: string;
    property_address: string;
    budget_min?: number;
    budget_max?: number;
    timeline?: string;
    urgency: string;
    photos?: File[];
  }) => Promise<any>;
  creating: boolean;
}

const SERVICE_CATEGORIES = [
  'Roofing',
  'Windows & Doors',
  'Tree Removal & Landscaping',
  'Emergency Mitigation',
  'Mold Remediation',
  'Soffit & Fascia',
  'Gutters',
  'Painting',
  'HVAC',
  'Plumbing',
  'Electrical',
  'General Contractor',
  'Other'
];

const URGENCY_OPTIONS = [
  { value: 'flexible', label: 'Flexible - No rush' },
  { value: 'standard', label: 'Standard - Within a month' },
  { value: 'urgent', label: 'Urgent - Within a week' },
  { value: 'emergency', label: 'Emergency - ASAP' }
];

const TIMELINE_OPTIONS = [
  { value: 'flexible', label: 'Flexible - No specific timeline' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_week', label: 'This Week' },
  { value: 'asap', label: 'ASAP' }
];

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function CreateJobDialog({ open, onOpenChange, onSubmit, creating }: CreateJobDialogProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service_category: '',
    property_address: '',
    budget_min: '',
    budget_max: '',
    timeline: '',
    urgency: 'standard'
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setStep(1);
    setFormData({
      title: '',
      description: '',
      service_category: '',
      property_address: '',
      budget_min: '',
      budget_max: '',
      timeline: '',
      urgency: 'standard'
    });
    setPhotos([]);
    setPhotoPreviewUrls([]);
    onOpenChange(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_PHOTOS - photos.length;
    
    const validFiles = files
      .filter(file => {
        if (!file.type.startsWith('image/')) {
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          return false;
        }
        return true;
      })
      .slice(0, remainingSlots);

    if (validFiles.length > 0) {
      const newPhotos = [...photos, ...validFiles];
      setPhotos(newPhotos);
      
      // Create preview URLs
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviewUrls = photoPreviewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newPreviewUrls);
  };

  const handleSubmit = async () => {
    const result = await onSubmit({
      title: formData.title,
      description: formData.description || undefined,
      service_category: formData.service_category,
      property_address: formData.property_address,
      budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
      timeline: formData.timeline || undefined,
      urgency: formData.urgency,
      photos: photos.length > 0 ? photos : undefined
    });

    if (result) {
      handleClose();
    }
  };

  const canProceedStep1 = formData.title && formData.service_category;
  const canProceedStep2 = formData.property_address;
  const canSubmit = canProceedStep1 && canProceedStep2;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a New Job</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Describe what you need done'}
            {step === 2 && 'Where is the work needed?'}
            {step === 3 && 'Set your budget and add photos'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="space-y-4 py-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="service_category">Service Type *</Label>
                <Select
                  value={formData.service_category}
                  onValueChange={(value) => setFormData({ ...formData, service_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Roof leak repair needed"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the work needed in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="property_address">Property Address *</Label>
                <AddressAutocomplete
                  id="property_address"
                  value={formData.property_address}
                  onChange={(address) => setFormData({ ...formData, property_address: address })}
                  placeholder="Start typing to search addresses..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">How urgent is this? *</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Budget Range (Optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="budget_min" className="text-xs text-muted-foreground">Minimum</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      placeholder="$0"
                      value={formData.budget_min}
                      onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget_max" className="text-xs text-muted-foreground">Maximum</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      placeholder="$0"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Preferred Timeline</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Photos (Optional - up to {MAX_PHOTOS})
                </Label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {/* Photo previews */}
                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length < MAX_PHOTOS && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {photos.length === 0 ? 'Add Photos' : `Add More (${MAX_PHOTOS - photos.length} remaining)`}
                  </Button>
                )}

                <p className="text-xs text-muted-foreground">
                  Upload photos of the area that needs work. Max 5MB per photo.
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium text-sm">Job Summary</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Service:</strong> {formData.service_category}</p>
                  <p><strong>Title:</strong> {formData.title}</p>
                  <p><strong>Location:</strong> {formData.property_address}</p>
                  {formData.budget_min || formData.budget_max ? (
                    <p><strong>Budget:</strong> ${formData.budget_min || '0'} - ${formData.budget_max || 'No max'}</p>
                  ) : null}
                  {photos.length > 0 && (
                    <p><strong>Photos:</strong> {photos.length} attached</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canSubmit || creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Post Job
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
