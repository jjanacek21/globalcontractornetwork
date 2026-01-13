import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Target, TrendingUp, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TrainingSession {
  id: string;
  created_at: string;
  address: string;
  property_type: string | null;
  ai_estimated_sqft: number | null;
  ai_confidence: string | null;
  ai_error_percent: number | null;
  ai_response_time_ms: number | null;
  ai_roof_shape: string | null;
  final_accepted_sqft: number | null;
  ground_truth_sqft: number | null;
  user_adjusted_sqft: number | null;
  is_usable_for_training: boolean | null;
}

interface Stats {
  totalSessions: number;
  verifiedSessions: number;
  averageError: number;
  modelAccuracy: number;
  avgResponseTime: number;
  usableSessions: number;
}

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function AITrainingAnalytics() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    verifiedSessions: 0,
    averageError: 0,
    modelAccuracy: 0,
    avgResponseTime: 0,
    usableSessions: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_training_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const sessionsData = (data || []) as TrainingSession[];
      setSessions(sessionsData);

      // Calculate stats
      const total = sessionsData.length;
      const verified = sessionsData.filter((s) => s.ground_truth_sqft !== null).length;
      const usable = sessionsData.filter((s) => s.is_usable_for_training !== false).length;

      const withError = sessionsData.filter((s) => s.ai_error_percent !== null);
      const avgError = withError.length > 0
        ? withError.reduce((sum, s) => sum + Math.abs(s.ai_error_percent || 0), 0) / withError.length
        : 0;

      const accurate = withError.filter((s) => Math.abs(s.ai_error_percent || 0) <= 10).length;
      const accuracy = withError.length > 0 ? (accurate / withError.length) * 100 : 0;

      const withResponseTime = sessionsData.filter((s) => s.ai_response_time_ms !== null);
      const avgResponse = withResponseTime.length > 0
        ? withResponseTime.reduce((sum, s) => sum + (s.ai_response_time_ms || 0), 0) / withResponseTime.length
        : 0;

      setStats({
        totalSessions: total,
        verifiedSessions: verified,
        averageError: avgError,
        modelAccuracy: accuracy,
        avgResponseTime: avgResponse,
        usableSessions: usable,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Error distribution data
  const getErrorDistribution = () => {
    const buckets = [
      { range: "< 5%", min: 0, max: 5, count: 0 },
      { range: "5-10%", min: 5, max: 10, count: 0 },
      { range: "10-15%", min: 10, max: 15, count: 0 },
      { range: "15-20%", min: 15, max: 20, count: 0 },
      { range: "> 20%", min: 20, max: Infinity, count: 0 },
    ];

    sessions.forEach((s) => {
      if (s.ai_error_percent !== null) {
        const absError = Math.abs(s.ai_error_percent);
        const bucket = buckets.find((b) => absError >= b.min && absError < b.max);
        if (bucket) bucket.count++;
      }
    });

    return buckets.map((b) => ({ name: b.range, count: b.count }));
  };

  // Error by property type
  const getErrorByPropertyType = () => {
    const types: { [key: string]: { total: number; count: number } } = {};
    
    sessions.forEach((s) => {
      if (s.ai_error_percent !== null && s.property_type) {
        const type = s.property_type;
        if (!types[type]) types[type] = { total: 0, count: 0 };
        types[type].total += Math.abs(s.ai_error_percent);
        types[type].count++;
      }
    });

    return Object.entries(types).map(([name, data]) => ({
      name,
      avgError: data.count > 0 ? (data.total / data.count).toFixed(1) : 0,
      count: data.count,
    }));
  };

  // Confidence accuracy data
  const getConfidenceAccuracy = () => {
    const levels: { [key: string]: { errors: number[]; count: number } } = {
      high: { errors: [], count: 0 },
      medium: { errors: [], count: 0 },
      low: { errors: [], count: 0 },
    };

    sessions.forEach((s) => {
      if (s.ai_confidence && s.ai_error_percent !== null) {
        const level = s.ai_confidence.toLowerCase();
        if (levels[level]) {
          levels[level].errors.push(Math.abs(s.ai_error_percent));
          levels[level].count++;
        }
      }
    });

    return Object.entries(levels).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      avgError: data.errors.length > 0
        ? (data.errors.reduce((a, b) => a + b, 0) / data.errors.length).toFixed(1)
        : 0,
      count: data.count,
    }));
  };

  // User adjustment patterns
  const getAdjustmentPatterns = () => {
    let overEstimated = 0;
    let underEstimated = 0;
    let noAdjustment = 0;
    let totalAdjustment = 0;
    let adjustmentCount = 0;

    sessions.forEach((s) => {
      if (s.ai_estimated_sqft && s.final_accepted_sqft) {
        const diff = s.final_accepted_sqft - s.ai_estimated_sqft;
        if (Math.abs(diff) < 10) {
          noAdjustment++;
        } else if (diff > 0) {
          underEstimated++;
          totalAdjustment += Math.abs(diff);
          adjustmentCount++;
        } else {
          overEstimated++;
          totalAdjustment += Math.abs(diff);
          adjustmentCount++;
        }
      }
    });

    return {
      distribution: [
        { name: "AI Over-estimated", value: overEstimated, color: "#EF4444" },
        { name: "AI Under-estimated", value: underEstimated, color: "#F59E0B" },
        { name: "No Adjustment", value: noAdjustment, color: "#10B981" },
      ],
      avgAdjustment: adjustmentCount > 0 ? totalAdjustment / adjustmentCount : 0,
    };
  };

  // Sessions over time (last 30 days)
  const getSessionsOverTime = () => {
    const days: { [key: string]: number } = {};
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      days[key] = 0;
    }

    sessions.forEach((s) => {
      const date = s.created_at.split("T")[0];
      if (days[date] !== undefined) days[date]++;
    });

    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sessions: count,
    }));
  };

  // Roof type breakdown
  const getRoofTypeBreakdown = () => {
    const types: { [key: string]: { errors: number[]; adjustments: number[]; count: number } } = {};

    sessions.forEach((s) => {
      const roofType = s.ai_roof_shape || "Unknown";
      if (!types[roofType]) types[roofType] = { errors: [], adjustments: [], count: 0 };
      types[roofType].count++;
      
      if (s.ai_error_percent !== null) {
        types[roofType].errors.push(Math.abs(s.ai_error_percent));
      }
      if (s.ai_estimated_sqft && s.final_accepted_sqft) {
        types[roofType].adjustments.push(s.final_accepted_sqft - s.ai_estimated_sqft);
      }
    });

    return Object.entries(types)
      .map(([name, data]) => ({
        roofType: name,
        sessions: data.count,
        avgError: data.errors.length > 0
          ? (data.errors.reduce((a, b) => a + b, 0) / data.errors.length).toFixed(1)
          : "N/A",
        avgAdjustment: data.adjustments.length > 0
          ? Math.round(data.adjustments.reduce((a, b) => a + b, 0) / data.adjustments.length)
          : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  };

  const adjustmentData = getAdjustmentPatterns();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Total Sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalSessions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.verifiedSessions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Avg Error
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats.averageError.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Accuracy (±10%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.modelAccuracy.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(stats.avgResponseTime / 1000).toFixed(1)}s</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Usable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{stats.usableSessions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Error Distribution</CardTitle>
            <CardDescription>How often AI estimates fall within each error range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getErrorDistribution()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence vs Accuracy */}
        <Card>
          <CardHeader>
            <CardTitle>Confidence vs Accuracy</CardTitle>
            <CardDescription>Average error by AI confidence level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getConfidenceAccuracy()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => [`${value}%`, "Avg Error"]} />
                <Bar dataKey="avgError" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error by Property Type */}
        <Card>
          <CardHeader>
            <CardTitle>Error by Property Type</CardTitle>
            <CardDescription>Average error for commercial vs residential</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getErrorByPropertyType()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, "Avg Error"]} />
                <Bar dataKey="avgError" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Adjustment Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>User Adjustment Patterns</CardTitle>
            <CardDescription>
              How often users modify AI estimates (Avg adjustment: {adjustmentData.avgAdjustment.toFixed(0)} sqft)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={adjustmentData.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {adjustmentData.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions Over Time</CardTitle>
          <CardDescription>Daily session count (last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={getSessionsOverTime()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sessions" stroke="#8B5CF6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Roof Type Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Roof Type</CardTitle>
          <CardDescription>Accuracy breakdown for each roof shape</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roof Type</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Avg AI Error</TableHead>
                <TableHead className="text-right">Avg User Adjustment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getRoofTypeBreakdown().slice(0, 10).map((row) => (
                <TableRow key={row.roofType}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">{row.roofType}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{row.sessions}</TableCell>
                  <TableCell className="text-right">
                    {row.avgError === "N/A" ? (
                      <span className="text-muted-foreground">N/A</span>
                    ) : (
                      <span className={Number(row.avgError) > 15 ? "text-red-600" : "text-green-600"}>
                        {row.avgError}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={row.avgAdjustment > 0 ? "text-amber-600" : row.avgAdjustment < 0 ? "text-blue-600" : ""}>
                      {row.avgAdjustment > 0 ? "+" : ""}{row.avgAdjustment} sqft
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
