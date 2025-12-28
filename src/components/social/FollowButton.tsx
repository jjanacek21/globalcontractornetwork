import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetProfileId: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

export const FollowButton = ({ 
  targetProfileId, 
  variant = "default",
  size = "default" 
}: FollowButtonProps) => {
  const { isFollowing, loading, currentProfileId, toggleFollow } = useFollow(targetProfileId);

  // Don't show button if viewing own profile
  if (currentProfileId === targetProfileId) {
    return null;
  }

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={toggleFollow}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};
