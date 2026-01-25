import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, User, Shield, Paperclip, CheckCheck } from "lucide-react";
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

interface AdminContractorMessagingProps {
  permitId: string;
}

export function AdminContractorMessaging({ permitId }: AdminContractorMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`permit-messages-${permitId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'permit_messages',
          filter: `permit_request_id=eq.${permitId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permitId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permit_messages')
        .select('*')
        .eq('permit_request_id', permitId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
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
          sender_name: 'Permit Queens Admin',
          sender_role: 'admin',
          message_type: 'comment',
          content: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
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

  const getMessageStyle = (role: string | null) => {
    if (role === 'admin') {
      return 'bg-primary text-primary-foreground ml-auto';
    }
    return 'bg-muted';
  };

  const getAvatarColor = (role: string | null) => {
    if (role === 'admin') {
      return 'bg-primary text-primary-foreground';
    }
    return 'bg-amber-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px]">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No messages yet.</p>
            <p className="text-sm">Start the conversation below.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-[80%]",
                message.sender_role === 'admin' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <Avatar className={cn("h-8 w-8", getAvatarColor(message.sender_role))}>
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
                  getMessageStyle(message.sender_role)
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {message.sender_name || (message.sender_role === 'admin' ? 'Admin' : 'Contractor')}
                  </span>
                  {message.message_type === 'notification' && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      System
                    </Badge>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] opacity-70">
                    {format(new Date(message.created_at), 'MMM d, h:mm a')}
                  </span>
                  {message.sender_role === 'admin' && message.is_read && (
                    <CheckCheck className="h-3 w-3 opacity-70" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex gap-2 mt-4">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="resize-none"
          rows={2}
        />
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="h-full"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
