import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Video, FileText, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSocialProfile } from "@/hooks/useSocialProfile";

const TRADE_OPTIONS = [
  "Roofing", "General Contractor", "HVAC", "Plumbing", "Electrical",
  "Flooring", "Painting", "Landscaping", "Windows & Doors", "Concrete",
  "Drywall", "Mold Remediation", "Water Damage", "Fire Damage", "Engineering"
];

interface CreatePostFormProps {
  onSubmit: (content: string, tradeTags?: string[], mediaFiles?: File[]) => Promise<boolean>;
}

export const CreatePostForm = ({ onSubmit }: CreatePostFormProps) => {
  const [content, setContent] = useState("");
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useSocialProfile();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 4) {
      alert("Maximum 4 files allowed");
      return;
    }

    const newFiles = files.slice(0, 4 - mediaFiles.length);
    setMediaFiles([...mediaFiles, ...newFiles]);

    // Create previews
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        setMediaPreviews(prev => [...prev, 'file']);
      }
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  const toggleTrade = (trade: string) => {
    if (selectedTrades.includes(trade)) {
      setSelectedTrades(selectedTrades.filter(t => t !== trade));
    } else if (selectedTrades.length < 3) {
      setSelectedTrades([...selectedTrades, trade]);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmit(
      content.trim(), 
      selectedTrades.length > 0 ? selectedTrades : undefined,
      mediaFiles.length > 0 ? mediaFiles : undefined
    );

    if (success) {
      setContent("");
      setSelectedTrades([]);
      setMediaFiles([]);
      setMediaPreviews([]);
      setShowTrades(false);
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.logo_url || undefined} />
            <AvatarFallback>
              {profile?.company_name?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="What's happening in your trade?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-24 resize-none border-0 p-0 focus-visible:ring-0 text-base"
              maxLength={500}
            />

            {/* Media Previews */}
            {mediaPreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    {preview === 'file' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ) : (
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Trade Tags */}
            {showTrades && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">Select up to 3 trades (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {TRADE_OPTIONS.map((trade) => (
                    <Badge
                      key={trade}
                      variant={selectedTrades.includes(trade) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTrade(trade)}
                    >
                      {trade}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaFiles.length >= 4}
                >
                  <Image className="h-4 w-4 mr-1" />
                  Photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTrades(!showTrades)}
                >
                  <Badge variant="outline" className="text-xs">
                    {selectedTrades.length > 0 ? `${selectedTrades.length} trades` : "+ Trade Tag"}
                  </Badge>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {content.length}/500
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isSubmitting}
                  size="sm"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
