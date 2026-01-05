import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, ArrowLeft, Building2, Calendar } from 'lucide-react';
import { Conversation, useConversationMessages } from '@/hooks/useHomeownerMessages';
import { useHomeownerAppointments } from '@/hooks/useHomeownerAppointments';
import { ScheduleAppointmentDialog } from './ScheduleAppointmentDialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessagesPanelProps {
  conversations: Conversation[];
  loading: boolean;
  userId: string;
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}

export function MessagesPanel({ 
  conversations, 
  loading, 
  userId,
  selectedConversationId,
  onSelectConversation 
}: MessagesPanelProps) {
  const [messageInput, setMessageInput] = useState('');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  
  const { messages, sending, sendMessage } = useConversationMessages(
    selectedConversationId, 
    userId, 
    'homeowner'
  );

  const { createAppointment } = useHomeownerAppointments(userId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    await sendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <Card className="h-[600px] glass-card">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  // Conversation list view
  if (!selectedConversationId) {
    return (
      <Card className="h-[600px] glass-card">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[480px] text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start by messaging a contractor</p>
            </div>
          ) : (
            <ScrollArea className="h-[480px]">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b text-left"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.contractor?.logo_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Building2 className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">
                        {conv.contractor?.company_name || 'Unknown Contractor'}
                      </h4>
                      {conv.homeowner_unread_count > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conv.homeowner_unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.contractor?.category}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(conv.last_message_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </button>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  }

  // Chat view
  return (
    <>
      <Card className="h-[600px] glass-card flex flex-col">
        <CardHeader className="border-b py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSelectConversation(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation?.contractor?.logo_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">
                  {selectedConversation?.contractor?.company_name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation?.contractor?.category}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleDialogOpen(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </CardHeader>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.sender_type === 'homeowner' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-4 py-2",
                    message.sender_type === 'homeowner'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    message.sender_type === 'homeowner' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  )}>
                    {format(new Date(message.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!messageInput.trim() || sending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Schedule Appointment Dialog */}
      {selectedConversation?.contractor && (
        <ScheduleAppointmentDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          contractorName={selectedConversation.contractor.company_name || 'Contractor'}
          contractorId={selectedConversation.contractor_id}
          conversationId={selectedConversationId || undefined}
          onSchedule={createAppointment}
        />
      )}
    </>
  );
}
