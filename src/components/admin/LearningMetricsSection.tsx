import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Brain, Package, MapPin, BookOpen, TrendingUp, RefreshCw, Sparkles
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

interface LearningMetrics {
  totalProductsExtracted: number;
  totalMappingsLearned: number;
  totalRulesDiscovered: number;
  extractionTrend: { date: string; products: number; mappings: number; rules: number }[];
  topJurisdictions: { county: string; products: number; mappings: number; rules: number }[];
  knowledgeBaseStats: {
    totalProductApprovals: number;
    totalFieldMappings: number;
    totalJurisdictionRules: number;
  };
}

export default function LearningMetricsSection() {
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Fetch aggregated learning metrics from permit_packet_training
      const { data: trainingData, error: trainingError } = await supabase
        .from("permit_packet_training")
        .select("created_at, products_extracted, mappings_learned, rules_discovered, county, processing_status")
        .eq("processing_status", "completed");

      if (trainingError) throw trainingError;

      // Calculate totals
      const totalProductsExtracted = trainingData?.reduce((acc, t) => acc + (t.products_extracted || 0), 0) || 0;
      const totalMappingsLearned = trainingData?.reduce((acc, t) => acc + (t.mappings_learned || 0), 0) || 0;
      const totalRulesDiscovered = trainingData?.reduce((acc, t) => acc + (t.rules_discovered || 0), 0) || 0;

      // Group by date for trend
      const dateMap = new Map<string, { products: number; mappings: number; rules: number }>();
      trainingData?.forEach(t => {
        const date = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const existing = dateMap.get(date) || { products: 0, mappings: 0, rules: 0 };
        existing.products += t.products_extracted || 0;
        existing.mappings += t.mappings_learned || 0;
        existing.rules += t.rules_discovered || 0;
        dateMap.set(date, existing);
      });

      // Convert to array and take last 14 days
      const extractionTrend = Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .slice(-14);

      // Group by county
      const countyMap = new Map<string, { products: number; mappings: number; rules: number }>();
      trainingData?.forEach(t => {
        const county = t.county || "Unknown";
        const existing = countyMap.get(county) || { products: 0, mappings: 0, rules: 0 };
        existing.products += t.products_extracted || 0;
        existing.mappings += t.mappings_learned || 0;
        existing.rules += t.rules_discovered || 0;
        countyMap.set(county, existing);
      });

      const topJurisdictions = Array.from(countyMap.entries())
        .map(([county, data]) => ({ county, ...data }))
        .sort((a, b) => (b.products + b.mappings + b.rules) - (a.products + a.mappings + a.rules))
        .slice(0, 8);

      // Fetch knowledge base counts
      const [productApprovalsResult, fieldMappingsResult, jurisdictionRulesResult] = await Promise.all([
        supabase.from("product_approvals").select("id", { count: "exact", head: true }),
        supabase.from("permit_field_mappings").select("id", { count: "exact", head: true }),
        supabase.from("building_department_rules").select("id", { count: "exact", head: true }),
      ]);

      const knowledgeBaseStats = {
        totalProductApprovals: productApprovalsResult.count || 0,
        totalFieldMappings: fieldMappingsResult.count || 0,
        totalJurisdictionRules: jurisdictionRulesResult.count || 0,
      };

      setMetrics({
        totalProductsExtracted,
        totalMappingsLearned,
        totalRulesDiscovered,
        extractionTrend,
        topJurisdictions,
        knowledgeBaseStats,
      });
    } catch (error) {
      console.error("Error fetching learning metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              AI Learning Metrics
              <Sparkles className="h-4 w-4 text-amber-500" />
            </h3>
            <p className="text-sm text-muted-foreground">
              Knowledge extracted from training packets
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchMetrics}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Extraction Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Products Extracted</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-blue-600">{metrics.totalProductsExtracted}</p>
                  <Badge variant="secondary" className="text-xs">
                    {metrics.knowledgeBaseStats.totalProductApprovals} in DB
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Field Mappings</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-emerald-600">{metrics.totalMappingsLearned}</p>
                  <Badge variant="secondary" className="text-xs">
                    {metrics.knowledgeBaseStats.totalFieldMappings} in DB
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/5 to-transparent border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <MapPin className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Jurisdiction Rules</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-orange-600">{metrics.totalRulesDiscovered}</p>
                  <Badge variant="secondary" className="text-xs">
                    {metrics.knowledgeBaseStats.totalJurisdictionRules} in DB
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Learning Over Time
            </CardTitle>
            <CardDescription>Knowledge extracted from recent uploads</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.extractionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={metrics.extractionTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8 }}
                    formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="products" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Products"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mappings" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Mappings"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rules" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Rules"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No learning data yet</p>
                  <p className="text-sm">Upload training packets to see metrics</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Jurisdictions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Top Learning Jurisdictions
            </CardTitle>
            <CardDescription>Counties with the most knowledge extracted</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.topJurisdictions.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metrics.topJurisdictions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    dataKey="county" 
                    type="category" 
                    width={90} 
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8 }}
                    formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Legend />
                  <Bar dataKey="products" fill="#3b82f6" name="Products" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="mappings" fill="#10b981" name="Mappings" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="rules" fill="#f97316" name="Rules" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No jurisdiction data yet</p>
                  <p className="text-sm">Upload training packets to see coverage</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
