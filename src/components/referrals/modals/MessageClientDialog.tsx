import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { GreenButton3D, Pill } from "@/components/referrals/ui/primitives";
import {
  useOrCreateBroadcastConversation,
  useBroadcastConversation,
  useBroadcastMessages,
  useSendBroadcastMessage,
} from "@/hooks/referrals/messaging";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Phone, MapPin, Send, CheckCircle2, ShieldAlert } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  broadcast: any; // from useAvailableBroadcasts
  claimId: string | null;
  contractorId: string;
}

export function MessageClientDialog({ open, onOpenChange, broadcast, claimId, contractorId }: Props) {
  const { toast } = useToast();
  const create = useOrCreateBroadcastConversation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [draft, setDraft] = useState("");

  const customerFirst = (broadcast?.gcn_customers?.name ?? "Customer").split(" ")[0];
  const trade = broadcast?.trade ?? "your project";
  const defaultIntro = useMemo(
    () =>
      `Hi ${customerFirst}, this is a vetted contractor from Global Contractor Network. I saw your ${trade} request and would love to help. When's a good time for a quick call to discuss the scope and provide a free estimate?`,
    [customerFirst, trade],
  );

  // Initialize conversation when dialog opens
  useEffect(() => {
    if (!open || !broadcast || !claimId || conversationId) return;
    (async () => {
      try {
        const conv = await create.mutateAsync({
          broadcastId: broadcast.id,
          claimId,
          contractorId,
          customerId: broadcast.customer_id,
        });
        setConversationId(conv.id);
      } catch (e: any) {
        toast({ title: "Couldn't open conversation", description: e.message, variant: "destructive" });
        onOpenChange(false);
      }
    })();
  }, [open, broadcast, claimId, contractorId]); // eslint-disable-line

  useEffect(() => {
    if (!open) {
      setConversationId(null);
      setAgreed(false);
      setDraft("");
    }
  }, [open]);

  const { data: conv } = useBroadcastConversation(conversationId);
  const { data: messages } = useBroadcastMessages(conversationId);
  const send = useSendBroadcastMessage();

  const myMsgCount = (messages ?? []).filter((m: any) => m.sender_type === "contractor").length;
  const isFirstMessage = myMsgCount === 0;
  const consent = !!conv?.customer_consent;
  const declined = !!conv?.customer_declined;

  // Pre-fill draft for first message
  useEffect(() => {
    if (isFirstMessage && !draft) setDraft(defaultIntro);
  }, [isFirstMessage, defaultIntro]); // eslint-disable-line

  const onSend = async () => {
    if (!conversationId) return;
    if (isFirstMessage && !agreed) {
      toast({ title: "Please agree to the messaging rules first.", variant: "destructive" });
      return;
    }
    if (!draft.trim()) return;
    try {
      await send.mutateAsync({ conversationId, content: draft.trim(), contractorId });
      setDraft("");
      if (isFirstMessage) {
        toast({
          title: "Message sent — customer notified",
          description: "We'll unlock their contact info as soon as they accept.",
        });
      }
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    }
  };

  const customer = conv?.gcn_customers as any;
  const address = customer?.property_address;
  const cityState = address ? [address.city, address.state].filter(Boolean).join(", ") : (broadcast?.service_area ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Message {customerFirst} · {trade}</DialogTitle>
          <DialogDescription>
            {consent
              ? "Customer accepted — full contact details unlocked."
              : declined
              ? "Customer declined further contact. Please don't message again."
              : "Contact info is masked until the customer accepts your intro message."}
          </DialogDescription>
        </DialogHeader>

        {/* Customer card */}
        <div className="rounded-[10px] border p-3 text-sm" style={{ background: "var(--r-cream-2)", borderColor: "var(--r-line)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{consent ? customer?.name : `${customerFirst} (last name hidden)`}</div>
              <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "var(--r-muted)" }}>
                <MapPin className="w-3 h-3" /> {consent ? (address?.full ?? cityState) : cityState || "Area"}
              </div>
              <div className="flex items-center gap-3 text-xs mt-2" style={{ color: "var(--r-muted)" }}>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {consent ? customer?.email : <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> hidden</span>}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {consent ? (customer?.phone ?? "—") : <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> hidden</span>}
                </span>
              </div>
            </div>
            <Pill variant={consent ? "green" : declined ? "rose" : "amber"}>
              {consent ? "Accepted" : declined ? "Declined" : "Pending consent"}
            </Pill>
          </div>
          {broadcast?.notes && (
            <div className="text-xs italic mt-2" style={{ color: "var(--r-muted)" }}>"{broadcast.notes}"</div>
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto rounded-[10px] border p-3 space-y-2 min-h-[200px]" style={{ borderColor: "var(--r-line)" }}>
          {(messages ?? []).length === 0 ? (
            <div className="text-xs text-center py-6" style={{ color: "var(--r-muted)" }}>
              No messages yet. Send a friendly intro below.
            </div>
          ) : (
            (messages ?? []).map((m: any) => {
              const sys = m.sender_type === "system";
              const mine = m.sender_type === "contractor";
              return (
                <div key={m.id} className={`flex ${sys ? "justify-center" : mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-[10px] text-sm"
                    style={{
                      background: sys ? "transparent" : mine ? "var(--r-green-deep)" : "var(--r-paper)",
                      color: sys ? "var(--r-muted)" : mine ? "#fff" : "inherit",
                      border: sys ? "1px dashed var(--r-line)" : "1px solid var(--r-line)",
                      fontStyle: sys ? "italic" : "normal",
                      fontSize: sys ? 12 : 14,
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        {!declined ? (
          <div className="space-y-2">
            {isFirstMessage && (
              <label className="flex items-start gap-2 text-xs" style={{ color: "var(--r-muted)" }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
                <span>
                  I agree to GCN messaging rules: be professional, no spam, no off-platform contact attempts before consent. GCN may review messages for quality.
                </span>
              </label>
            )}
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={isFirstMessage ? 5 : 3}
              maxLength={1000}
              placeholder={isFirstMessage ? "Edit your intro message..." : "Type a message..."}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: "var(--r-muted)" }}>{draft.length}/1000</div>
              <GreenButton3D onClick={onSend} disabled={send.isPending || !draft.trim() || (isFirstMessage && !agreed)}>
                {send.isPending ? "Sending..." : isFirstMessage ? (<><Send className="w-4 h-4" /> Send & notify customer</>) : (<><Send className="w-4 h-4" /> Send</>)}
              </GreenButton3D>
            </div>
            {isFirstMessage && (
              <div className="flex items-start gap-2 text-xs p-2 rounded-[8px]" style={{ background: "var(--r-cream-2)", color: "var(--r-muted)" }}>
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>The customer will receive an email with your intro. They can accept (unlocks their contact info) or decline.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm p-3 rounded-[10px]" style={{ background: "var(--r-cream-2)", color: "var(--r-muted)" }}>
            <CheckCircle2 className="w-4 h-4" /> This conversation is closed. Please respect the customer's decision.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
