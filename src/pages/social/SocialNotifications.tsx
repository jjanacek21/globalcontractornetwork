import { SocialAccessGuard } from "@/components/social/SocialAccessGuard";
import { SocialLayout } from "@/components/social/SocialLayout";
import { useSocialNotifications } from "@/hooks/useSocialNotifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Heart, MessageCircle, UserPlus, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "like":
      return <Heart className="h-5 w-5 text-red-500" />;
    case "comment":
      return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case "follow":
      return <UserPlus className="h-5 w-5 text-green-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const getNotificationMessage = (notification: { type: string; data: any }) => {
  const actorName = notification.data?.actor_name || "Someone";
  switch (notification.type) {
    case "like":
      return `${actorName} liked your post`;
    case "comment":
      return `${actorName} commented on your post`;
    case "follow":
      return `${actorName} started following you`;
    default:
      return "You have a new notification";
  }
};

const SocialNotifications = () => {
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useSocialNotifications();

  return (
    <SocialAccessGuard>
      <SocialLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">
                When someone interacts with your posts, you'll see it here.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.is_read ? "bg-primary/5 border-primary/20" : ""
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${!notification.is_read ? "font-medium" : ""}`}>
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SocialLayout>
    </SocialAccessGuard>
  );
};

export default SocialNotifications;
