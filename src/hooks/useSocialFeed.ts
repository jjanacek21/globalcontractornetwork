import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SocialPost {
  id: string;
  author_id: string;
  content_text: string;
  visibility: string;
  trade_tags: string[] | null;
  location_tags: string[] | null;
  reply_to_post_id: string | null;
  is_repost: boolean;
  original_post_id: string | null;
  like_count: number;
  comment_count: number;
  repost_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    company_name: string;
    first_name: string | null;
    last_name: string | null;
    logo_url: string | null;
    category: string;
  };
  media?: {
    id: string;
    media_url: string;
    media_type: string;
    thumbnail_url: string | null;
  }[];
  liked_by_me?: boolean;
}

export const useSocialFeed = (filter: 'all' | 'following' = 'all', tradeFilter?: string) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get current user's profile id
      const { data: profile } = await supabase
        .from("contractor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setProfileId(profile.id);
      }

      let query = supabase
        .from("social_posts")
        .select(`
          *,
          author:contractor_profiles!social_posts_author_id_fkey(
            id, company_name, first_name, last_name, logo_url, category
          ),
          media:social_post_media(id, media_url, media_type, thumbnail_url)
        `)
        .is("reply_to_post_id", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (tradeFilter && tradeFilter !== 'all') {
        query = query.contains("trade_tags", [tradeFilter]);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      // Get likes by current user
      if (profile && postsData) {
        const { data: likes } = await supabase
          .from("social_post_likes")
          .select("post_id")
          .eq("user_id", profile.id);

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);

        // If following filter, get followed users
        if (filter === 'following') {
          const { data: follows } = await supabase
            .from("social_follows")
            .select("following_id")
            .eq("follower_id", profile.id);

          const followedIds = new Set(follows?.map(f => f.following_id) || []);
          
          const filteredPosts = postsData.filter((post: any) => 
            followedIds.has(post.author_id)
          ).map((post: any) => ({
            ...post,
            liked_by_me: likedPostIds.has(post.id)
          }));

          setPosts(filteredPosts);
        } else {
          setPosts(postsData.map((post: any) => ({
            ...post,
            liked_by_me: likedPostIds.has(post.id)
          })));
        }
      } else {
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({ title: "Failed to load feed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filter, tradeFilter, toast]);

  const createPost = async (content: string, tradeTags?: string[], mediaFiles?: File[]) => {
    if (!profileId) {
      toast({ title: "Profile not found", variant: "destructive" });
      return false;
    }

    try {
      // Create post
      const { data: post, error } = await supabase
        .from("social_posts")
        .insert({
          author_id: profileId,
          content_text: content,
          trade_tags: tradeTags,
        })
        .select()
        .single();

      if (error) throw error;

      // Upload media files if any
      if (mediaFiles && mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${profileId}/${post.id}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("social-media")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("social-media")
            .getPublicUrl(fileName);

          await supabase.from("social_post_media").insert({
            post_id: post.id,
            media_url: publicUrl,
            media_type: file.type.startsWith('video') ? 'video' : 'image',
            file_name: file.name,
            file_size: file.size,
            sort_order: i,
          });
        }
      }

      toast({ title: "Post created!" });
      fetchPosts();
      return true;
    } catch (error) {
      console.error("Error creating post:", error);
      toast({ title: "Failed to create post", variant: "destructive" });
      return false;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("social_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
      toast({ title: "Post deleted" });
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Failed to delete post", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    profileId,
    createPost,
    deletePost,
    refetch: fetchPosts,
  };
};
