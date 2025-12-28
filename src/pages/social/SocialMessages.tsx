import { SocialLayout } from "@/components/social/SocialLayout";
import { SocialAccessGuard } from "@/components/social/SocialAccessGuard";
import { useSocialMessages, Conversation, Message } from "@/hooks/useSocialMessages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const SocialMessages = () => {
  const {
    conversations, activeConversation, setActiveConversation,
    messages, loading, profileId, fetchMessages, sendMessage
  } = useSocialMessages();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    setSending(true);
    await sendMessage(activeConversation.id, newMessage.trim());
    setNewMessage("");
    setSending(false);
  };

  const getConversationName = (convo: Conversation) => {
    if (convo.is_group && convo.name) return convo.name;
    const otherMember = convo.members?.find(m => m.user_id !== profileId);
    return otherMember?.profile?.company_name || "Unknown";
  };

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

  return (
    <SocialAccessGuard>
      <SocialLayout>
        <Card className="h-[calc(100vh-12rem)] flex overflow-hidden">
          {/* Conversation List */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="p-4 text-muted-foreground text-sm">No conversations yet</p>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConversation(convo)}
                    className={cn(
                      "w-full p-3 flex items-center gap-3 hover:bg-muted transition-colors text-left",
                      activeConversation?.id === convo.id && "bg-muted"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getConversationName(convo).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{getConversationName(convo)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {convo.last_message?.content_text || "No messages"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                <div className="p-4 border-b">
                  <h3 className="font-semibold">{getConversationName(activeConversation)}</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_id === profileId ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-4 py-2",
                          msg.sender_id === profileId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{msg.content_text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation
              </div>
            )}
          </div>
        </Card>
      </SocialLayout>
    </SocialAccessGuard>
  );
};

export default SocialMessages;
