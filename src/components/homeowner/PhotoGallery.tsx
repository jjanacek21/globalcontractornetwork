import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { HomeownerPhoto } from '@/hooks/useHomeownerPhotos';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PhotoGalleryProps {
  photos: HomeownerPhoto[];
  loading: boolean;
  uploading: boolean;
  onUpload: (file: File, category: string) => void;
  onDelete: (photoId: string, fileUrl: string) => void;
}

const CATEGORIES = [
  { value: 'property', label: 'Property' },
  { value: 'damage', label: 'Damage' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'general', label: 'General' }
];

export function PhotoGallery({ photos, loading, uploading, onUpload, onDelete }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [lightboxPhoto, setLightboxPhoto] = useState<HomeownerPhoto | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, selectedCategory);
      e.target.value = '';
    }
  };

  const filteredPhotos = filterCategory === 'all' 
    ? photos 
    : photos.filter(p => p.category === filterCategory);

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'damage': return 'bg-red-500/10 text-red-600';
      case 'before': return 'bg-blue-500/10 text-blue-600';
      case 'after': return 'bg-green-500/10 text-green-600';
      case 'property': return 'bg-purple-500/10 text-purple-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            My Photos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Section */}
          <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed bg-muted/30">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </div>

          {/* Photo Grid */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading photos...</div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No photos yet</p>
              <p className="text-sm">Upload photos of your property or projects</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredPhotos.map(photo => (
                <div 
                  key={photo.id} 
                  className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setLightboxPhoto(photo)}
                >
                  <img
                    src={photo.file_url}
                    alt={photo.file_name || 'Photo'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs ${getCategoryColor(photo.category)}`}>
                    {photo.category || 'general'}
                  </span>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(photo.id, photo.file_url);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
        <DialogContent className="max-w-4xl p-0">
          {lightboxPhoto && (
            <div className="relative">
              <img
                src={lightboxPhoto.file_url}
                alt={lightboxPhoto.file_name || 'Photo'}
                className="w-full max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(lightboxPhoto.category)}`}>
                  {lightboxPhoto.category || 'general'}
                </span>
                {lightboxPhoto.file_name && (
                  <p className="text-white/80 text-sm mt-2">{lightboxPhoto.file_name}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
