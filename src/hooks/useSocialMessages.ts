import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Conversation {
  id: string;
  is_group: boolean;
  name: string | null;
  created_by: string;
  last_message_at: string;
  created_at: string;
  members?: {
    user_id: string;
    role: string;
    profile?: {
      id: string;
      company_name: string;
      first_name: string | null;
      last_name: string | null;
      logo_url: string | null;
    };
  }[];
  last_message?: {
    content_text: string | null;
    sender_id: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content_text: string | null;
  is_deleted: boolean;
  has_attachments: boolean;
  created_at: string;
  edited_at: string | null;
  sender?: {
    id: string;
    company_name: string;
    first_name: string | null;
    last_name: string | null;
    logo_url: string | null;
  };
  attachments?: {
    id: string;
    file_url: string;
    file_type: string;
    file_name: string | null;
  }[];
}

export const useSocialMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("contractor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        return;
      }

      setProfileId(profile.id);

      // Get conversations where user is a member
      const { data: memberConvos } = await supabase
        .from("social_conversation_members")
        .select("conversation_id")
        .eq("user_id", profile.id);

      if (!memberConvos || memberConvos.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const convoIds = memberConvos.map(m => m.conversation_id);

      const { data, error } = await supabase
        .from("social_conversations")
        .select("*")
        .in("id", convoIds)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Get members for each conversation
      const convosWithMembers = await Promise.all(
        (data || []).map(async (convo) => {
          const { data: members } = await supabase
            .from("social_conversation_members")
            .select(`
              user_id, role,
              profile:contractor_profiles!social_conversation_members_user_id_fkey(
                id, company_name, first_name, last_name, logo_url
              )
            `)
            .eq("conversation_id", convo.id);

          // Get last message
          const { data: lastMsg } = await supabase
            .from("social_messages")
            .select("content_text, sender_id")
            .eq("conversation_id", convo.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...convo,
            members: members || [],
            last_message: lastMsg,
          };
        })
      );

      setConversations(convosWithMembers);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("social_messages")
        .select(`
          *,
          sender:contractor_profiles!social_messages_sender_id_fkey(
            id, company_name, first_name, last_name, logo_url
          ),
          attachments:social_message_attachments(id, file_url, file_type, file_name)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  const sendMessage = async (conversationId: string, content: string) => {
    if (!profileId) return false;

    try {
      const { error } = await supabase
        .from("social_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: profileId,
          content_text: content,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Failed to send message", variant: "destructive" });
      return false;
    }
  };

  const startConversation = async (targetProfileId: string) => {
    if (!profileId) return null;

    try {
      // Check if conversation already exists
      const { data: existingMemberships } = await supabase
        .from("social_conversation_members")
        .select("conversation_id")
        .eq("user_id", profileId);

      if (existingMemberships) {
        for (const membership of existingMemberships) {
          const { data: convo } = await supabase
            .from("social_conversations")
            .select("*")
            .eq("id", membership.conversation_id)
            .eq("is_group", false)
            .maybeSingle();

          if (convo) {
            const { data: otherMember } = await supabase
              .from("social_conversation_members")
              .select("user_id")
              .eq("conversation_id", convo.id)
              .eq("user_id", targetProfileId)
              .maybeSingle();

            if (otherMember) {
              return convo.id;
            }
          }
        }
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from("social_conversations")
        .insert({
          is_group: false,
          created_by: profileId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add both members
      await supabase.from("social_conversation_members").insert([
        { conversation_id: newConvo.id, user_id: profileId, role: "member" },
        { conversation_id: newConvo.id, user_id: targetProfileId, role: "member" },
      ]);

      fetchConversations();
      return newConvo.id;
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({ title: "Failed to start conversation", variant: "destructive" });
      return null;
    }
  };

  // Subscribe to realtime messages
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel(`messages-${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "social_messages",
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from("social_messages")
            .select(`
              *,
              sender:contractor_profiles!social_messages_sender_id_fkey(
                id, company_name, first_name, last_name, logo_url
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    loading,
    profileId,
    fetchMessages,
    sendMessage,
    startConversation,
    refetch: fetchConversations,
  };
};
