import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProfileHeader } from '@/components/homeowner/ProfileHeader';
import { HomeownerNotes } from '@/components/homeowner/HomeownerNotes';
import { PhotoGallery } from '@/components/homeowner/PhotoGallery';
import { SubmissionsList } from '@/components/homeowner/SubmissionsList';
import { ContractorFinder } from '@/components/homeowner/ContractorFinder';
import { useHomeownerPhotos } from '@/hooks/useHomeownerPhotos';
import { useHomeownerSubmissions } from '@/hooks/useHomeownerSubmissions';
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

  const { photos, loading: photosLoading, uploading, uploadPhoto, deletePhoto } = useHomeownerPhotos(userId);
  const { submissions, loading: submissionsLoading } = useHomeownerSubmissions(userId, profile?.email || null);

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

      // Map profile data to expected structure
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(45,100%,51%)]"></div>
      </div>
    );
  }

  if (!profile || !userId) {
    return null;
  }

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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Profile Header */}
          <ProfileHeader profile={profile} onUpdate={checkAuth} />

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
          <ContractorFinder />
        </div>
      </main>
    </div>
  );
}
