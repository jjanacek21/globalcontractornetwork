import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Upload, X, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PhotoAnalysis = {
  scope_summary?: string;
  condition?: string;
  severity?: string;
  observations?: string[];
  suggested_measurements?: {
    sqft?: number;
    linear_feet?: number;
    count?: number;
    rooms?: number;
    stories?: number;
  };
  confidence?: number;
};

interface Props {
  tradeSlug: string;
  photos: { url: string; path: string }[];
  onPhotosChange: (p: { url: string; path: string }[]) => void;
  onAnalyzed: (a: PhotoAnalysis) => void;
}

export function PhotoQuotePanel({ tradeSlug, photos, onPhotosChange, onAnalyzed }: Props) {
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "anon";
    const path = `${userId}/${tradeSlug}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("quote-photos").upload(path, file);
    if (error) {
      toast.error("Photo upload failed");
      return;
    }
    const { data: signed } = await supabase.storage.from("quote-photos").createSignedUrl(path, 3600);
    if (signed?.signedUrl) onPhotosChange([...photos, { url: signed.signedUrl, path }]);
  };

  const analyze = async () => {
    if (photos.length === 0) {
      toast.error("Upload at least one photo");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("iq-photo-quote", {
        body: { trade_slug: tradeSlug, photo_urls: photos.map((p) => p.url) },
      });
      if (error) throw error;
      if (!data) throw new Error("Empty response");
      onAnalyzed(data as PhotoAnalysis);
      toast.success("AI scope drafted from your photos");
    } catch (e: any) {
      toast.error(e?.message || "Photo analysis failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="rounded-xl bg-gradient-to-br from-primary/10 via-emerald-500/5 to-amber-300/10 p-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Quote from photos</h3>
            <p className="text-sm text-muted-foreground">
              Upload up to 6 pictures. Our AI will analyze materials, condition, and visible
              damage, then draft a scope and pricing automatically.
            </p>
          </div>
        </div>
      </div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
        <Camera className="h-10 w-10 text-muted-foreground mb-2" />
        <span className="text-sm font-medium">Tap to add photos</span>
        <span className="text-xs text-muted-foreground mt-1">JPG / PNG · up to 6 photos</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => Array.from(e.target.files || []).slice(0, 6 - photos.length).forEach(upload)}
        />
      </label>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <motion.div
              key={p.path}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-border"
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => onPhotosChange(photos.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 bg-background/90 rounded-full p-1 shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <Button onClick={analyze} disabled={busy || photos.length === 0} className="w-full h-12 text-base gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? "Analyzing photos..." : "Analyze with AI"}
      </Button>
    </motion.div>
  );
}
