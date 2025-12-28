import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFollow = (targetProfileId?: string) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFollowStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("contractor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setCurrentProfileId(profile.id);

        if (targetProfileId && targetProfileId !== profile.id) {
          // Check if following this profile
          const { data: follow } = await supabase
            .from("social_follows")
            .select("id")
            .eq("follower_id", profile.id)
            .eq("following_id", targetProfileId)
            .maybeSingle();

          setIsFollowing(!!follow);
        }
      }

      // Get follower/following counts for target profile
      if (targetProfileId) {
        const { count: followers } = await supabase
          .from("social_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", targetProfileId);

        const { count: following } = await supabase
          .from("social_follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", targetProfileId);

        setFollowerCount(followers || 0);
        setFollowingCount(following || 0);
      }
    } catch (error) {
      console.error("Error fetching follow status:", error);
    } finally {
      setLoading(false);
    }
  }, [targetProfileId]);

  const toggleFollow = async () => {
    if (!currentProfileId || !targetProfileId) return false;
    if (currentProfileId === targetProfileId) {
      toast({ title: "You can't follow yourself", variant: "destructive" });
      return false;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("social_follows")
          .delete()
          .eq("follower_id", currentProfileId)
          .eq("following_id", targetProfileId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast({ title: "Unfollowed" });
      } else {
        const { error } = await supabase
          .from("social_follows")
          .insert({
            follower_id: currentProfileId,
            following_id: targetProfileId,
          });

        if (error) throw error;

        // Create notification
        await supabase.from("social_notifications").insert({
          user_id: targetProfileId,
          type: "new_follower",
          data: { follower_id: currentProfileId },
        });

        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast({ title: "Following!" });
      }
      return true;
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({ title: "Action failed", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    fetchFollowStatus();
  }, [fetchFollowStatus]);

  return {
    isFollowing,
    followerCount,
    followingCount,
    loading,
    currentProfileId,
    toggleFollow,
    refetch: fetchFollowStatus,
  };
};
