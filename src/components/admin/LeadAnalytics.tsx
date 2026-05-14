import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Legend 
} from "recharts";
import { 
  TrendingUp, Users, Building2, DollarSign, Calendar, Target, 
  Clock, Percent, MapPin, BarChart3 
} from "lucide-react";
import { format, subDays, startOfDay, isAfter } from "date-fns";

interface UnifiedLead {
  id: string;
  source: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  createdAt: string;
  details: string;
}

interface LeadAnalyticsProps {
  leads: UnifiedLead[];
  rawLeadsData?: {
    coatingLeads?: any[];
    windowLeads?: any[];
    supplementLeads?: any[];
    roofingConsultations?: any[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

export function LeadAnalytics({ leads, rawLeadsData }: LeadAnalyticsProps) {
  // Lead Source Distribution
  const sourceDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(lead => {
      counts[lead.source] = (counts[lead.source] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Status Distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(lead => {
      const status = lead.status || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Leads Over Time (last 30 days)
  const leadsOverTime = useMemo(() => {
    const last30Days: Record<string, number> = {};
    const today = new Date();
    
    // Initialize all days
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(today, i), 'MMM d');
      last30Days[date] = 0;
    }
    
    // Count leads per day
    leads.forEach(lead => {
      if (!lead.createdAt) return;
      const leadDate = new Date(lead.createdAt);
      const thirtyDaysAgo = subDays(today, 30);
      
      if (isAfter(leadDate, thirtyDaysAgo)) {
        const dateKey = format(leadDate, 'MMM d');
        if (last30Days[dateKey] !== undefined) {
          last30Days[dateKey]++;
        }
      }
    });
    
    return Object.entries(last30Days).map(([date, count]) => ({ date, count }));
  }, [leads]);

  // Customer Type Analysis
  const customerTypeAnalysis = useMemo(() => {
    const homeownerSources = ['Coating Kings', 'Green Home Improvements', 'Roofing Services', 'Contact Request', 'Prep Your Property'];
    const contractorSources = ['Estimating & Supplementing', 'Permit Queens'];
    
    let homeowners = 0;
    let contractors = 0;
    
    leads.forEach(lead => {
      if (homeownerSources.includes(lead.source)) {
        homeowners++;
      } else if (contractorSources.includes(lead.source)) {
        contractors++;
      }
    });
    
    return [
      { name: 'Homeowners', value: homeowners, icon: Users },
      { name: 'Contractors', value: contractors, icon: Building2 },
    ];
  }, [leads]);

  // Calculate conversion funnel
  const conversionFunnel = useMemo(() => {
    const newLeads = leads.filter(l => l.status === 'new' || !l.status).length;
    const contacted = leads.filter(l => ['contacted', 'in_progress', 'in_review'].includes(l.status || '')).length;
    const scheduled = leads.filter(l => ['scheduled', 'pending', 'negotiating'].includes(l.status || '')).length;
    const completed = leads.filter(l => ['completed', 'settled', 'done', 'approved'].includes(l.status || '')).length;
    
    return [
      { stage: 'New', count: newLeads, percentage: 100 },
      { stage: 'Contacted', count: contacted, percentage: leads.length > 0 ? Math.round((contacted / leads.length) * 100) : 0 },
      { stage: 'Scheduled', count: scheduled, percentage: leads.length > 0 ? Math.round((scheduled / leads.length) * 100) : 0 },
      { stage: 'Completed', count: completed, percentage: leads.length > 0 ? Math.round((completed / leads.length) * 100) : 0 },
    ];
  }, [leads]);

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const oneWeekAgo = subDays(new Date(), 7);
    const twoWeeksAgo = subDays(new Date(), 14);
    
    const thisWeek = leads.filter(l => l.createdAt && isAfter(new Date(l.createdAt), oneWeekAgo)).length;
    const lastWeek = leads.filter(l => {
      if (!l.createdAt) return false;
      const date = new Date(l.createdAt);
      return isAfter(date, twoWeeksAgo) && !isAfter(date, oneWeekAgo);
    }).length;
    
    const growth = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
    
    return { thisWeek, lastWeek, growth };
  }, [leads]);

  // Peak hours analysis
  const peakHours = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    
    leads.forEach(lead => {
      if (!lead.createdAt) return;
      const hour = new Date(lead.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    return sortedHours.map(([hour]) => {
      const h = parseInt(hour);
      return h > 12 ? `${h - 12} PM` : h === 0 ? '12 AM' : `${h} AM`;
    }).join(', ') || 'N/A';
  }, [leads]);

  // Day of week analysis
  const dayOfWeekAnalysis = useMemo(() => {
    const dayCounts: Record<string, number> = {
      'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
    };
    
    leads.forEach(lead => {
      if (!lead.createdAt) return;
      const day = format(new Date(lead.createdAt), 'EEE');
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    return Object.entries(dayCounts).map(([day, count]) => ({ day, count }));
  }, [leads]);

  // Conversion rate
  const conversionRate = useMemo(() => {
    const completed = leads.filter(l => ['completed', 'settled', 'done', 'approved'].includes(l.status || '')).length;
    return leads.length > 0 ? Math.round((completed / leads.length) * 100) : 0;
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-bold">{leads.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold">{weeklyStats.thisWeek}</p>
                {weeklyStats.growth !== 0 && (
                  <p className={`text-xs ${weeklyStats.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {weeklyStats.growth > 0 ? '+' : ''}{weeklyStats.growth}% from last week
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold">{conversionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Percent className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lead Sources</p>
                <p className="text-3xl font-bold">{sourceDistribution.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Sources</CardTitle>
            <CardDescription>Distribution by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leads Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads Over Time</CardTitle>
            <CardDescription>Last 30 days trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Breakdown</CardTitle>
            <CardDescription>Leads by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Day of Week Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads by Day</CardTitle>
            <CardDescription>When leads come in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Type & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Types</CardTitle>
            <CardDescription>Homeowners vs Contractors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerTypeAnalysis.map((type, i) => {
                const Icon = type.icon;
                const percentage = leads.length > 0 ? Math.round((type.value / leads.length) * 100) : 0;
                return (
                  <div key={type.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS[i]}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: COLORS[i] }} />
                      </div>
                      <div>
                        <p className="font-medium">{type.name}</p>
                        <p className="text-sm text-muted-foreground">{type.value} leads</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{percentage}%</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversion Funnel</CardTitle>
            <CardDescription>Lead progression stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnel.map((stage, i) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{stage.stage}</span>
                    <span className="font-medium">{stage.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${stage.percentage}%`,
                        backgroundColor: COLORS[i % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Insights</CardTitle>
            <CardDescription>Key patterns & metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Peak Hours</p>
                  <p className="font-medium">{peakHours}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Busiest Day</p>
                  <p className="font-medium">
                    {dayOfWeekAnalysis.reduce((max, day) => day.count > max.count ? day : max, { day: 'N/A', count: 0 }).day}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Source</p>
                  <p className="font-medium">
                    {sourceDistribution.reduce((max, s) => s.value > max.value ? s : max, { name: 'N/A', value: 0 }).name}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
