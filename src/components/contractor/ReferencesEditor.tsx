import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Users, Quote } from 'lucide-react';
import { ClientReference } from '@/hooks/useContractorProfile';

interface ReferencesEditorProps {
  references: ClientReference[] | null;
  onAdd: (reference: ClientReference) => Promise<boolean>;
  onRemove: (index: number) => Promise<boolean>;
}

export function ReferencesEditor({ references, onAdd, onRemove }: ReferencesEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ClientReference>({
    name: '',
    company: '',
    phone: '',
    email: '',
    project_type: '',
    testimonial: ''
  });

  const refs = references || [];

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    setSubmitting(true);
    const success = await onAdd(formData);
    setSubmitting(false);
    
    if (success) {
      setDialogOpen(false);
      setFormData({
        name: '',
        company: '',
        phone: '',
        email: '',
        project_type: '',
        testimonial: ''
      });
    }
  };

  const handleRemove = async (index: number) => {
    if (confirm('Are you sure you want to remove this reference?')) {
      await onRemove(index);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client References
              </CardTitle>
              <CardDescription>Add references from satisfied customers</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Reference
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {refs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No references added yet</p>
              <p className="text-sm">Add references from happy customers to build trust</p>
            </div>
          ) : (
            <div className="space-y-4">
              {refs.map((ref, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{ref.name}</h4>
                        {ref.company && (
                          <span className="text-sm text-muted-foreground">• {ref.company}</span>
                        )}
                      </div>
                      {ref.project_type && (
                        <p className="text-sm text-primary">{ref.project_type}</p>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {ref.phone && <span>{ref.phone}</span>}
                        {ref.email && <span>{ref.email}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {ref.testimonial && (
                    <div className="mt-3 pl-4 border-l-2 border-primary/30">
                      <Quote className="h-4 w-4 text-primary/50 mb-1" />
                      <p className="text-sm italic text-muted-foreground">"{ref.testimonial}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Reference Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Client Reference</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="ABC Corp"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@email.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Project Type</Label>
              <Input
                value={formData.project_type || ''}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                placeholder="e.g., Roof Replacement, Kitchen Remodel"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Testimonial Quote</Label>
              <Textarea
                value={formData.testimonial || ''}
                onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                placeholder="What did they say about your work?"
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim() || submitting}>
              {submitting ? 'Adding...' : 'Add Reference'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
