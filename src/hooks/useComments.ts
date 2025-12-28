import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content_text: string;
  reply_to_comment_id: string | null;
  like_count: number;
  created_at: string;
  author?: {
    id: string;
    company_name: string;
    first_name: string | null;
    last_name: string | null;
    logo_url: string | null;
  };
}

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("social_post_comments")
        .select(`
          *,
          author:contractor_profiles!social_post_comments_author_id_fkey(
            id, company_name, first_name, last_name, logo_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = async (content: string, profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("social_post_comments")
        .insert({
          post_id: postId,
          author_id: profileId,
          content_text: content,
        })
        .select(`
          *,
          author:contractor_profiles!social_post_comments_author_id_fkey(
            id, company_name, first_name, last_name, logo_url
          )
        `)
        .single();

      if (error) throw error;

      // Notify post author
      const { data: post } = await supabase
        .from("social_posts")
        .select("author_id")
        .eq("id", postId)
        .single();

      if (post && post.author_id !== profileId) {
        await supabase.from("social_notifications").insert({
          user_id: post.author_id,
          type: "post_comment",
          data: { post_id: postId, comment_id: data.id, commenter_id: profileId },
        });
      }

      setComments([...comments, data]);
      toast({ title: "Comment added" });
      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({ title: "Failed to add comment", variant: "destructive" });
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("social_post_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      setComments(comments.filter(c => c.id !== commentId));
      toast({ title: "Comment deleted" });
      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({ title: "Failed to delete comment", variant: "destructive" });
      return false;
    }
  };

  return {
    comments,
    loading,
    fetchComments,
    addComment,
    deleteComment,
  };
};
