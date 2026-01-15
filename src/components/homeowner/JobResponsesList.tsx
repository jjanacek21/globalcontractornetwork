import { useJobResponses } from '@/hooks/useJobResponses';
import { ContractorResponseCard } from './ContractorResponseCard';
import { Loader2 } from 'lucide-react';

interface JobResponsesListProps {
  jobId: string;
}

export function JobResponsesList({ jobId }: JobResponsesListProps) {
  const { responses, loading, updateResponseStatus } = useJobResponses(jobId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">No responses yet. Contractors will see your job and can submit proposals.</p>
      </div>
    );
  }

  // Sort by status (pending first), then by created_at
  const sortedResponses = [...responses].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">
        Contractor Responses ({responses.length})
      </h4>
      {sortedResponses.map((response) => (
        <ContractorResponseCard
          key={response.id}
          response={response}
          onAccept={() => updateResponseStatus(response.id, 'accepted')}
          onDecline={() => updateResponseStatus(response.id, 'declined')}
        />
      ))}
    </div>
  );
}
