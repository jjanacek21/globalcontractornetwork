import { useState, useEffect } from 'react';
import { X, MapPin, User, Phone, Mail, StickyNote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DispositionQuickBar, getDispositionColor } from './DispositionQuickBar';
import type { PropertyDisposition, PropertyData } from '@/hooks/usePropertyDispositions';
import { cn } from '@/lib/utils';

interface PropertySidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    lat: number;
    lng: number;
    address?: string;
    disposition?: PropertyDisposition;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    notes?: string;
  } | null;
  onSave: (
    disposition: PropertyDisposition,
    customerInfo: {
      name?: string;
      phone?: string;
      email?: string;
      notes?: string;
    }
  ) => void;
  loading?: boolean;
}

export function PropertySidePanel({
  isOpen,
  onClose,
  property,
  onSave,
  loading
}: PropertySidePanelProps) {
  const [disposition, setDisposition] = useState<PropertyDisposition>('not_contacted');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Update form when property changes
  useEffect(() => {
    if (property) {
      setDisposition(property.disposition || 'not_contacted');
      setCustomerName(property.customerName || '');
      setCustomerPhone(property.customerPhone || '');
      setCustomerEmail(property.customerEmail || '');
      setNotes(property.notes || '');
      setShowCustomerForm(!!property.customerName || !!property.customerPhone || !!property.customerEmail);
    }
  }, [property]);

  const handleDispositionSelect = (newDisposition: PropertyDisposition) => {
    setDisposition(newDisposition);
    // Auto-save on disposition change
    onSave(newDisposition, {
      name: customerName || undefined,
      phone: customerPhone || undefined,
      email: customerEmail || undefined,
      notes: notes || undefined,
    });
  };

  const handleSaveDetails = () => {
    onSave(disposition, {
      name: customerName || undefined,
      phone: customerPhone || undefined,
      email: customerEmail || undefined,
      notes: notes || undefined,
    });
  };

  if (!property) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 z-40 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[380px] bg-background shadow-2xl z-50 transition-transform duration-200 ease-out overflow-hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b bg-muted/30">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-4 h-4 rounded-full border-2"
                style={{ 
                  borderColor: getDispositionColor(disposition),
                  backgroundColor: disposition !== 'not_contacted' 
                    ? getDispositionColor(disposition) 
                    : 'transparent'
                }}
              />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {disposition.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm leading-tight">
                  {property.address || 'Unknown Address'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {property.lat.toFixed(5)}, {property.lng.toFixed(5)}
                </p>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick Disposition */}
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold mb-3">Quick Disposition</h3>
            <DispositionQuickBar 
              currentDisposition={disposition}
              onSelect={handleDispositionSelect}
              disabled={loading}
            />
          </div>

          {/* Customer Info */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Customer Info</h3>
              {!showCustomerForm && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCustomerForm(true)}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Customer
                </Button>
              )}
            </div>
            
            {showCustomerForm && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="customerName" className="text-xs flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    Name
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Homeowner name"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customerPhone" className="text-xs flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    Phone
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customerEmail" className="text-xs flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    Email
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <StickyNote className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Notes</h3>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this property..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <Button 
            onClick={handleSaveDetails}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Saving...' : 'Save Details'}
          </Button>
        </div>
      </div>
    </>
  );
}
