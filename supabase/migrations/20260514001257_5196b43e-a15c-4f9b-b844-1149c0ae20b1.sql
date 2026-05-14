
-- broadcast_conversations
CREATE TABLE public.broadcast_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.referral_broadcasts(id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES public.referral_broadcast_claims(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.gcn_customers(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  customer_consent boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  customer_declined boolean NOT NULL DEFAULT false,
  last_message_at timestamptz DEFAULT now(),
  contractor_unread_count integer NOT NULL DEFAULT 0,
  customer_unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broadcast_id, contractor_id)
);
CREATE INDEX idx_bc_contractor ON public.broadcast_conversations(contractor_id);
CREATE INDEX idx_bc_customer ON public.broadcast_conversations(customer_id);

ALTER TABLE public.broadcast_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractor reads own conversations"
ON public.broadcast_conversations FOR SELECT TO authenticated
USING (contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());

CREATE POLICY "Contractor inserts own conversations"
ON public.broadcast_conversations FOR INSERT TO authenticated
WITH CHECK (contractor_id = public.get_contractor_profile_id());

CREATE POLICY "Contractor updates own conversations"
ON public.broadcast_conversations FOR UPDATE TO authenticated
USING (contractor_id = public.get_contractor_profile_id() OR public.is_super_admin());

-- broadcast_messages
CREATE TABLE public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.broadcast_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('contractor','customer','system')),
  sender_id uuid,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bm_conversation ON public.broadcast_messages(conversation_id, created_at DESC);

ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractor reads own messages"
ON public.broadcast_messages FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.broadcast_conversations c
          WHERE c.id = broadcast_messages.conversation_id
            AND (c.contractor_id = public.get_contractor_profile_id() OR public.is_super_admin()))
);

CREATE POLICY "Contractor inserts own messages"
ON public.broadcast_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_type = 'contractor' AND
  EXISTS (SELECT 1 FROM public.broadcast_conversations c
          WHERE c.id = broadcast_messages.conversation_id
            AND c.contractor_id = public.get_contractor_profile_id())
);

-- broadcast_consent_tokens (no client access; service role only)
CREATE TABLE public.broadcast_consent_tokens (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.broadcast_conversations(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('accept','decline')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bct_conversation ON public.broadcast_consent_tokens(conversation_id);
ALTER TABLE public.broadcast_consent_tokens ENABLE ROW LEVEL SECURITY;
-- no policies = no client access

-- Trigger: stamp message_sent_at on first contractor message + bump unread + last_message_at
CREATE OR REPLACE FUNCTION public.on_broadcast_message_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  conv public.broadcast_conversations;
  prior_count int;
BEGIN
  SELECT * INTO conv FROM public.broadcast_conversations WHERE id = NEW.conversation_id;
  IF NEW.sender_type = 'contractor' THEN
    SELECT count(*) INTO prior_count FROM public.broadcast_messages
      WHERE conversation_id = NEW.conversation_id AND sender_type = 'contractor' AND id <> NEW.id;
    IF prior_count = 0 THEN
      UPDATE public.referral_broadcast_claims
        SET message_sent_at = now()
        WHERE id = conv.claim_id;
    END IF;
    UPDATE public.broadcast_conversations
      SET last_message_at = now(), customer_unread_count = customer_unread_count + 1
      WHERE id = NEW.conversation_id;
  ELSIF NEW.sender_type = 'customer' THEN
    UPDATE public.broadcast_conversations
      SET last_message_at = now(), contractor_unread_count = contractor_unread_count + 1
      WHERE id = NEW.conversation_id;
  ELSE
    UPDATE public.broadcast_conversations SET last_message_at = now() WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_broadcast_message_insert
AFTER INSERT ON public.broadcast_messages
FOR EACH ROW EXECUTE FUNCTION public.on_broadcast_message_insert();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_conversations;
