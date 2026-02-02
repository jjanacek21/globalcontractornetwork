import { useState } from "react";
import { SocialLayout } from "@/components/social/SocialLayout";
import { SocialAccessGuard } from "@/components/social/SocialAccessGuard";
import { CreatePostForm } from "@/components/social/CreatePostForm";
import { PostCard } from "@/components/social/PostCard";
import { useSocialFeed } from "@/hooks/useSocialFeed";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const TRADE_OPTIONS = [
  "all", "Roofing", "General Contractor", "HVAC", "Plumbing", "Electrical",
  "Flooring", "Painting", "Landscaping", "Windows & Doors", "Engineering"
];

const SocialFeed = () => {
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const [tradeFilter, setTradeFilter] = useState('all');
  const { posts, loading, profileId, createPost, deletePost, refetch } = useSocialFeed(filter, tradeFilter);

  return (
    <SocialAccessGuard>
      <SocialLayout>
        <div className="space-y-6">
          <CreatePostForm onSubmit={createPost} />

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'following')}>
              <TabsList>
                <TabsTrigger value="all">All Contractors</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={tradeFilter} onValueChange={setTradeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by trade" />
              </SelectTrigger>
              <SelectContent>
                {TRADE_OPTIONS.map((trade) => (
                  <SelectItem key={trade} value={trade}>
                    {trade === 'all' ? 'All Trades' : trade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  profileId={profileId}
                  onDelete={deletePost}
                />
              ))}
            </div>
          )}
        </div>
      </SocialLayout>
    </SocialAccessGuard>
  );
};

export default SocialFeed;
