import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Wrench, 
  Camera, 
  Globe, 
  Users, 
  Settings, 
  LogOut,
  Loader2,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Trophy,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContractorProfile, SocialLinks } from '@/hooks/useContractorProfile';
import { useContractorFeatures } from '@/hooks/useContractorFeatures';
import { ProfileImageUpload } from '@/components/contractor/ProfileImageUpload';
import { GalleryManager } from '@/components/contractor/GalleryManager';
import { SocialLinksEditor } from '@/components/contractor/SocialLinksEditor';
import { ServicesEditor } from '@/components/contractor/ServicesEditor';
import { ReferencesEditor } from '@/components/contractor/ReferencesEditor';
import { ReferralEarningsCard } from '@/components/contractor/ReferralEarningsCard';
import { GamificationSummaryCard } from '@/components/gamification/GamificationSummaryCard';
import { LandingPageBuilder } from '@/components/contractor/LandingPageBuilder';

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [localChanges, setLocalChanges] = useState<Record<string, unknown>>({});
  
  const {
    profile,
    loading,
    saving,
    updateProfile,
    uploadImage,
    addGalleryImage,
    removeGalleryImage,
    addClientReference,
    removeClientReference
  } = useContractorProfile(userId);

  const { hasFeature, loading: featuresLoading } = useContractorFeatures();
  const hasRewardsAccess = hasFeature('rewards_dashboard');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/contractor/auth');
        return;
      }
      setUserId(user.id);
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleFieldChange = (field: string, value: unknown) => {
    setLocalChanges(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (field: string, value: string) => {
    if (field.startsWith('social_links.')) {
      const key = field.replace('social_links.', '');
      const currentLinks = (localChanges.social_links as SocialLinks) || profile?.social_links || {};
      setLocalChanges(prev => ({
        ...prev,
        social_links: { ...currentLinks, [key]: value }
      }));
    } else {
      handleFieldChange(field, value);
    }
  };

  const handleSaveBasicInfo = async () => {
    const updates: Record<string, unknown> = {};
    const editableFields = [
      'company_name', 'description', 'bio_short', 'bio_long',
      'phone', 'email', 'website', 'google_business_url',
      'social_links', 'services_offered', 'secondary_trades',
      'service_area', 'license_number', 'license_state'
    ];
    
    editableFields.forEach(field => {
      if (localChanges[field] !== undefined) {
        updates[field] = localChanges[field];
      }
    });

    if (Object.keys(updates).length > 0) {
      await updateProfile(updates);
      setLocalChanges({});
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    const url = await uploadImage(file, type);
    if (url) {
      const field = type === 'logo' ? 'logo_url' : 'banner_image_url';
      await updateProfile({ [field]: url });
    }
  };

  const getValue = (field: string): string => {
    if (localChanges[field] !== undefined) return String(localChanges[field] || '');
    if (!profile) return '';
    const value = profile[field as keyof typeof profile];
    return String(value || '');
  };

  const getArrayValue = (field: string): string[] => {
    if (localChanges[field] !== undefined) return localChanges[field] as string[];
    if (!profile) return [];
    const value = profile[field as keyof typeof profile];
    return (value as string[]) || [];
  };

  if (loading || featuresLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Profile not found</p>
          <Button onClick={() => navigate('/contractor/auth')} className="mt-4">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  const hasChanges = Object.keys(localChanges).length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">Edit Profile</h1>
              <p className="text-xs text-muted-foreground">{profile.company_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button onClick={handleSaveBasicInfo} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.is_verified && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          <Badge variant="outline">{profile.subscription_status || 'Free'}</Badge>
          <Badge variant="outline">{profile.category}</Badge>
        </div>

        {/* Referral Earnings and Rewards Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ReferralEarningsCard contractorId={profile.id} />
          {hasRewardsAccess && (
            <GamificationSummaryCard 
              userId={userId} 
              onViewAll={() => navigate('/contractor/rewards')}
            />
          )}
        </div>


        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-7 w-full">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Services</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger value="references" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">References</span>
            </TabsTrigger>
            <TabsTrigger value="landing" className="gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Landing</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Images */}
            <div className="grid gap-6 md:grid-cols-2">
              <ProfileImageUpload
                type="logo"
                currentUrl={profile.logo_url}
                onUpload={(file) => handleImageUpload(file, 'logo')}
              />
              <ProfileImageUpload
                type="banner"
                currentUrl={profile.banner_image_url}
                onUpload={(file) => handleImageUpload(file, 'banner')}
              />
            </div>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={getValue('company_name')}
                      onChange={(e) => handleFieldChange('company_name', e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Category</Label>
                    <Input
                      value={profile.category}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Contact support to change</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Short Bio (Tagline)</Label>
                  <Input
                    value={getValue('bio_short')}
                    onChange={(e) => handleFieldChange('bio_short', e.target.value)}
                    placeholder="Your 1-line elevator pitch"
                    maxLength={120}
                  />
                  <p className="text-xs text-muted-foreground">{getValue('bio_short').length}/120</p>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={getValue('description')}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Brief description of your business"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Full Bio / About Us</Label>
                  <Textarea
                    value={getValue('bio_long')}
                    onChange={(e) => handleFieldChange('bio_long', e.target.value)}
                    placeholder="Detailed information about your company, history, values..."
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <ServicesEditor
              services={getArrayValue('services_offered')}
              secondaryTrades={getArrayValue('secondary_trades')}
              category={profile.category}
              onServicesChange={(services) => handleFieldChange('services_offered', services)}
              onTradesChange={(trades) => handleFieldChange('secondary_trades', trades)}
            />
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <GalleryManager
              gallery={profile.profile_gallery}
              onAdd={addGalleryImage}
              onRemove={removeGalleryImage}
            />
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social">
            <SocialLinksEditor
              socialLinks={(localChanges.social_links as SocialLinks) || profile.social_links}
              website={getValue('website') || profile.website}
              googleBusinessUrl={getValue('google_business_url') || profile.google_business_url}
              onChange={handleSocialLinkChange}
            />
          </TabsContent>

          {/* References Tab */}
          <TabsContent value="references">
            <ReferencesEditor
              references={profile.client_references}
              onAdd={addClientReference}
              onRemove={removeClientReference}
            />
          </TabsContent>

          <TabsContent value="landing">
            {profile?.id && userId && (
              <LandingPageBuilder
                profileId={profile.id}
                userId={userId}
                initialCompanyName={profile.company_name}
                existingWebsite={(profile as any).website}
              />
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <Input
                      value={getValue('phone')}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={getValue('email')}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Service Areas
                </CardTitle>
                <CardDescription>Cities or regions you serve</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(getArrayValue('service_area')).map((area, index) => (
                    <Badge key={index} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add service area and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newArea = e.currentTarget.value.trim();
                      const current = getArrayValue('service_area');
                      if (!current.includes(newArea)) {
                        handleFieldChange('service_area', [...current, newArea]);
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* License Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">License Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>License Number</Label>
                    <Input
                      value={getValue('license_number')}
                      onChange={(e) => handleFieldChange('license_number', e.target.value)}
                      placeholder="e.g., CCC-123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>License State</Label>
                    <Input
                      value={getValue('license_state')}
                      onChange={(e) => handleFieldChange('license_state', e.target.value)}
                      placeholder="e.g., FL"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
