import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageSquare, ClipboardList, Calendar, MapPin, DollarSign, Home } from 'lucide-react';
import { format } from 'date-fns';
import { HomeownerSubmissions } from '@/hooks/useHomeownerSubmissions';

interface SubmissionsListProps {
  submissions: HomeownerSubmissions;
  loading: boolean;
}

export function SubmissionsList({ submissions, loading }: SubmissionsListProps) {
  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600';
      case 'contacted': return 'bg-blue-500/10 text-blue-600';
      case 'scheduled': return 'bg-purple-500/10 text-purple-600';
      case 'completed': return 'bg-green-500/10 text-green-600';
      case 'cancelled': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          My Submissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading submissions...</div>
        ) : (
          <Tabs defaultValue="quotes" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="quotes">
                Coating Quotes ({submissions.coatingLeads.length})
              </TabsTrigger>
              <TabsTrigger value="windows">
                Window Quotes ({submissions.windowLeads?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="contact">
                Contact ({submissions.contactRequests.length})
              </TabsTrigger>
              <TabsTrigger value="projects">
                Projects ({submissions.projects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quotes" className="space-y-3">
              {submissions.coatingLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No quote requests yet</p>
                </div>
              ) : (
                submissions.coatingLeads.map(lead => (
                  <div 
                    key={lead.id}
                    className="p-4 rounded-lg bg-muted/30 border"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{lead.coating_type} - {lead.roof_type}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {lead.property_address}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
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

            <TabsContent value="windows" className="space-y-3">
              {!submissions.windowLeads?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Home className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No window quote requests yet</p>
                </div>
              ) : (
                submissions.windowLeads.map(lead => (
                  <div 
                    key={lead.id}
                    className="p-4 rounded-lg bg-muted/30 border"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">Window Quote</h4>
                        {lead.property_address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {lead.property_address}
                          </p>
                        )}
                        {lead.total_windows && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {lead.total_windows} windows
                          </p>
                        )}
                        {(lead.estimate_low || lead.estimate_high) && (
                          <p className="text-sm text-primary flex items-center gap-1 mt-1">
                            <DollarSign className="h-3 w-3" />
                            ${lead.estimate_low?.toLocaleString()} - ${lead.estimate_high?.toLocaleString()}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
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
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No contact requests yet</p>
                </div>
              ) : (
                submissions.contactRequests.map(request => (
                  <div 
                    key={request.id}
                    className="p-4 rounded-lg bg-muted/30 border"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{request.name}</h4>
                        {request.message && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{request.message}</p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
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
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No projects yet</p>
                </div>
              ) : (
                submissions.projects.map(project => (
                  <div 
                    key={project.id}
                    className="p-4 rounded-lg bg-muted/30 border"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{project.service_type}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {project.property_address}
                        </p>
                        {(project.ai_estimate_low || project.official_quote) && (
                          <p className="text-sm text-primary flex items-center gap-1 mt-1">
                            <DollarSign className="h-3 w-3" />
                            {project.official_quote 
                              ? `$${project.official_quote.toLocaleString()} (quoted)`
                              : `$${project.ai_estimate_low?.toLocaleString()} - $${project.ai_estimate_high?.toLocaleString()} (estimate)`
                            }
                          </p>
                        )}
                        {project.assigned_contractor && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Contractor: {project.assigned_contractor.company_name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
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
