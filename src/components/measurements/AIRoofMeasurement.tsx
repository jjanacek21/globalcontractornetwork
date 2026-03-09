import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddressGeocoder } from "@/components/crm/AddressGeocoder";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Ruler, Roof, AlertCircle } from "lucide-react";

interface Segment {
  id: string;
  area_sqft: number;
  pitch_degrees: number;
  azimuth_degrees: number;
}

interface SolarMeasurementData {
  address: string;
  quality: "HIGH" | "MEDIUM";
  complexity: string;
  roof_segments_count: number;
  average_pitch_degrees: number;
  pitch_multiplier: number;
  waste_percent: number;
  total_flat_area_sqft: number;
  total_pitched_area_sqft: number;
  total_with_waste_sqft: number;
  total_squares: number;
  max_panels_count: number;
  segments: Segment[];
}

export function AIRoofMeasurement() {
  const [selectedAddress, setSelectedAddress] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SolarMeasurementData | null>(null);

  const canMeasure = useMemo(() => !!coordinates && !loading, [coordinates, loading]);

  const handleAddressSelect = (address: string, coords: [number, number]) => {
    setSelectedAddress(address);
    setCoordinates(coords);
    setError("");
  };

  const runMeasurement = async () => {
    if (!coordinates) return;

    setLoading(true);
    setError("");

    try {
      const [longitude, latitude] = coordinates;
      const { data, error: invokeError } = await supabase.functions.invoke("solar-roof-measure", {
        body: {
          latitude,
          longitude,
          address: selectedAddress,
        },
      });

      if (invokeError || !data?.success || !data?.data) {
        setResult(null);
        setError(data?.error || "Unable to measure this roof right now.");
        return;
      }

      setResult(data.data as SolarMeasurementData);
    } catch {
      setResult(null);
      setError("Unable to measure this roof right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Roof className="h-5 w-5 text-primary" />
            AI Roof Measurement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddressGeocoder
            onSelect={handleAddressSelect}
            placeholder="Search property address to measure roof..."
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={runMeasurement} disabled={!canMeasure} className="shadow-soft">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Measuring...
                </>
              ) : (
                <>
                  <Ruler className="mr-2 h-4 w-4" />
                  Measure Roof
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Uses Google Solar Building Insights for segment-level roof geometry.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Flat Area</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{result.total_flat_area_sqft.toLocaleString()} sq ft</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pitched Area</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{result.total_pitched_area_sqft.toLocaleString()} sq ft</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Squares</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{result.total_squares.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Includes {result.waste_percent}% waste</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Avg Pitch</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{result.average_pitch_degrees.toFixed(1)}°</p>
                <p className="text-xs text-muted-foreground mt-1">{result.complexity} • {result.quality} quality</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Roof Segments ({result.roof_segments_count})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment</TableHead>
                    <TableHead>Area (sq ft)</TableHead>
                    <TableHead>Pitch (°)</TableHead>
                    <TableHead>Azimuth (°)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.segments.map((segment, index) => (
                    <TableRow key={`${segment.id}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{segment.area_sqft.toLocaleString()}</TableCell>
                      <TableCell>{segment.pitch_degrees.toFixed(1)}</TableCell>
                      <TableCell>{segment.azimuth_degrees.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
