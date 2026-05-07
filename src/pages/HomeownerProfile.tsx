import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LogOut, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProfileHeader } from '@/components/homeowner/ProfileHeader';
import { HomeownerNotes } from '@/components/homeowner/HomeownerNotes';
import { PhotoGallery } from '@/components/homeowner/PhotoGallery';
import { SubmissionsList } from '@/components/homeowner/SubmissionsList';
import { FavoriteContractorsList } from '@/components/homeowner/FavoriteContractorsList';
import { ReferralInvitationsSection } from '@/components/homeowner/ReferralInvitationsSection';
import { PendingReviewsCard } from '@/components/homeowner/PendingReviewsCard';
import { LeaveReviewDialog } from '@/components/homeowner/LeaveReviewDialog';
import { AppointmentsSection } from '@/components/homeowner/AppointmentsSection';
import { NotificationsPanel } from '@/components/homeowner/NotificationsPanel';
import { MyEstimatesSection } from '@/components/homeowner/MyEstimatesSection';

import { useHomeownerPhotos } from '@/hooks/useHomeownerPhotos';
import { useHomeownerSubmissions } from '@/hooks/useHomeownerSubmissions';
import { useFavoriteContractors } from '@/hooks/useFavoriteContractors';
import { useHomeownerReferralInvitations } from '@/hooks/useHomeownerReferralInvitations';
import { useHomeownerReviews, ReviewableProject } from '@/hooks/useHomeownerReviews';
import { useHomeownerMessages } from '@/hooks/useHomeownerMessages';
import { useHomeownerAppointments } from '@/hooks/useHomeownerAppointments';
import { useHomeownerNotifications } from '@/hooks/useHomeownerNotifications';
import { useHomeownerEstimates } from '@/hooks/useHomeownerEstimates';
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
  const { upcomingAppointments, pastAppointments, loading: appointmentsLoading, cancelAppointment } = useHomeownerAppointments(userId);
  const { notifications, unreadCount: notificationUnreadCount, loading: notificationsLoading, markAsRead, markAllAsRead } = useHomeownerNotifications(userId);
  const { estimates, loading: estimatesLoading, downloadEstimate } = useHomeownerEstimates(userId, profile?.email || null);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || !userId) {
    return null;
  }

  const reviewerName = profile.full_name || profile.email || 'Anonymous';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[hsl(45,100%,51%)] to-primary opacity-60" />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/member/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={gcnLogo} alt="GCN" className="h-10 w-auto rounded-lg" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold">My Profile</h1>
                <p className="text-sm text-muted-foreground">Manage your information</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Messages button with badge */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/homeowner-messages')}
                className="relative"
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
              
              {/* Notifications Panel */}
              <NotificationsPanel
                notifications={notifications}
                unreadCount={notificationUnreadCount}
                loading={notificationsLoading}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
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

          {/* Appointments Section */}
          <AppointmentsSection
            upcomingAppointments={upcomingAppointments}
            pastAppointments={pastAppointments}
            loading={appointmentsLoading}
            onCancel={cancelAppointment}
          />

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

          {/* My Estimates Section */}
          <MyEstimatesSection
            estimates={estimates}
            loading={estimatesLoading}
            onDownload={downloadEstimate}
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
