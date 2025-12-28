import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, User, MessageCircle, Bell, Search, Settings, 
  LogOut, Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocialNotifications } from "@/hooks/useSocialNotifications";
import { useSocialProfile } from "@/hooks/useSocialProfile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { icon: Home, label: "Feed", path: "/social/feed" },
  { icon: Search, label: "Discover", path: "/social/discover" },
  { icon: MessageCircle, label: "Messages", path: "/social/messages" },
  { icon: Bell, label: "Notifications", path: "/social/notifications" },
  { icon: User, label: "Profile", path: "/social/profile" },
];

export const SocialSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useSocialNotifications();
  const { profile } = useSocialProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 border-r bg-card">
      <div className="flex flex-col flex-1 gap-2 p-4">
        {/* Profile Card */}
        {profile && (
          <Link 
            to={`/social/profile/${profile.id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-4"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.logo_url || undefined} />
              <AvatarFallback>
                {profile.company_name?.charAt(0) || "C"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{profile.company_name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.category}</p>
            </div>
          </Link>
        )}

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const showBadge = item.label === "Notifications" && unreadCount > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {showBadge && (
                  <span className="absolute right-3 h-5 min-w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          <Link
            to="/social/profile/edit"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <Button
            variant="ghost"
            className="justify-start gap-3 px-4 py-3 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
};
