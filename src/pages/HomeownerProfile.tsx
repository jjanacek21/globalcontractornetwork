import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LogOut, MessageSquare, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProfileHeader } from '@/components/homeowner/ProfileHeader';
import { HomeownerNotes } from '@/components/homeowner/HomeownerNotes';
import { PhotoGallery } from '@/components/homeowner/PhotoGallery';
import { SubmissionsList } from '@/components/homeowner/SubmissionsList';
import { ContractorFinder } from '@/components/homeowner/ContractorFinder';
import { FavoriteContractorsList } from '@/components/homeowner/FavoriteContractorsList';
import { ReferralInvitationsSection } from '@/components/homeowner/ReferralInvitationsSection';
import { PendingReviewsCard } from '@/components/homeowner/PendingReviewsCard';
import { LeaveReviewDialog } from '@/components/homeowner/LeaveReviewDialog';
import { useHomeownerPhotos } from '@/hooks/useHomeownerPhotos';
import { useHomeownerSubmissions } from '@/hooks/useHomeownerSubmissions';
import { useFavoriteContractors } from '@/hooks/useFavoriteContractors';
import { useHomeownerReferralInvitations } from '@/hooks/useHomeownerReferralInvitations';
import { useHomeownerReviews, ReviewableProject } from '@/hooks/useHomeownerReviews';
import { useHomeownerMessages } from '@/hooks/useHomeownerMessages';
import gcnLogo from '@/assets/gcn-logo.jpg';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export default function HomeownerProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ReviewableProject | null>(null);

  const { photos, loading: photosLoading, uploading, uploadPhoto, deletePhoto } = useHomeownerPhotos(userId);
  const { submissions, loading: submissionsLoading } = useHomeownerSubmissions(userId, profile?.email || null);
  const { favorites, loading: favoritesLoading, removeFavorite } = useFavoriteContractors(userId);
  const { invitations, pendingCount, loading: invitationsLoading, acceptInvitation, declineInvitation } = useHomeownerReferralInvitations(userId, profile?.email || null);
  const { reviewableProjects, submittedReviews, loading: reviewsLoading, submitReview, submitting } = useHomeownerReviews(userId);
  const { totalUnread } = useHomeownerMessages(userId);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const fullName = profileData.first_name && profileData.last_name 
        ? `${profileData.first_name} ${profileData.last_name}`
        : profileData.first_name || profileData.last_name || null;

      setProfile({
        id: profileData.id,
        full_name: fullName,
        email: user.email || null,
        phone: profileData.phone || null,
        address: null,
        city: null,
        state: null,
        zip_code: null,
        created_at: profileData.created_at,
        first_name: profileData.first_name,
        last_name: profileData.last_name
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleMessageContractor = (contractorId: string) => {
    navigate(`/homeowner-messages?contractor=${contractorId}`);
  };

  const handleLeaveReview = (project: ReviewableProject) => {
    setSelectedProject(project);
    setReviewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || !userId) {
    return null;
  }

  const reviewerName = profile.full_name || profile.email || 'Anonymous';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/homeowner-dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={gcnLogo} alt="GCN" className="h-10 w-auto" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-white">My Profile</h1>
                <p className="text-sm text-white/60">Manage your information & find contractors</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Messages button with badge */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/homeowner-messages')}
                className="text-white hover:bg-white/10 relative"
              >
                <MessageSquare className="h-5 w-5" />
                {totalUnread > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {totalUnread}
                  </Badge>
                )}
              </Button>
              
              {/* Notifications indicator */}
              {pendingCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 relative"
                >
                  <Bell className="h-5 w-5" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {pendingCount}
                  </Badge>
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Profile Header */}
          <ProfileHeader profile={profile} onUpdate={checkAuth} />

          {/* Referral Invitations Section */}
          <ReferralInvitationsSection
            invitations={invitations}
            pendingCount={pendingCount}
            loading={invitationsLoading}
            onAccept={acceptInvitation}
            onDecline={declineInvitation}
          />

          {/* My Contractors (Favorites) */}
          <FavoriteContractorsList
            favorites={favorites}
            loading={favoritesLoading}
            onRemove={removeFavorite}
            onMessage={handleMessageContractor}
          />

          {/* Pending Reviews */}
          <PendingReviewsCard
            reviewableProjects={reviewableProjects}
            submittedReviews={submittedReviews}
            loading={reviewsLoading}
            onLeaveReview={handleLeaveReview}
          />

          {/* Notes Section */}
          <HomeownerNotes userId={userId} />

          {/* Photos Section */}
          <PhotoGallery
            photos={photos}
            loading={photosLoading}
            uploading={uploading}
            onUpload={uploadPhoto}
            onDelete={deletePhoto}
          />

          {/* Submissions Section */}
          <SubmissionsList 
            submissions={submissions} 
            loading={submissionsLoading} 
          />

          {/* Contractor Finder */}
          <ContractorFinder 
            userId={userId}
            onMessageContractor={handleMessageContractor}
          />
        </div>
      </main>

      {/* Leave Review Dialog */}
      <LeaveReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        project={selectedProject}
        reviewerName={reviewerName}
        reviewerEmail={profile.email || undefined}
        onSubmit={submitReview}
        submitting={submitting}
      />
    </div>
  );
}
