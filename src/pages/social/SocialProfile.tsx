import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SocialLayout } from "@/components/social/SocialLayout";
import { SocialAccessGuard } from "@/components/social/SocialAccessGuard";
import { FollowButton } from "@/components/social/FollowButton";
import { PostCard } from "@/components/social/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useFollow } from "@/hooks/useFollow";
import { useSocialProfile, SocialProfile } from "@/hooks/useSocialProfile";
import { 
  MapPin, Link as LinkIcon, Phone, Mail, Calendar, 
  MessageCircle, Loader2, Edit 
} from "lucide-react";
import { format } from "date-fns";

const SocialProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile: myProfile } = useSocialProfile();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { followerCount, followingCount } = useFollow(id);

  const isOwnProfile = myProfile?.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      const { data: profileData } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as SocialProfile);

        const { data: postsData } = await supabase
          .from("social_posts")
          .select(`
            *,
            author:contractor_profiles!social_posts_author_id_fkey(
              id, company_name, first_name, last_name, logo_url, category
            ),
            media:social_post_media(id, media_url, media_type, thumbnail_url)
          `)
          .eq("author_id", id)
          .is("reply_to_post_id", null)
          .order("created_at", { ascending: false });

        setPosts(postsData || []);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <SocialAccessGuard>
        <SocialLayout>
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SocialLayout>
      </SocialAccessGuard>
    );
  }

  if (!profile) {
    return (
      <SocialAccessGuard>
        <SocialLayout>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        </SocialLayout>
      </SocialAccessGuard>
    );
  }

  const displayName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.company_name;

  return (
    <SocialAccessGuard>
      <SocialLayout>
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20 rounded-t-lg" />
            <CardContent className="relative pt-0 pb-6">
              <Avatar className="absolute -top-12 left-6 h-24 w-24 border-4 border-background">
                <AvatarImage src={profile.logo_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.company_name?.charAt(0) || "C"}
                </AvatarFallback>
              </Avatar>

              <div className="pt-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  <p className="text-muted-foreground">{profile.company_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{profile.category}</Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button onClick={() => navigate("/social/profile/edit")}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <FollowButton targetProfileId={profile.id} />
                      <Button variant="outline" size="icon">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4 text-sm">
                <div><strong>{followerCount}</strong> followers</div>
                <div><strong>{followingCount}</strong> following</div>
                <div><strong>{posts.length}</strong> posts</div>
              </div>

              {/* Bio */}
              {profile.bio_short && (
                <p className="mt-4">{profile.bio_short}</p>
              )}

              {/* Info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                {profile.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Website
                    </a>
                  </div>
                )}
                {profile.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {format(new Date(profile.created_at), "MMM yyyy")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Posts */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Posts</h2>
            {posts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No posts yet</p>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} post={post} profileId={myProfile?.id || null} />
              ))
            )}
          </div>
        </div>
      </SocialLayout>
    </SocialAccessGuard>
  );
};

export default SocialProfilePage;
