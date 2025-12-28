import { Link } from "react-router-dom";
import { Bell, Menu, MessageCircle, Home, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSocialNotifications } from "@/hooks/useSocialNotifications";
import { useSocialProfile } from "@/hooks/useSocialProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import gcnLogo from "@/assets/gcn-logo.jpg";

export const SocialHeader = () => {
  const { unreadCount } = useSocialNotifications();
  const { profile } = useSocialProfile();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo */}
        <Link to="/social/feed" className="flex items-center gap-2">
          <img src={gcnLogo} alt="GCN" className="h-8 w-8 rounded-lg" />
          <span className="font-bold text-lg hidden sm:inline">Contractor Hub</span>
        </Link>

        {/* Desktop Nav Icons */}
        <div className="hidden lg:flex items-center gap-2">
          <Link to="/social/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <Link to="/social/messages">
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </Link>
          {profile && (
            <Link to={`/social/profile/${profile.id}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.logo_url || undefined} />
                <AvatarFallback>
                  {profile.company_name?.charAt(0) || "C"}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-2 mt-8">
              <Link
                to="/social/feed"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
              >
                <Home className="h-5 w-5" />
                Feed
              </Link>
              <Link
                to="/social/discover"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
              >
                <Search className="h-5 w-5" />
                Discover
              </Link>
              <Link
                to="/social/messages"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
              >
                <MessageCircle className="h-5 w-5" />
                Messages
              </Link>
              <Link
                to="/social/notifications"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
              >
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto h-5 min-w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/social/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted"
              >
                <User className="h-5 w-5" />
                Profile
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
