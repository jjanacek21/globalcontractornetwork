import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageSquare, ClipboardList, Calendar, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { HomeownerSubmissions } from '@/hooks/useHomeownerSubmissions';

interface SubmissionsListProps {
  submissions: HomeownerSubmissions;
  loading: boolean;
}

export function SubmissionsList({ submissions, loading }: SubmissionsListProps) {
  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'contacted': return 'bg-blue-500/20 text-blue-400';
      case 'scheduled': return 'bg-purple-500/20 text-purple-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-[hsl(45,100%,51%)]" />
          My Submissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-white/60">Loading submissions...</div>
        ) : (
          <Tabs defaultValue="quotes" className="space-y-4">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="quotes" className="data-[state=active]:bg-[hsl(45,100%,51%)] data-[state=active]:text-black">
                Quote Requests ({submissions.coatingLeads.length})
              </TabsTrigger>
              <TabsTrigger value="contact" className="data-[state=active]:bg-[hsl(45,100%,51%)] data-[state=active]:text-black">
                Contact ({submissions.contactRequests.length})
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-[hsl(45,100%,51%)] data-[state=active]:text-black">
                Projects ({submissions.projects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quotes" className="space-y-3">
              {submissions.coatingLeads.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No quote requests yet</p>
                </div>
              ) : (
                submissions.coatingLeads.map(lead => (
                  <div 
                    key={lead.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{lead.coating_type} - {lead.roof_type}</h4>
                        <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {lead.property_address}
                        </p>
                        <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(lead.created_at)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="contact" className="space-y-3">
              {submissions.contactRequests.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No contact requests yet</p>
                </div>
              ) : (
                submissions.contactRequests.map(request => (
                  <div 
                    key={request.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{request.name}</h4>
                        {request.message && (
                          <p className="text-sm text-white/60 mt-1 line-clamp-2">{request.message}</p>
                        )}
                        <p className="text-sm text-white/60 flex items-center gap-1 mt-2">
                          <Calendar className="h-3 w-3" />
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="projects" className="space-y-3">
              {submissions.projects.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No projects yet</p>
                </div>
              ) : (
                submissions.projects.map(project => (
                  <div 
                    key={project.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{project.service_type}</h4>
                        <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {project.property_address}
                        </p>
                        {(project.ai_estimate_low || project.official_quote) && (
                          <p className="text-sm text-[hsl(45,100%,51%)] flex items-center gap-1 mt-1">
                            <DollarSign className="h-3 w-3" />
                            {project.official_quote 
                              ? `$${project.official_quote.toLocaleString()} (quoted)`
                              : `$${project.ai_estimate_low?.toLocaleString()} - $${project.ai_estimate_high?.toLocaleString()} (estimate)`
                            }
                          </p>
                        )}
                        {project.assigned_contractor && (
                          <p className="text-sm text-white/60 mt-1">
                            Contractor: {project.assigned_contractor.company_name}
                          </p>
                        )}
                        <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(project.created_at)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
