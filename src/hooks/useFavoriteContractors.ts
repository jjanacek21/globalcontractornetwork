import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FavoriteContractor {
  id: string;
  user_id: string;
  contractor_id: string;
  notes: string | null;
  created_at: string;
  contractor?: {
    id: string;
    company_name: string;
    category: string;
    logo_url: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    average_rating: number | null;
    is_verified: boolean | null;
    description: string | null;
  };
}

export function useFavoriteContractors(userId: string | null) {
  const [favorites, setFavorites] = useState<FavoriteContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('favorite_contractors')
        .select(`
          *,
          contractor:contractor_profiles(
            id, company_name, category, logo_url, phone, email, 
            website, average_rating, is_verified, description
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedFavorites = (data || []).map(fav => ({
        ...fav,
        contractor: fav.contractor as FavoriteContractor['contractor']
      }));
      
      setFavorites(typedFavorites);
      setFavoriteIds(new Set(typedFavorites.map(f => f.contractor_id)));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (contractorId: string) => {
    if (!userId) {
      toast.error('Please sign in to save contractors');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('favorite_contractors')
        .insert({
          user_id: userId,
          contractor_id: contractorId
        });

      if (error) throw error;
      
      setFavoriteIds(prev => new Set([...prev, contractorId]));
      toast.success('Contractor saved to favorites');
      await fetchFavorites();
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        toast.info('Contractor already in favorites');
      } else {
        console.error('Error adding favorite:', error);
        toast.error('Failed to save contractor');
      }
      return false;
    }
  };

  const removeFavorite = async (contractorId: string) => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('favorite_contractors')
        .delete()
        .eq('user_id', userId)
        .eq('contractor_id', contractorId);

      if (error) throw error;
      
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(contractorId);
        return newSet;
      });
      setFavorites(prev => prev.filter(f => f.contractor_id !== contractorId));
      toast.success('Contractor removed from favorites');
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove contractor');
      return false;
    }
  };

  const isFavorite = (contractorId: string) => favoriteIds.has(contractorId);

  const toggleFavorite = async (contractorId: string) => {
    if (isFavorite(contractorId)) {
      return removeFavorite(contractorId);
    } else {
      return addFavorite(contractorId);
    }
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites
  };
}
