import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, X, ImageIcon, VideoIcon } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "equipment-media";

async function signed(path: string): Promise<string> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? "";
}

export async function resolveMediaUrl(pathOrUrl: string | null | undefined): Promise<string> {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return signed(pathOrUrl);
}

interface Props {
  label: string;
  accept: "image" | "video";
  value: string | null;
  onChange: (path: string | null) => void;
  folder?: string;
}

export function MediaUploader({ label, accept, value, onChange, folder = "misc" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) resolveMediaUrl(value).then(setPreview);
    else setPreview("");
  }, [value]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      onChange(path);
      setPreview(await signed(path));
      toast.success(`${label} uploaded`);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { onChange(null); setPreview(""); }}
          >
            <X className="h-3 w-3 mr-1" /> Remove
          </Button>
        )}
      </div>

      {preview && accept === "image" && (
        <img src={preview} alt="" className="h-32 w-full object-cover rounded border" />
      )}
      {preview && accept === "video" && (
        <video src={preview} controls className="h-32 w-full object-cover rounded border" />
      )}
      {!preview && (
        <div className="h-32 w-full rounded border border-dashed flex items-center justify-center text-muted-foreground">
          {accept === "image" ? <ImageIcon className="h-6 w-6" /> : <VideoIcon className="h-6 w-6" />}
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept === "image" ? "image/*" : "video/mp4,video/webm,video/quicktime"}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1"
        >
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {uploading ? "Uploading…" : `Upload ${accept}`}
        </Button>
        <Input
          placeholder="or paste URL"
          defaultValue={value?.startsWith("http") ? value : ""}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== value) { onChange(v); setPreview(v); }
          }}
        />
      </div>
    </div>
  );
}

interface GalleryProps {
  value: string[];
  onChange: (paths: string[]) => void;
}

export function GalleryUploader({ value, onChange }: GalleryProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useState(() => {
    Promise.all(value.map(async (p) => [p, await resolveMediaUrl(p)] as const)).then((pairs) => {
      setUrls(Object.fromEntries(pairs));
    });
  });

  const addFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const newPaths: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("equipment-media").upload(path, file, {
          cacheControl: "3600", upsert: false, contentType: file.type,
        });
        if (error) throw error;
        newPaths.push(path);
        setUrls((u) => ({ ...u, [path]: "" }));
        resolveMediaUrl(path).then((url) => setUrls((u) => ({ ...u, [path]: url })));
      }
      onChange([...value, ...newPaths]);
      toast.success(`Added ${newPaths.length} image(s)`);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Gallery ({value.length})</label>
      <div className="grid grid-cols-4 gap-2">
        {value.map((p, i) => (
          <div key={p} className="relative group aspect-square rounded border overflow-hidden bg-muted">
            {urls[p] && <img src={urls[p]} alt="" className="w-full h-full object-cover" />}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded border border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />
    </div>
  );
}
