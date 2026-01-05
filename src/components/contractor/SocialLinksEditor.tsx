import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { SocialLinks } from '@/hooks/useContractorProfile';

interface SocialLinksEditorProps {
  socialLinks: SocialLinks | null;
  website: string | null;
  googleBusinessUrl: string | null;
  onChange: (field: string, value: string) => void;
}

export function SocialLinksEditor({
  socialLinks,
  website,
  googleBusinessUrl,
  onChange
}: SocialLinksEditorProps) {
  const links = socialLinks || {};

  return (
    <div className="space-y-6">
      {/* Website & Google Business */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Website & Business Listings</CardTitle>
          <CardDescription>Your main online presence</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website URL
            </Label>
            <Input
              value={website || ''}
              onChange={(e) => onChange('website', e.target.value)}
              placeholder="https://yourcompany.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Business Profile URL
            </Label>
            <Input
              value={googleBusinessUrl || ''}
              onChange={(e) => onChange('google_business_url', e.target.value)}
              placeholder="https://g.page/your-business"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Social Media</CardTitle>
          <CardDescription>Connect your social profiles</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook
            </Label>
            <Input
              value={links.facebook || ''}
              onChange={(e) => onChange('social_links.facebook', e.target.value)}
              placeholder="https://facebook.com/yourpage"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              Instagram
            </Label>
            <Input
              value={links.instagram || ''}
              onChange={(e) => onChange('social_links.instagram', e.target.value)}
              placeholder="https://instagram.com/yourhandle"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-blue-700" />
              LinkedIn
            </Label>
            <Input
              value={links.linkedin || ''}
              onChange={(e) => onChange('social_links.linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/yourcompany"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-sky-500" />
              Twitter / X
            </Label>
            <Input
              value={links.twitter || ''}
              onChange={(e) => onChange('social_links.twitter', e.target.value)}
              placeholder="https://twitter.com/yourhandle"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-600" />
              YouTube
            </Label>
            <Input
              value={links.youtube || ''}
              onChange={(e) => onChange('social_links.youtube', e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              TikTok
            </Label>
            <Input
              value={links.tiktok || ''}
              onChange={(e) => onChange('social_links.tiktok', e.target.value)}
              placeholder="https://tiktok.com/@yourhandle"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
