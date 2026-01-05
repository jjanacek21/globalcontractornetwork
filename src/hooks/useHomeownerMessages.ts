import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Conversation {
  id: string;
  homeowner_id: string;
  contractor_id: string;
  last_message_at: string;
  homeowner_unread_count: number;
  contractor_unread_count: number;
  created_at: string;
  contractor?: {
    id: string;
    company_name: string;
    category: string;
    logo_url: string | null;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'homeowner' | 'contractor';
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function useHomeownerMessages(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('homeowner_conversations')
        .select(`
          *,
          contractor:contractor_profiles(id, company_name, category, logo_url)
        `)
        .eq('homeowner_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      const typedConversations = (data || []).map(conv => ({
        ...conv,
        contractor: conv.contractor as Conversation['contractor']
      }));
      
      setConversations(typedConversations);
      setTotalUnread(typedConversations.reduce((sum, c) => sum + (c.homeowner_unread_count || 0), 0));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const startConversation = async (contractorId: string): Promise<string | null> => {
    if (!userId) return null;
    
    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('homeowner_conversations')
        .select('id')
        .eq('homeowner_id', userId)
        .eq('contractor_id', contractorId)
        .single();

      if (existing) return existing.id;

      // Create new conversation
      const { data, error } = await supabase
        .from('homeowner_conversations')
        .insert({
          homeowner_id: userId,
          contractor_id: contractorId
        })
        .select('id')
        .single();

      if (error) throw error;
      
      await fetchConversations();
      return data.id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
      return null;
    }
  };

  return {
    conversations,
    loading,
    totalUnread,
    startConversation,
    refetch: fetchConversations
  };
}

export function useConversationMessages(conversationId: string | null, userId: string | null, userType: 'homeowner' | 'contractor') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const { data, error } = await supabase
        .from('homeowner_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages((data || []) as Message[]);

      // Mark messages as read
      if (userId) {
        const unreadMessages = (data || []).filter(m => !m.is_read && m.sender_type !== userType);
        if (unreadMessages.length > 0) {
          await supabase
            .from('homeowner_messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(m => m.id));

          // Update unread count in conversation
          const countField = userType === 'homeowner' ? 'homeowner_unread_count' : 'contractor_unread_count';
          await supabase
            .from('homeowner_conversations')
            .update({ [countField]: 0 })
            .eq('id', conversationId);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, userType]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'homeowner_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if we're the recipient
          if (newMessage.sender_type !== userType && userId) {
            supabase
              .from('homeowner_messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, userType]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !userId || !content.trim()) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('homeowner_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: userType,
          sender_id: userId,
          content: content.trim()
        });

      if (error) throw error;

      // Get current unread count and increment
      const { data: conv } = await supabase
        .from('homeowner_conversations')
        .select('contractor_unread_count, homeowner_unread_count')
        .eq('id', conversationId)
        .single();

      const countField = userType === 'homeowner' ? 'contractor_unread_count' : 'homeowner_unread_count';
      const currentCount = userType === 'homeowner' 
        ? (conv?.contractor_unread_count || 0) 
        : (conv?.homeowner_unread_count || 0);

      await supabase
        .from('homeowner_conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          [countField]: currentCount + 1
        })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    sendMessage,
    refetch: fetchMessages
  };
}
