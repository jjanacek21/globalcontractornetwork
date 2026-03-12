import { useParams, Link } from "react-router-dom";
import { PropertyIQHeader } from "@/components/property-iq/PropertyIQHeader";
import { PropertyIQFooter } from "@/components/property-iq/PropertyIQFooter";
import { ScoreGauge } from "@/components/property-iq/ScoreGauge";
import { OwnerIntelligenceCard } from "@/components/property-iq/OwnerIntelligenceCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { seedProperties } from "@/lib/propertyIQSeedData";
import {
  MapPin, Download, Bookmark, ArrowLeft, Building2, CalendarDays,
  CloudRain, Wrench, DollarSign, AlertTriangle, Shield,
} from "lucide-react";

const conditionColor: Record<string, string> = {
  excellent: 'bg-green-500',
  good: 'bg-blue-500',
  fair: 'bg-yellow-500',
  poor: 'bg-orange-500',
  critical: 'bg-red-500',
};

const PropertyIQReport = () => {
  const { id } = useParams<{ id: string }>();
  const property = seedProperties.find((p) => p.id === id);

  if (!property) {
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

  const roofAge = new Date().getFullYear() - property.roof_installed;
  const roofLifePercent = Math.min(100, Math.round((roofAge / property.roof_expected_life) * 100));

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
            <Button variant="outline" size="sm" className="gap-1"><Download className="h-4 w-4" /> Export PDF</Button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge>{property.property_type}</Badge>
            <Badge variant={property.roof_condition === 'critical' ? 'destructive' : 'secondary'}>
              Roof: {property.roof_condition}
            </Badge>
            <Badge variant="outline">{property.flood_zone} Flood Zone</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary shrink-0" />
            {property.address}
          </h1>
          <p className="text-muted-foreground">{property.city}, {property.state} {property.zip} · {property.county} County · Folio: {property.folio_number}</p>
        </div>

        {/* AI Scores */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">AI Opportunity Scores</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-around flex-wrap gap-6">
              <ScoreGauge score={property.scores.roof_replacement} label="Roof Replacement" />
              <ScoreGauge score={property.scores.renovation} label="Renovation" />
              <ScoreGauge score={property.scores.investment} label="Investment" />
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
                  ['Type', property.property_type],
                  ['Sqft', property.sqft.toLocaleString()],
                  ['Lot', property.lot_size],
                  ['Built', property.year_built],
                  ['Stories', property.stories],
                  ['Zoning', property.zoning],
                  ['Assessed', `$${property.assessed_value.toLocaleString()}`],
                  ['Market Value', `$${property.market_value.toLocaleString()}`],
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
                <div><p className="text-muted-foreground text-xs">Type</p><p className="font-medium">{property.roof_type}</p></div>
                <div><p className="text-muted-foreground text-xs">Installed</p><p className="font-medium">{property.roof_installed}</p></div>
                <div><p className="text-muted-foreground text-xs">Age</p><p className="font-medium">{roofAge} years</p></div>
                <div><p className="text-muted-foreground text-xs">Expected Life</p><p className="font-medium">{property.roof_expected_life} years</p></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Life Used</span>
                  <span className="font-medium">{roofLifePercent}%</span>
                </div>
                <Progress value={roofLifePercent} className="h-3" />
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${conditionColor[property.roof_condition]}`} />
                <span className="text-sm font-medium capitalize">{property.roof_condition} Condition</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Owner Intelligence */}
        <div className="mb-6">
          <OwnerIntelligenceCard owners={property.owners} />
        </div>

        {/* Building Components */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-5 w-5" /> Building Components</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {property.building_components.map((comp) => {
                const age = new Date().getFullYear() - comp.installed_year;
                const pct = Math.min(100, Math.round((age / comp.expected_life_years) * 100));
                return (
                  <div key={comp.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        {comp.name}
                        <div className={`w-2 h-2 rounded-full ${conditionColor[comp.condition]}`} />
                      </span>
                      <span className="text-muted-foreground">{age}y / {comp.expected_life_years}y ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Permit History */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Permit History</CardTitle></CardHeader>
          <CardContent>
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
                {property.permits.map((p) => (
                  <TableRow key={p.permit_number}>
                    <TableCell className="font-mono text-xs">{p.permit_number}</TableCell>
                    <TableCell>{p.type}</TableCell>
                    <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={p.status === 'Open' ? 'default' : 'secondary'} className="text-xs">{p.status}</Badge></TableCell>
                    <TableCell className="text-right">{p.value ? `$${p.value.toLocaleString()}` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sales History */}
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
                {property.sales_history.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">${s.price.toLocaleString()}</TableCell>
                    <TableCell>{s.buyer}</TableCell>
                    <TableCell>{s.seller}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Storm Exposure */}
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
                {property.storm_events.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                    <TableCell>{s.category}</TableCell>
                    <TableCell>{s.max_wind_speed}</TableCell>
                    <TableCell>{s.damage_reported ? <AlertTriangle className="h-4 w-4 text-destructive" /> : '—'}</TableCell>
                    <TableCell>{s.claims_filed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Contractor Opportunities */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-5 w-5" /> Contractor Opportunities</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {property.contractor_opportunities.map((opp) => (
                <div key={opp} className="p-3 rounded-lg border bg-muted/30 text-sm font-medium text-center">
                  {opp}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <PropertyIQFooter />
    </div>
  );
};

export default PropertyIQReport;
