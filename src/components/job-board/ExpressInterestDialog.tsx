import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import type { JobRequest } from '@/hooks/useJobBoard';

interface ExpressInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobRequest;
  onSubmit: (
    message: string,
    proposedAmount?: number,
    estimatedDuration?: string,
    availableStartDate?: string
  ) => Promise<void>;
}

export function ExpressInterestDialog({
  open,
  onOpenChange,
  job,
  onSubmit,
}: ExpressInterestDialogProps) {
  const [message, setMessage] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [availableStartDate, setAvailableStartDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Validate proposed amount is within range if provided
    if (proposedAmount) {
      const amount = parseFloat(proposedAmount);
      if (job.budget_min && amount < job.budget_min * 0.5) {
        toast.error(`Proposed amount must be at least 50% of minimum budget ($${(job.budget_min * 0.5).toLocaleString()})`);
        return;
      }
      if (job.budget_max && amount > job.budget_max * 1.5) {
        toast.error(`Proposed amount cannot exceed 150% of maximum budget ($${(job.budget_max * 1.5).toLocaleString()})`);
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit(
        message,
        proposedAmount ? parseFloat(proposedAmount) : undefined,
        estimatedDuration || undefined,
        availableStartDate || undefined
      );
      toast.success('Interest submitted successfully!');
      // Reset form
      setMessage('');
      setProposedAmount('');
      setEstimatedDuration('');
      setAvailableStartDate('');
    } catch (error) {
      console.error('Error submitting interest:', error);
      toast.error('Failed to submit interest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const budgetHint = () => {
    if (job.budget_min && job.budget_max) {
      return `Homeowner's budget: $${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`;
    }
    if (job.budget_min) return `Minimum budget: $${job.budget_min.toLocaleString()}`;
    if (job.budget_max) return `Maximum budget: $${job.budget_max.toLocaleString()}`;
    return 'No budget specified';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Express Interest</DialogTitle>
          <DialogDescription>
            Send a message to the homeowner about "{job.title}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your Message *</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself and explain why you're a good fit for this job..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposedAmount">Proposed Amount (optional)</Label>
            <Input
              id="proposedAmount"
              type="number"
              placeholder="Enter your quote"
              value={proposedAmount}
              onChange={(e) => setProposedAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{budgetHint()}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedDuration">Estimated Duration (optional)</Label>
            <Input
              id="estimatedDuration"
              placeholder="e.g., 2-3 days, 1 week"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availableStartDate">Available Start Date (optional)</Label>
            <Input
              id="availableStartDate"
              type="date"
              value={availableStartDate}
              onChange={(e) => setAvailableStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Interest
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
