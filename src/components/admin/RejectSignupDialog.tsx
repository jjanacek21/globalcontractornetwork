import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";

const REASONS = [
  { value: "missing_license", label: "License information missing or invalid" },
  { value: "incomplete_documents", label: "Incomplete documents or credentials" },
  { value: "duplicate_account", label: "Duplicate or existing account" },
  { value: "credentials_unverifiable", label: "Credentials could not be verified" },
  { value: "other", label: "Other (explain in notes)" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contractor: { id: string; company_name: string; company_id: string | null } | null;
  onRejected: () => void;
}

export function RejectSignupDialog({ open, onOpenChange, contractor, onRejected }: Props) {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const reset = () => { setReason(""); setNotes(""); setConfirm(false); };

  const handleSubmit = async () => {
    if (!contractor || !reason || notes.trim().length < 10 || !confirm) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        subscription_status: "rejected",
        rejection_reason: reason,
        rejection_notes: notes.trim(),
        rejected_at: new Date().toISOString(),
        rejected_by: user?.id ?? null,
      };

      const { error } = await supabase
        .from("contractor_profiles")
        .update(payload)
        .eq("id", contractor.id);
      if (error) throw error;

      if (contractor.company_id) {
        await supabase.from("companies").update({
          verification_status: "rejected",
          rejection_reason: reason,
          rejection_notes: notes.trim(),
          rejected_at: payload.rejected_at,
          rejected_by: payload.rejected_by,
        }).eq("id", contractor.company_id);
      }

      try {
        await supabase.functions.invoke("notify-signup-rejected", {
          body: { contractorId: contractor.id, reason, notes: notes.trim() },
        });
      } catch (e) {
        console.error("Email notification failed:", e);
      }

      toast({
        title: "Application Rejected",
        description: `${contractor.company_name} has been notified by email.`,
      });
      reset();
      onOpenChange(false);
      onRejected();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to reject", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reject Application
          </DialogTitle>
          <DialogDescription>
            {contractor?.company_name} — the applicant will receive an email with the reason and notes below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes to applicant <span className="text-destructive">*</span></Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain what's missing or what they can do to reapply (min 10 characters)..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">{notes.trim().length}/10 minimum characters</p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="confirm-reject" checked={confirm} onCheckedChange={(c) => setConfirm(!!c)} />
            <Label htmlFor="confirm-reject" className="text-sm font-normal cursor-pointer">
              I understand this will email the applicant and mark the application as rejected.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !reason || notes.trim().length < 10 || !confirm}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject & Notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
