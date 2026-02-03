import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Video, Target, Clock, Home, Users, Zap, TrendingUp } from "lucide-react";

interface FeedPost {
  id: string;
  session_id: string;
  user_id: string;
  video_url: string | null;
  video_type: 'goal' | 'progress' | 'roof' | 'homeowner';
  content: string | null;
  points_earned: number;
  doors_knocked: number;
  leads_gotten: number;
  goals_doors: number | null;
  goals_leads: number | null;
  created_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
  };
  reactions: { reaction_type: string; count: number }[];
  userReaction?: string;
}

interface SessionFeedProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const REACTION_TYPES = ['👏', '🔥', '💪', '🎯', '⭐', '🚀'] as const;

const VIDEO_TYPE_CONFIG = {
  goal: { icon: Target, label: 'Goals Set', color: 'bg-blue-500' },
  progress: { icon: Clock, label: 'Check-in', color: 'bg-primary' },
  roof: { icon: Home, label: 'On Roof', color: 'bg-amber-500' },
  homeowner: { icon: Users, label: 'With Homeowner', color: 'bg-green-500' }
};

export function SessionFeed({ userId, isOpen, onClose }: SessionFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPosts();
      subscribeToFeed();
    }
  }, [isOpen]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch posts
      const { data: postsData, error } = await supabase
        .from('session_feed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles for all users
      const userIds = [...new Set((postsData || []).map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const profilesMap = new Map<string, { id: string; first_name: string | null; last_name: string | null }>(
        (profilesData || []).map(p => [p.id, p])
      );

      // Fetch reactions for each post
      const postsWithReactions = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: reactions } = await supabase
            .from('session_feed_reactions')
            .select('reaction_type, user_id')
            .eq('post_id', post.id);

          // Count reactions by type
          const reactionCounts = REACTION_TYPES.map(type => ({
            reaction_type: type,
            count: (reactions || []).filter(r => r.reaction_type === type).length
          })).filter(r => r.count > 0);

          // Check if current user reacted
          let userReaction: string | undefined;
          if (userId) {
            const userReact = (reactions || []).find(r => r.user_id === userId);
            userReaction = userReact?.reaction_type;
          }

          const profile = profilesMap.get(post.user_id);

          return {
            ...post,
            video_type: post.video_type as 'goal' | 'progress' | 'roof' | 'homeowner',
            profile: profile ? {
              first_name: profile.first_name,
              last_name: profile.last_name
            } : undefined,
            reactions: reactionCounts,
            userReaction
          } as FeedPost;
        })
      );

      setPosts(postsWithReactions);
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToFeed = () => {
    const channel = supabase
      .channel('session_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_feed_posts' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_feed_reactions' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!userId) return;

    const post = posts.find(p => p.id === postId);
    const hasReacted = post?.userReaction === reactionType;

    if (hasReacted) {
      // Remove reaction
      await supabase
        .from('session_feed_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType);
    } else {
      // Add reaction (upsert)
      await supabase
        .from('session_feed_reactions')
        .upsert({
          post_id: postId,
          user_id: userId,
          reaction_type: reactionType
        }, { 
          onConflict: 'post_id,user_id,reaction_type' 
        });
    }

    fetchPosts();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container max-w-lg mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Live Session Feed</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Feed */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No session updates yet</p>
              <p className="text-sm">Start a session to see activity!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const config = VIDEO_TYPE_CONFIG[post.video_type] || VIDEO_TYPE_CONFIG.progress;
                const Icon = config.icon;
                const doorsProgress = post.goals_doors ? (post.doors_knocked / post.goals_doors) * 100 : 0;
                const leadsProgress = post.goals_leads ? (post.leads_gotten / post.goals_leads) * 100 : 0;

                return (
                  <div 
                    key={post.id} 
                    className="bg-card rounded-xl border p-4 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {post.profile?.first_name?.[0] || 'U'}
                          {post.profile?.last_name?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {post.profile?.first_name || 'User'} {post.profile?.last_name || ''}
                          </p>
                          <Badge variant="secondary" className={`${config.color} text-white text-xs`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded-full">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-amber-500">{post.points_earned}</span>
                      </div>
                    </div>

                    {/* Content */}
                    {post.content && (
                      <p className="text-sm">{post.content}</p>
                    )}

                    {/* Video */}
                    {post.video_url && (
                      <div 
                        className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setActiveVideoId(activeVideoId === post.id ? null : post.id)}
                      >
                        {activeVideoId === post.id ? (
                          <video
                            src={post.video_url}
                            className="w-full h-full object-cover"
                            controls
                            autoPlay
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                              <Video className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progress Bars */}
                    {post.goals_doors && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Doors</span>
                          <span className="font-medium">{post.doors_knocked} / {post.goals_doors}</span>
                        </div>
                        <Progress value={Math.min(doorsProgress, 100)} className="h-2" />
                        
                        {post.goals_leads && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Leads</span>
                              <span className="font-medium">{post.leads_gotten} / {post.goals_leads}</span>
                            </div>
                            <Progress value={Math.min(leadsProgress, 100)} className="h-2 [&>div]:bg-green-500" />
                          </>
                        )}
                      </div>
                    )}

                    {/* Reactions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <div className="flex gap-1">
                        {REACTION_TYPES.map((emoji) => {
                          const reaction = post.reactions.find(r => r.reaction_type === emoji);
                          const isSelected = post.userReaction === emoji;
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(post.id, emoji)}
                              className={`px-2 py-1 rounded-full text-sm transition-all hover:scale-110 ${
                                isSelected 
                                  ? 'bg-primary/20 ring-2 ring-primary' 
                                  : reaction?.count ? 'bg-muted' : 'hover:bg-muted'
                              }`}
                            >
                              {emoji}
                              {reaction?.count ? (
                                <span className="ml-1 text-xs">{reaction.count}</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
