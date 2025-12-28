import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useLikes = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleLike = async (postId: string, currentlyLiked: boolean, profileId: string) => {
    setLoading(true);
    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from("social_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", profileId);

        if (error) throw error;
        return false; // Now unliked
      } else {
        const { error } = await supabase
          .from("social_post_likes")
          .insert({
            post_id: postId,
            user_id: profileId,
          });

        if (error) throw error;

        // Get post author for notification
        const { data: post } = await supabase
          .from("social_posts")
          .select("author_id")
          .eq("id", postId)
          .single();

        if (post && post.author_id !== profileId) {
          await supabase.from("social_notifications").insert({
            user_id: post.author_id,
            type: "post_like",
            data: { post_id: postId, liker_id: profileId },
          });
        }

        return true; // Now liked
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({ title: "Action failed", variant: "destructive" });
      return currentlyLiked;
    } finally {
      setLoading(false);
    }
  };

  return { toggleLike, loading };
};
