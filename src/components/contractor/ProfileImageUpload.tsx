import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Building2, Image } from 'lucide-react';

interface ProfileImageUploadProps {
  type: 'logo' | 'banner';
  currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
}

export function ProfileImageUpload({
  type,
  currentUrl,
  onUpload
}: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await onUpload(file);
    setUploading(false);
    e.target.value = '';
  };

  if (type === 'banner') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="h-5 w-5" />
            Banner Image
          </CardTitle>
          <CardDescription>Displayed at the top of your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <div 
            className="relative w-full h-32 rounded-lg bg-muted overflow-hidden cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {currentUrl ? (
              <img src={currentUrl} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/10">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="secondary" size="sm" disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Change Banner'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Logo
        </CardTitle>
        <CardDescription>Your business profile picture</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={currentUrl || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              <Building2 className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
