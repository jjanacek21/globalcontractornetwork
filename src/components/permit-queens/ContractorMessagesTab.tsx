import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2, User, Shield, Bell } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  permit_request_id: string;
  user_id: string | null;
  sender_name: string | null;
  sender_role: string | null;
  message_type: string | null;
  content: string;
  attachments_json: any;
  is_internal: boolean | null;
  is_read: boolean | null;
  created_at: string;
}

interface ContractorMessagesTabProps {
  permitId: string;
  contractorName?: string;
}

export function ContractorMessagesTab({ permitId, contractorName }: ContractorMessagesTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`contractor-messages-${permitId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'permit_messages',
          filter: `permit_request_id=eq.${permitId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          
          // Show toast for admin messages
          if (newMsg.sender_role === 'admin') {
            toast.info('New message from Permit Queens', {
              description: newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? '...' : ''),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permitId]);

  useEffect(() => {
    scrollToBottom();
    markMessagesAsRead();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    // Mark admin messages as read when contractor views them
    const unreadAdminMessages = messages.filter(m => m.sender_role === 'admin' && !m.is_read);
    if (unreadAdminMessages.length > 0) {
      await supabase
        .from('permit_messages')
        .update({ is_read: true })
        .in('id', unreadAdminMessages.map(m => m.id));
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permit_messages')
        .select('*')
        .eq('permit_request_id', permitId)
        .eq('is_internal', false) // Don't show internal admin notes
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Count unread admin messages
      const unread = (data || []).filter(m => m.sender_role === 'admin' && !m.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('permit_messages')
        .insert({
          permit_request_id: permitId,
          sender_name: contractorName || 'Contractor',
          sender_role: 'contractor',
          message_type: 'comment',
          content: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white ml-2">
              {unreadCount} new
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Communicate with your permit expediter
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Messages List */}
        <div className="h-[350px] overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet.</p>
              <p className="text-sm">Your expediter will contact you here if they need additional information.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-[80%]",
                  message.sender_role === 'contractor' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <Avatar className={cn(
                  "h-8 w-8",
                  message.sender_role === 'admin' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-amber-500 text-white"
                )}>
                  <AvatarFallback>
                    {message.sender_role === 'admin' ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg p-3 max-w-full",
                    message.sender_role === 'contractor' 
                      ? "bg-amber-500 text-white ml-auto" 
                      : "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {message.sender_role === 'admin' ? 'Permit Queens' : 'You'}
                    </span>
                    {message.message_type === 'notification' && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 flex items-center gap-1">
                        <Bell className="h-2 w-2" />
                        Alert
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] opacity-70">
                      {format(new Date(message.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="h-full min-h-[60px]"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
