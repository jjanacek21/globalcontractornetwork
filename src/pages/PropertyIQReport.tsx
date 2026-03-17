import { useParams, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { PropertyIQHeader } from "@/components/property-iq/PropertyIQHeader";
import { PropertyIQFooter } from "@/components/property-iq/PropertyIQFooter";
import { ScoreGauge } from "@/components/property-iq/ScoreGauge";
import { OwnerIntelligenceCard } from "@/components/property-iq/OwnerIntelligenceCard";
import { exportPropertyPDF } from "@/components/property-iq/ExportUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { usePropertyIQReport, useEnrichProperty, useFetchMiamiDadePermits } from "@/hooks/usePropertyIQ";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Download, Bookmark, ArrowLeft, Building2, CalendarDays,
  CloudRain, Wrench, DollarSign, AlertTriangle, Shield, Loader2, RefreshCw,
} from "lucide-react";

const conditionColor: Record<string, string> = {
  excellent: 'bg-green-500',
  good: 'bg-blue-500',
  fair: 'bg-yellow-500',
  poor: 'bg-orange-500',
  critical: 'bg-red-500',
};

// Map ATTOM property type codes to readable labels
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  SFR: 'Single Family',
  RSFR: 'Single Family',
  CONDO: 'Condominium',
  TOWNHOUSE: 'Townhouse',
  DUPLEX: 'Duplex',
  TRIPLEX: 'Triplex',
  QUADRUPLEX: 'Quadruplex',
  APARTMENT: 'Apartment',
  COMMERCIAL: 'Commercial',
  INDUSTRIAL: 'Industrial',
  VACANT: 'Vacant Land',
  MOBILE: 'Mobile Home',
  COOP: 'Co-op',
  RESIDENTIAL: 'Residential',
};

function formatPropertyType(raw: string | null | undefined): string {
  if (!raw) return 'Residential';
  const upper = raw.toUpperCase().trim();
  return PROPERTY_TYPE_LABELS[upper] || raw;
}

const PropertyIQReport = () => {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading, error } = usePropertyIQReport(id);
  const enrichMutation = useEnrichProperty();
  const permitMutation = useFetchMiamiDadePermits();
  const enrichTriggered = useRef(false);
  const { toast } = useToast();

  // Auto-enrich when property loads
  useEffect(() => {
    if (property && id && !enrichTriggered.current && !enrichMutation.isPending) {
      enrichTriggered.current = true;
      toast({ title: "Enriching data...", description: "Fetching storm history and recalculating scores." });
      enrichMutation.mutate(id, {
        onSuccess: (data) => {
          toast({ title: "Data enriched", description: data.enriched.join("; ") });
        },
        onError: () => {
          toast({ title: "Enrichment skipped", description: "Could not enrich data at this time.", variant: "destructive" });
        },
      });
    }
  }, [property, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PropertyIQHeader />
        <div className="container mx-auto max-w-5xl px-4 py-6 flex-1 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" />
          </div>
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  if (!property || error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PropertyIQHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">Property Not Found</p>
            <Link to="/property-iq/search"><Button variant="outline">Back to Search</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const scores = property.piq_property_scores?.[0];
  const roofComponent = property.piq_building_components?.find(c => c.component_type === 'Roof');
  const roofMaterial = roofComponent?.material || 'Unknown';
  const roofInstalled = roofComponent?.install_year || property.year_built || 2000;
  const roofExpectedLife = roofComponent?.estimated_life || 25;
  const roofCondition = roofComponent?.condition || 'unknown';
  const roofAge = new Date().getFullYear() - roofInstalled;
  const roofLifePercent = Math.min(100, Math.round((roofAge / roofExpectedLife) * 100));

  const handleExportPDF = () => {
    exportPropertyPDF(property);
    toast({ title: "PDF exported", description: "Report downloaded successfully." });
  };

  const handleRefreshPermits = () => {
    if (!id) return;
    permitMutation.mutate(id, {
      onSuccess: (data) => {
        toast({ title: "Permits refreshed", description: `Found ${data.inserted} new permits.` });
      },
      onError: (err) => {
        toast({ title: "Permit lookup failed", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PropertyIQHeader />

      <div className="container mx-auto max-w-5xl px-4 py-6 flex-1">
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/property-iq/search" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Search
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1"><Bookmark className="h-4 w-4" /> Save</Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleExportPDF}>
              <Download className="h-4 w-4" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge>{formatPropertyType(property.property_type)}</Badge>
            <Badge variant={roofCondition === 'critical' ? 'destructive' : 'secondary'}>Roof: {roofCondition}</Badge>
            {property.flood_zone && <Badge variant="outline">{property.flood_zone} Flood Zone</Badge>}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary shrink-0" />
            {property.address}
          </h1>
          <p className="text-muted-foreground">{property.city}, {property.state} {property.zip} · {property.zoning}</p>
        </div>

        {/* AI Scores */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">AI Opportunity Scores</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-around flex-wrap gap-6">
              <ScoreGauge score={scores?.roof_replacement_score ?? 0} label="Roof Replacement" />
              <ScoreGauge score={scores?.renovation_score ?? 0} label="Renovation" />
              <ScoreGauge score={scores?.investment_score ?? 0} label="Investment" />
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Property Overview */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" /> Property Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Type', formatPropertyType(property.property_type)],
                  ['Sqft', property.building_sqft ? property.building_sqft.toLocaleString() : '—'],
                  ['Lot', property.lot_sqft ? `${(property.lot_sqft / 43560).toFixed(2)} acres` : '—'],
                  ['Built', property.year_built ?? '—'],
                  ['Stories', property.stories ?? '—'],
                  ['Zoning', property.zoning ?? '—'],
                  ['Assessed', property.assessed_value ? `$${Number(property.assessed_value).toLocaleString()}` : '—'],
                  ['Market Value', property.estimated_value ? `$${Number(property.estimated_value).toLocaleString()}` : '—'],
                  ['Construction', property.construction_type ?? '—'],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Roof Intelligence */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Roof Intelligence</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Type</p><p className="font-medium">{roofMaterial}</p></div>
                <div><p className="text-muted-foreground text-xs">Installed</p><p className="font-medium">{roofInstalled}</p></div>
                <div><p className="text-muted-foreground text-xs">Age</p><p className="font-medium">{roofAge} years</p></div>
                <div><p className="text-muted-foreground text-xs">Expected Life</p><p className="font-medium">{roofExpectedLife} years</p></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Life Used</span>
                  <span className="font-medium">{roofLifePercent}%</span>
                </div>
                <Progress value={roofLifePercent} className="h-3" />
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${conditionColor[roofCondition] || 'bg-gray-400'}`} />
                <span className="text-sm font-medium capitalize">{roofCondition} Condition</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Owner Intelligence */}
        {property.piq_property_ownership && property.piq_property_ownership.length > 0 && (
          <div className="mb-6">
            <OwnerIntelligenceCard ownership={property.piq_property_ownership as any} />
          </div>
        )}

        {/* Building Components */}
        {property.piq_building_components && property.piq_building_components.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-5 w-5" /> Building Components</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {property.piq_building_components.map((comp) => {
                  const age = new Date().getFullYear() - (comp.install_year ?? 2000);
                  const life = comp.estimated_life ?? 25;
                  const pct = Math.min(100, Math.round((age / life) * 100));
                  const label = comp.material ? `${comp.component_type} (${comp.material})` : comp.component_type || 'Unknown';
                  return (
                    <div key={comp.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          {label}
                          <div className={`w-2 h-2 rounded-full ${conditionColor[comp.condition ?? ''] || 'bg-gray-400'}`} />
                        </span>
                        <span className="text-muted-foreground">{age}y / {life}y ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permit History */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Permit History</CardTitle>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRefreshPermits} disabled={permitMutation.isPending}>
                {permitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh Permits
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {property.piq_permits && property.piq_permits.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {property.piq_permits.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.permit_number}</TableCell>
                      <TableCell>{p.permit_type}</TableCell>
                      <TableCell>{p.issue_date ? new Date(p.issue_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell><Badge variant={p.status === 'Open' ? 'default' : 'secondary'} className="text-xs">{p.status}</Badge></TableCell>
                      <TableCell className="text-right">{p.estimated_cost ? `$${Number(p.estimated_cost).toLocaleString()}` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No permits found. Click "Refresh Permits" to fetch from Miami-Dade.</p>
            )}
          </CardContent>
        </Card>

        {/* Sales History */}
        {property.piq_property_sales && property.piq_property_sales.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5" /> Sales History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {property.piq_property_sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.sale_date ? new Date(s.sale_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="font-medium">{s.sale_price ? `$${Number(s.sale_price).toLocaleString()}` : '—'}</TableCell>
                      <TableCell>{s.buyer}</TableCell>
                      <TableCell>{s.seller}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Storm Exposure */}
        {property.piq_storm_events && property.piq_storm_events.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CloudRain className="h-5 w-5" /> Storm Exposure</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Storm</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Wind (mph)</TableHead>
                    <TableHead>Damage</TableHead>
                    <TableHead>Claims</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {property.piq_storm_events.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.event_name}</TableCell>
                      <TableCell>{s.event_date ? new Date(s.event_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{s.category}</TableCell>
                      <TableCell>{s.wind_speed}</TableCell>
                      <TableCell>{s.damage_reported ? <AlertTriangle className="h-4 w-4 text-destructive" /> : '—'}</TableCell>
                      <TableCell>{s.insurance_claims}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Contractor Opportunities */}
        {property.piq_contractor_opportunities && property.piq_contractor_opportunities.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-5 w-5" /> Contractor Opportunities</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.piq_contractor_opportunities.map((opp) => (
                  <div key={opp.id} className="p-3 rounded-lg border bg-muted/30 text-sm font-medium text-center">
                    {opp.description || opp.opportunity_type}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <PropertyIQFooter />
    </div>
  );
};

export default PropertyIQReport;
