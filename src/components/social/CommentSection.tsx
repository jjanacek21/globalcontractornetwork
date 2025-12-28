import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useComments, Comment } from "@/hooks/useComments";

interface CommentSectionProps {
  postId: string;
  profileId: string;
}

export const CommentSection = ({ postId, profileId }: CommentSectionProps) => {
  const { comments, loading, fetchComments, addComment, deleteComment } = useComments(postId);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    const success = await addComment(newComment.trim(), profileId);
    if (success) {
      setNewComment("");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1"
          maxLength={280}
        />
        <Button type="submit" size="icon" disabled={!newComment.trim() || submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isOwn={comment.author_id === profileId}
            onDelete={() => deleteComment(comment.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  isOwn: boolean;
  onDelete: () => void;
}

const CommentItem = ({ comment, isOwn, onDelete }: CommentItemProps) => {
  const authorName = comment.author?.first_name && comment.author?.last_name
    ? `${comment.author.first_name} ${comment.author.last_name}`
    : comment.author?.company_name || "Unknown";

  return (
    <div className="flex gap-2 group">
      <Link to={`/social/profile/${comment.author_id}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author?.logo_url || undefined} />
          <AvatarFallback className="text-xs">
            {comment.author?.company_name?.charAt(0) || "C"}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-lg px-3 py-2">
          <Link 
            to={`/social/profile/${comment.author_id}`}
            className="font-semibold text-sm hover:underline"
          >
            {authorName}
          </Link>
          <p className="text-sm mt-0.5">{comment.content_text}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
          {isOwn && (
            <button 
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
