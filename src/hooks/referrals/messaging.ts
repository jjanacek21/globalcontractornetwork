import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Get-or-create a conversation for a (broadcast, contractor) pair
export function useOrCreateBroadcastConversation() {
  return useMutation({
    mutationFn: async (input: {
      broadcastId: string;
      claimId: string;
      contractorId: string;
      customerId: string;
    }) => {
      const { data: existing } = await supabase
        .from("broadcast_conversations")
        .select("*")
        .eq("broadcast_id", input.broadcastId)
        .eq("contractor_id", input.contractorId)
        .maybeSingle();
      if (existing) return existing;
      const { data, error } = await supabase
        .from("broadcast_conversations")
        .insert({
          broadcast_id: input.broadcastId,
          claim_id: input.claimId,
          contractor_id: input.contractorId,
          customer_id: input.customerId,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useBroadcastConversation(conversationId: string | null) {
  return useQuery({
    enabled: !!conversationId,
    queryKey: ["broadcastConv", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcast_conversations")
        .select(
          "*, gcn_customers(name, email, phone, property_address), referral_broadcasts(trade, notes, service_area)",
        )
        .eq("id", conversationId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useBroadcastMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const query = useQuery({
    enabled: !!conversationId,
    queryKey: ["broadcastMessages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcast_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`broadcast_messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "broadcast_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["broadcastMessages", conversationId] });
          qc.invalidateQueries({ queryKey: ["broadcastConv", conversationId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  return query;
}

export function useSendBroadcastMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversationId: string; content: string; contractorId: string }) => {
      const { count: priorCount } = await supabase
        .from("broadcast_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", input.conversationId)
        .eq("sender_type", "contractor");

      const { error } = await supabase.from("broadcast_messages").insert({
        conversation_id: input.conversationId,
        sender_type: "contractor",
        sender_id: input.contractorId,
        content: input.content,
      });
      if (error) throw error;

      // First contractor message → notify the customer
      if ((priorCount ?? 0) === 0) {
        try {
          await supabase.functions.invoke("send-broadcast-claim-notification", {
            body: { conversation_id: input.conversationId },
          });
        } catch (e) {
          console.error("notification failed", e);
        }
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["broadcastMessages", vars.conversationId] });
    },
  });
}

export function useMyBroadcastConversations(contractorId: string | null | undefined) {
  return useQuery({
    enabled: !!contractorId,
    queryKey: ["myBroadcastConvs", contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcast_conversations")
        .select("*, gcn_customers(name), referral_broadcasts(trade)")
        .eq("contractor_id", contractorId!)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUnreadBroadcastCount(contractorId: string | null | undefined) {
  const { data } = useMyBroadcastConversations(contractorId);
  return useMemo(
    () => (data ?? []).reduce((s: number, c: any) => s + (c.contractor_unread_count ?? 0), 0),
    [data],
  );
}
