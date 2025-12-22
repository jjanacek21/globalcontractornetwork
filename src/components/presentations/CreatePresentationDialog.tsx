import { useState } from "react";
import { usePresentations } from "@/hooks/usePresentations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface CreatePresentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePresentationDialog({ open, onOpenChange }: CreatePresentationDialogProps) {
  const { createPresentation } = usePresentations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_template: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    setIsSubmitting(true);

    const presentation = await createPresentation({
      title: formData.title,
      description: formData.description || null,
      is_template: formData.is_template,
    });

    setIsSubmitting(false);

    if (presentation) {
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        is_template: false,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Presentation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Roofing Proposal - Smith Residence"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this presentation..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_template">Save as Template</Label>
              <p className="text-sm text-muted-foreground">
                Use this presentation as a starting point for others
              </p>
            </div>
            <Switch
              id="is_template"
              checked={formData.is_template}
              onCheckedChange={(checked) => setFormData({ ...formData, is_template: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? "Creating..." : "Create Presentation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
