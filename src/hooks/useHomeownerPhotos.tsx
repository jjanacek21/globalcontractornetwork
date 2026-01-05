import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HomeownerPhoto {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string | null;
  description: string | null;
  category: string | null;
  created_at: string;
}

export function useHomeownerPhotos(userId: string | null) {
  const [photos, setPhotos] = useState<HomeownerPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchPhotos = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('homeowner_photos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File, category: string = 'general', description?: string) => {
    if (!userId) return null;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('homeowner-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('homeowner-uploads')
        .getPublicUrl(fileName);

      const { data, error: dbError } = await supabase
        .from('homeowner_photos')
        .insert({
          user_id: userId,
          file_url: publicUrl,
          file_name: file.name,
          category,
          description
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setPhotos(prev => [data, ...prev]);
      toast.success('Photo uploaded successfully');
      return data;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/homeowner-uploads/');
      if (urlParts[1]) {
        await supabase.storage
          .from('homeowner-uploads')
          .remove([urlParts[1]]);
      }

      const { error } = await supabase
        .from('homeowner_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success('Photo deleted');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [userId]);

  return { photos, loading, uploading, uploadPhoto, deletePhoto, refetch: fetchPhotos };
}
