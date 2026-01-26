import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, CheckCircle, Clock, AlertCircle, Target, 
  TrendingUp, Building, Zap, RefreshCw, Award
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import LearningMetricsSection from "./LearningMetricsSection";

interface AnalyticsData {
  totalSamples: number;
  completedSamples: number;
  failedSamples: number;
  pendingSamples: number;
  processingSamples: number;
  successRate: number;
  averageQuality: number;
  verifiedCount: number;
  totalUsage: number;
  byCounty: { county: string; count: number; completed: number }[];
  byTrade: { trade: string; count: number }[];
  byStatus: { status: string; count: number; color: string }[];
  recentActivity: { date: string; uploads: number; completed: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  pending: "#f59e0b",
  processing: "#3b82f6",
  failed: "#ef4444",
  queued: "#6b7280",
};

export default function PermitTrainingAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: samples, error } = await supabase
        .from("permit_packet_training")
        .select("id, county, trade_type, processing_status, quality_score, admin_verified, training_usage_count, created_at");

      if (error) throw error;

      if (!samples || samples.length === 0) {
        setData({
          totalSamples: 0,
          completedSamples: 0,
          failedSamples: 0,
          pendingSamples: 0,
          processingSamples: 0,
          successRate: 0,
          averageQuality: 0,
          verifiedCount: 0,
          totalUsage: 0,
          byCounty: [],
          byTrade: [],
          byStatus: [],
          recentActivity: [],
        });
        setLoading(false);
        return;
      }

      // Calculate stats
      const totalSamples = samples.length;
      const completedSamples = samples.filter(s => s.processing_status === "completed").length;
      const failedSamples = samples.filter(s => s.processing_status === "failed").length;
      const pendingSamples = samples.filter(s => s.processing_status === "pending" || s.processing_status === "queued").length;
      const processingSamples = samples.filter(s => s.processing_status === "processing").length;
      const successRate = totalSamples > 0 ? (completedSamples / (completedSamples + failedSamples || 1)) * 100 : 0;
      
      const qualityScores = samples
        .filter(s => s.quality_score !== null)
        .map(s => s.quality_score as number);
      const averageQuality = qualityScores.length > 0 
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
        : 0;
      
      const verifiedCount = samples.filter(s => s.admin_verified).length;
      const totalUsage = samples.reduce((acc, s) => acc + (s.training_usage_count || 0), 0);

      // Group by county
      const countyMap = new Map<string, { count: number; completed: number }>();
      samples.forEach(s => {
        const county = s.county || "Unknown";
        const existing = countyMap.get(county) || { count: 0, completed: 0 };
        existing.count++;
        if (s.processing_status === "completed") existing.completed++;
        countyMap.set(county, existing);
      });
      const byCounty = Array.from(countyMap.entries())
        .map(([county, data]) => ({ county, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Group by trade
      const tradeMap = new Map<string, number>();
      samples.forEach(s => {
        const trade = s.trade_type || "Unknown";
        tradeMap.set(trade, (tradeMap.get(trade) || 0) + 1);
      });
      const byTrade = Array.from(tradeMap.entries())
        .map(([trade, count]) => ({ trade: trade.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()), count }))
        .sort((a, b) => b.count - a.count);

      // Group by status
      const statusMap = new Map<string, number>();
      samples.forEach(s => {
        const status = s.processing_status || "pending";
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });
      const byStatus = Array.from(statusMap.entries())
        .map(([status, count]) => ({ 
          status: status.charAt(0).toUpperCase() + status.slice(1), 
          count,
          color: STATUS_COLORS[status] || "#6b7280"
        }));

      setData({
        totalSamples,
        completedSamples,
        failedSamples,
        pendingSamples,
        processingSamples,
        successRate,
        averageQuality,
        verifiedCount,
        totalUsage,
        byCounty,
        byTrade,
        byStatus,
        recentActivity: [],
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Training Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            AI detection performance and training sample metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Samples</p>
                <p className="text-2xl font-bold">{data.totalSamples}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{data.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Quality</p>
                <p className="text-2xl font-bold text-amber-600">
                  {(data.averageQuality * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-purple-600">{data.verifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/5 to-transparent border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Zap className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold text-cyan-600">{data.totalUsage}x</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown Mini Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Completed</span>
            <Badge variant="secondary" className="ml-auto">{data.completedSamples}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Pending</span>
            <Badge variant="secondary" className="ml-auto">{data.pendingSamples}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Processing</span>
            <Badge variant="secondary" className="ml-auto">{data.processingSamples}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">Failed</span>
            <Badge variant="secondary" className="ml-auto">{data.failedSamples}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Samples by County */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Samples by Jurisdiction</CardTitle>
            <CardDescription>Training samples distribution by county</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byCounty.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.byCounty} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="county" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [value, name === "count" ? "Total" : "Completed"]}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Total" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processing Status</CardTitle>
            <CardDescription>Current status distribution of all samples</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, count }) => `${status}: ${count}`}
                    labelLine={false}
                  >
                    {data.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Samples"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trade Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Samples by Trade Type</CardTitle>
          <CardDescription>Distribution of training samples across different permit trades</CardDescription>
        </CardHeader>
        <CardContent>
          {data.byTrade.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {data.byTrade.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border"
                >
                  <span className="font-medium">{item.trade}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No trade data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Metrics Section */}
      <div className="border-t pt-6">
        <LearningMetricsSection />
      </div>
    </div>
  );
}
