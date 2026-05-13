import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PropertyIQHeader } from "@/components/property-iq/PropertyIQHeader";
import { PropertyIQFooter } from "@/components/property-iq/PropertyIQFooter";
import { MapExplorer } from "@/components/property-iq/MapExplorer";
import { DemoBanner } from "@/components/property-iq/DemoBanner";
import { usePropertyIQDemo, DEMO_PROPERTY_IDS } from "@/hooks/usePropertyIQDemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { usePropertyIQDashboard } from "@/hooks/usePropertyIQ";
import { exportSavedPropertiesCSV } from "@/components/property-iq/ExportUtils";
import { toast } from "sonner";
import {
  Search, FileText, Bookmark, Bell, BarChart3,
  Building2, AlertTriangle, CloudRain, Wifi,
  ExternalLink, Clock, TrendingUp, Map, Download,
} from "lucide-react";

const demoStats = [
  { label: "Total Searches", value: "47", icon: Search, color: "text-primary" },
  { label: "Saved Properties", value: "12", icon: Bookmark, color: "text-cyan-600" },
  { label: "Active Alerts", value: "3", icon: Bell, color: "text-amber-600" },
  { label: "Reports Generated", value: "28", icon: FileText, color: "text-emerald-600" },
];

const recentSearches = [
  { address: "1240 Industrial Blvd, Miami", date: "Mar 11, 2026", results: 1 },
  { address: "8900 NW 33rd Street, Doral", date: "Mar 10, 2026", results: 1 },
  { address: "4520 S Dixie Highway, WPB", date: "Mar 9, 2026", results: 1 },
  { address: "2100 Coral Way, Miami", date: "Mar 8, 2026", results: 3 },
  { address: "7600 Red Road, South Miami", date: "Mar 7, 2026", results: 2 },
];

const alerts = [
  { title: "Roof Critical — 4520 S Dixie Hwy", description: "TPO roof installed 2005, 20+ years old. Replacement urgency: HIGH", severity: "critical" as const, icon: AlertTriangle },
  { title: "New Storm Data Available", description: "NOAA updated storm exposure data for Miami-Dade & Palm Beach counties", severity: "info" as const, icon: CloudRain },
  { title: "Owner Change Detected", description: "8900 NW 33rd Street — new entity filing detected on Sunbiz", severity: "warning" as const, icon: Building2 },
];

const apiConnections = [
  { name: "Property Appraiser", status: "connected", detail: "Miami-Dade, Broward, Palm Beach" },
  { name: "Skip Tracing", status: "connected", detail: "Phone, email, social lookup" },
  { name: "Firecrawl", status: "connected", detail: "Web scraping & enrichment" },
  { name: "Sunbiz / Corp Search", status: "limited", detail: "FL corporate entity search" },
  { name: "NOAA Storm Data", status: "connected", detail: "Historical storm events" },
  { name: "Google Maps", status: "connected", detail: "Geocoding & satellite imagery" },
];

const severityColors = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  info: "bg-primary/10 text-primary border-primary/20",
};

const statusBadge = (status: string) => {
  if (status === "connected") return <Badge variant="default" className="bg-emerald-600 text-white">Connected</Badge>;
  if (status === "limited") return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Limited</Badge>;
  return <Badge variant="destructive">Not Configured</Badge>;
};

type DashboardTab = "overview" | "map";

const PropertyIQDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const navigate = useNavigate();
  const { isDemo } = usePropertyIQDemo();

  // Real saved properties for authenticated users
  const { data: dashboardData, isLoading: realLoading } = usePropertyIQDashboard();

  // Demo: fetch the seeded properties to populate "Saved Properties"
  const { data: demoData, isLoading: demoLoading } = useQuery({
    enabled: isDemo,
    queryKey: ["piq-demo-saved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("piq_properties")
        .select(`
          id, address, city, state, zip,
          piq_property_scores ( roof_replacement_score, renovation_score, investment_score ),
          piq_property_ownership ( piq_owners ( name, owner_type ) )
        `)
        .in("id", DEMO_PROPERTY_IDS);
      if (error) throw error;
      return {
        savedProperties: (data || []).map((p, i) => ({
          id: `demo-${p.id}`,
          created_at: new Date(Date.now() - i * 86400000).toISOString(),
          piq_properties: p,
        })),
      };
    },
  });

  const isLoading = isDemo ? demoLoading : realLoading;

  useEffect(() => {
    if (isDemo) {
      setUserEmail("Demo User");
      return;
    }
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/property-iq/auth", { replace: true });
        return;
      }
      setUserEmail(session.user.email || "");
    };
    getUser();
  }, [navigate, isDemo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const suffix = isDemo ? "&demo=1" : "";
    navigate(`/property-iq/search?q=${encodeURIComponent(searchQuery)}${suffix}`);
  };

  const handleLogout = async () => {
    if (isDemo) {
      sessionStorage.removeItem("piq_demo");
      navigate("/property-iq");
      return;
    }
    await supabase.auth.signOut();
    navigate("/property-iq");
  };

  const savedProperties = (isDemo ? demoData?.savedProperties : dashboardData?.savedProperties) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DemoBanner />
      <PropertyIQHeader />

      <div className="container mx-auto max-w-6xl px-4 py-8 flex-1 space-y-8">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1 border border-border rounded-lg p-0.5">
              <Button variant={activeTab === "overview" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("overview")} className="h-8 px-3 gap-1.5">
                <BarChart3 className="h-4 w-4" /> Overview
              </Button>
              <Button variant={activeTab === "map" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("map")} className="h-8 px-3 gap-1.5">
                <Map className="h-4 w-4" /> Map Explorer
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>{isDemo ? "Exit Demo" : "Log Out"}</Button>
          </div>
        </div>

        {activeTab === "map" ? (
          <MapExplorer />
        ) : (
          <>
            {/* Quick search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Quick property search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Button type="submit">Search</Button>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {demoStats.map((s) => (
                <Card key={s.label}>
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Saved Properties */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Bookmark className="h-5 w-5" /> Saved Properties</h2>
                  {savedProperties.length > 0 && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportSavedPropertiesCSV(savedProperties)}>
                      <Download className="h-4 w-4" /> Export All
                    </Button>
                  )}
                </div>
                {isLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
                  </div>
                ) : savedProperties.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedProperties.map((sp: any) => {
                      const p = sp.piq_properties;
                      if (!p) return null;
                      const scores = p.piq_property_scores?.[0];
                      const ownerName = p.piq_property_ownership?.[0]?.piq_owners?.name;
                      const roofScore = scores?.roof_replacement_score ?? 0;
                      return (
                        <Card key={sp.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/property-iq/property/${p.id}${isDemo ? "?demo=1" : ""}`)}>
                          <CardContent className="pt-4 space-y-2">
                            <p className="font-medium text-sm leading-tight">{p.address}</p>
                            <p className="text-xs text-muted-foreground">{p.city}, {p.state} {p.zip}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{ownerName}</span>
                              <Badge variant={roofScore >= 90 ? 'destructive' : roofScore <= 50 ? 'secondary' : 'default'} className="text-[10px]">
                                Roof: {roofScore}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" /> Saved {new Date(sp.created_at).toLocaleDateString()}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <p className="text-sm">No saved properties yet. Search and save properties to see them here.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Searches */}
                <h2 className="text-lg font-semibold flex items-center gap-2 mt-6"><Clock className="h-5 w-5" /> Recent Searches</h2>
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {recentSearches.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{s.address}</p>
                            <p className="text-xs text-muted-foreground">{s.date}</p>
                          </div>
                          <Badge variant="outline">{s.results} result{s.results !== 1 ? 's' : ''}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right sidebar */}
              <div className="space-y-6">
                {/* Alerts */}
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Bell className="h-5 w-5" /> Alerts</h2>
                  <div className="space-y-3">
                    {alerts.map((a, i) => (
                      <Card key={i} className={`border ${severityColors[a.severity]}`}>
                        <CardContent className="pt-4 space-y-1">
                          <div className="flex items-start gap-2">
                            <a.icon className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{a.title}</p>
                              <p className="text-xs opacity-80">{a.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* API Status */}
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Wifi className="h-5 w-5" /> API Connections</h2>
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      {apiConnections.map((api, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{api.name}</p>
                            <p className="text-[10px] text-muted-foreground">{api.detail}</p>
                          </div>
                          {statusBadge(api.status)}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <PropertyIQFooter />
    </div>
  );
};

export default PropertyIQDashboard;
