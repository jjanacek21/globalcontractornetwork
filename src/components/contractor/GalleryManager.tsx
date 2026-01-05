import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { GalleryImage } from '@/hooks/useContractorProfile';

interface GalleryManagerProps {
  gallery: GalleryImage[] | null;
  onAdd: (file: File, caption?: string, projectType?: string) => Promise<boolean>;
  onRemove: (index: number) => Promise<boolean>;
}

export function GalleryManager({ gallery, onAdd, onRemove }: GalleryManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [projectType, setProjectType] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const images = gallery || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAddDialogOpen(true);
    }
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    const success = await onAdd(selectedFile, caption || undefined, projectType || undefined);
    setUploading(false);
    
    if (success) {
      setAddDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setProjectType('');
    }
  };

  const handleRemove = async (index: number) => {
    if (confirm('Are you sure you want to remove this image?')) {
      await onRemove(index);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Project Gallery
          </CardTitle>
          <CardDescription>Showcase your best work with project photos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {images.length === 0 ? (
            <div 
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No photos yet</p>
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.caption || `Project ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      {image.caption && (
                        <p className="text-white text-xs truncate">{image.caption}</p>
                      )}
                      {image.project_type && (
                        <p className="text-white/70 text-xs">{image.project_type}</p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => handleRemove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Add More Button */}
              <div 
                className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-2">Add Photo</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Photo Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project Photo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewUrl && (
              <div className="aspect-video rounded-lg overflow-hidden">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Caption (Optional)</Label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g., Before & After Roof Coating"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Project Type (Optional)</Label>
              <Input
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder="e.g., Roof Replacement, Kitchen Remodel"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Add Photo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
