import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, MapPin, Edit2, Save, X, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
}

interface ProfileHeaderProps {
  profile: Profile;
  onUpdate: () => void;
}

export function ProfileHeader({ profile, onUpdate }: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    address: profile.address || '',
    city: profile.city || '',
    state: profile.state || '',
    zip_code: profile.zip_code || ''
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'HO';

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[hsl(45,100%,51%)]/20 flex items-center justify-center">
            <span className="text-xl font-bold text-[hsl(45,100%,51%)]">{initials}</span>
          </div>
          <div>
            <span className="block">{profile.full_name || 'Homeowner'}</span>
            <span className="text-sm font-normal text-white/60 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Member since {profile.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'N/A'}
            </span>
          </div>
        </CardTitle>
        {!isEditing ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button 
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-[hsl(45,100%,51%)] text-black hover:bg-[hsl(45,100%,45%)]"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Phone</Label>
              <Input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-white/70">Address</Label>
              <Input
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">City</Label>
              <Input
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">State</Label>
                <Input
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">ZIP</Label>
                <Input
                  value={formData.zip_code}
                  onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <Mail className="h-5 w-5 text-[hsl(45,100%,51%)]" />
              <div>
                <p className="text-xs text-white/50">Email</p>
                <p className="text-white">{profile.email || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <Phone className="h-5 w-5 text-[hsl(45,100%,51%)]" />
              <div>
                <p className="text-xs text-white/50">Phone</p>
                <p className="text-white">{profile.phone || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 sm:col-span-2">
              <MapPin className="h-5 w-5 text-[hsl(45,100%,51%)]" />
              <div>
                <p className="text-xs text-white/50">Address</p>
                <p className="text-white">
                  {profile.address ? (
                    `${profile.address}${profile.city ? `, ${profile.city}` : ''}${profile.state ? `, ${profile.state}` : ''} ${profile.zip_code || ''}`
                  ) : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
