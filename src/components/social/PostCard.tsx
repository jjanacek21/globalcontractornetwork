import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, 
  Trash2, Flag 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { SocialPost } from "@/hooks/useSocialFeed";
import { useLikes } from "@/hooks/useLikes";
import { CommentSection } from "./CommentSection";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: SocialPost;
  profileId: string | null;
  onDelete?: (postId: string) => void;
}

export const PostCard = ({ post, profileId, onDelete }: PostCardProps) => {
  const [liked, setLiked] = useState(post.liked_by_me || false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const { toggleLike, loading: likeLoading } = useLikes();

  const handleLike = async () => {
    if (!profileId || likeLoading) return;
    const newLiked = await toggleLike(post.id, liked, profileId);
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
  };

  const isOwnPost = profileId === post.author_id;
  const authorName = post.author?.first_name && post.author?.last_name
    ? `${post.author.first_name} ${post.author.last_name}`
    : post.author?.company_name || "Unknown";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <Link 
            to={`/social/profile/${post.author_id}`}
            className="flex items-start gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.logo_url || undefined} />
              <AvatarFallback>
                {post.author?.company_name?.charAt(0) || "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{authorName}</span>
                {post.author?.category && (
                  <Badge variant="secondary" className="text-xs">
                    {post.author.category}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {post.author?.company_name}
                {" · "}
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost && onDelete && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
              {!isOwnPost && (
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="mt-3 space-y-3">
          <p className="whitespace-pre-wrap">{post.content_text}</p>

          {/* Trade Tags */}
          {post.trade_tags && post.trade_tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {post.trade_tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className={cn(
              "grid gap-2 rounded-lg overflow-hidden",
              post.media.length === 1 && "grid-cols-1",
              post.media.length === 2 && "grid-cols-2",
              post.media.length >= 3 && "grid-cols-2"
            )}>
              {post.media.map((media, index) => (
                <div 
                  key={media.id} 
                  className={cn(
                    "relative bg-muted",
                    post.media!.length === 3 && index === 0 && "row-span-2"
                  )}
                >
                  {media.media_type === 'video' ? (
                    <video 
                      src={media.media_url} 
                      controls 
                      className="w-full h-full object-cover max-h-96"
                    />
                  ) : (
                    <img 
                      src={media.media_url} 
                      alt="" 
                      className="w-full h-full object-cover max-h-96"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeLoading}
            className={cn(
              "gap-2",
              liked && "text-red-500 hover:text-red-600"
            )}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            {likeCount > 0 && likeCount}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            {post.comment_count > 0 && post.comment_count}
          </Button>

          <Button variant="ghost" size="sm" className="gap-2">
            <Repeat2 className="h-4 w-4" />
            {post.repost_count > 0 && post.repost_count}
          </Button>

          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments */}
        {showComments && profileId && (
          <CommentSection postId={post.id} profileId={profileId} />
        )}
      </CardContent>
    </Card>
  );
};
