import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import type { Resource, ResourceCategory } from "@/hooks/useResources";
import type { ResourceFormData } from "@/hooks/useAdminResources";

interface ResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit" | "view";
  resource?: Resource | null;
  categories: ResourceCategory[];
  onSubmit: (data: ResourceFormData) => Promise<boolean>;
}

const RESOURCE_TYPES = [
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "guide", label: "Guide" },
  { value: "checklist", label: "Checklist" },
  { value: "tool", label: "Tool" },
];

const AUDIENCE_OPTIONS = [
  { value: "contractor", label: "Contractor" },
  { value: "homeowner", label: "Homeowner" },
  { value: "both", label: "Both" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const ResourceDialog = ({ open, onOpenChange, mode, resource, categories, onSubmit }: ResourceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ResourceFormData>({
    title: "",
    category_id: "",
    resource_type: "article",
    target_audience: "contractor",
    description: "",
    content: "",
    video_url: "",
    external_links: [],
    thumbnail_url: "",
    tags: [],
    state_specific: [],
    is_premium: false,
    is_published: true,
  });
  const [newTag, setNewTag] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  useEffect(() => {
    if (resource && (mode === "edit" || mode === "view")) {
      setFormData({
        title: resource.title,
        category_id: resource.category_id || "",
        resource_type: resource.resource_type,
        target_audience: resource.target_audience,
        description: resource.description || "",
        content: resource.content || "",
        video_url: resource.video_url || "",
        external_links: resource.external_links || [],
        thumbnail_url: resource.thumbnail_url || "",
        tags: resource.tags || [],
        state_specific: resource.state_specific || [],
        is_premium: resource.is_premium,
        is_published: resource.is_published,
      });
    } else if (mode === "create") {
      setFormData({
        title: "",
        category_id: "",
        resource_type: "article",
        target_audience: "contractor",
        description: "",
        content: "",
        video_url: "",
        external_links: [],
        thumbnail_url: "",
        tags: [],
        state_specific: [],
        is_premium: false,
        is_published: true,
      });
    }
  }, [resource, mode, open]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.category_id) {
      return;
    }
    setLoading(true);
    const success = await onSubmit(formData);
    setLoading(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const addLink = () => {
    if (newLinkTitle.trim() && newLinkUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        external_links: [...prev.external_links, { title: newLinkTitle.trim(), url: newLinkUrl.trim() }]
      }));
      setNewLinkTitle("");
      setNewLinkUrl("");
    }
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      external_links: prev.external_links.filter((_, i) => i !== index)
    }));
  };

  const toggleState = (state: string) => {
    setFormData(prev => ({
      ...prev,
      state_specific: prev.state_specific.includes(state)
        ? prev.state_specific.filter(s => s !== state)
        : [...prev.state_specific, state]
    }));
  };

  const isViewMode = mode === "view";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Resource" : mode === "edit" ? "Edit Resource" : "View Resource"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={isViewMode}
              placeholder="Enter resource title"
            />
          </div>

          {/* Category and Type Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Resource Type</Label>
              <Select
                value={formData.resource_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, resource_type: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Audience */}
          <div className="grid gap-2">
            <Label>Target Audience</Label>
            <Select
              value={formData.target_audience}
              onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value }))}
              disabled={isViewMode}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isViewMode}
              placeholder="Short description of the resource"
              rows={2}
            />
          </div>

          {/* Content */}
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              disabled={isViewMode}
              placeholder="Full content (supports markdown)"
              rows={6}
            />
          </div>

          {/* Video URL (conditional) */}
          {formData.resource_type === "video" && (
            <div className="grid gap-2">
              <Label htmlFor="video_url">Video URL</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                disabled={isViewMode}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}

          {/* Thumbnail URL */}
          <div className="grid gap-2">
            <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
            <Input
              id="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
              disabled={isViewMode}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  {!isViewMode && (
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  )}
                </Badge>
              ))}
            </div>
            {!isViewMode && (
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* External Links */}
          <div className="grid gap-2">
            <Label>External Links</Label>
            <div className="space-y-2 mb-2">
              {formData.external_links.map((link, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded">
                  <span className="flex-1 text-sm">{link.title}: {link.url}</span>
                  {!isViewMode && (
                    <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeLink(index)} />
                  )}
                </div>
              ))}
            </div>
            {!isViewMode && (
              <div className="flex gap-2">
                <Input
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Link title"
                  className="flex-1"
                />
                <Input
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="URL"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={addLink}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* State Specific */}
          <div className="grid gap-2">
            <Label>State Specific (optional)</Label>
            <div className="flex flex-wrap gap-1">
              {US_STATES.map((state) => (
                <Badge
                  key={state}
                  variant={formData.state_specific.includes(state) ? "default" : "outline"}
                  className={`cursor-pointer ${isViewMode ? 'cursor-default' : ''}`}
                  onClick={() => !isViewMode && toggleState(state)}
                >
                  {state}
                </Badge>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_premium"
                checked={formData.is_premium}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_premium: checked as boolean }))}
                disabled={isViewMode}
              />
              <Label htmlFor="is_premium" className="cursor-pointer">Premium Content</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked as boolean }))}
                disabled={isViewMode}
              />
              <Label htmlFor="is_published" className="cursor-pointer">Published</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSubmit} disabled={loading || !formData.title || !formData.category_id}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "create" ? "Create Resource" : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceDialog;
