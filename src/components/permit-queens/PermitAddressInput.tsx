import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Building2, Shield, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useJurisdictionDetector, JurisdictionInfo } from '@/hooks/useJurisdictionDetector';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string; short_code?: string }>;
}

interface PermitAddressInputProps {
  value: string;
  onChange: (address: string) => void;
  onJurisdictionDetected: (info: JurisdictionInfo, fullAddress: string) => void;
  className?: string;
}

export function PermitAddressInput({
  value,
  onChange,
  onJurisdictionDetected,
  className,
}: PermitAddressInputProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jurisdictionInfo, setJurisdictionInfo] = useState<JurisdictionInfo | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { detectFromAddress, loading: detectingJurisdiction } = useJurisdictionDetector();

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search using edge function
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 5) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('geocode-address', {
          body: {
            query: value,
            limit: 5,
            types: 'address',
            country: 'us',
            proximity: '-80.2,26.1', // Florida proximity
          },
        });
        
        if (error) {
          console.error('Geocoding error:', error);
        } else if (data?.features) {
          setSearchResults(data.features);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleSelectResult = useCallback((result: SearchResult) => {
    const fullAddress = result.place_name;
    console.log('[PermitAddressInput] address picked:', fullAddress);
    onChange(fullAddress);
    setShowResults(false);

    // Detect jurisdiction from the selected address
    const info = detectFromAddress(fullAddress);
    console.log('[PermitAddressInput] detectFromAddress result:', info, '(departments loaded:', !detectingJurisdiction, ')');
    setJurisdictionInfo(info);
    console.log('[PermitAddressInput] invoking onJurisdictionDetected handler...');
    onJurisdictionDetected(info, fullAddress);
  }, [onChange, detectFromAddress, onJurisdictionDetected, detectingJurisdiction]);

  return (
    <div ref={containerRef} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Property Address
        </Label>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Start typing the property address..."
            className="h-12 text-base pr-10"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full max-w-xl mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3"
              >
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{result.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detected Jurisdiction Info */}
      {jurisdictionInfo && jurisdictionInfo.county && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-3 flex-1">
                <p className="font-medium text-sm">Jurisdiction Detected</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">County</p>
                    <p className="font-medium">{jurisdictionInfo.county}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">City</p>
                    <p className="font-medium">{jurisdictionInfo.city || 'Unincorporated'}</p>
                  </div>
                </div>

                {jurisdictionInfo.buildingDepartment && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{jurisdictionInfo.buildingDepartment.name || jurisdictionInfo.buildingDepartment.department_name}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {jurisdictionInfo.isHVHZ ? (
                    <Badge variant="destructive" className="gap-1">
                      <Shield className="h-3 w-3" />
                      HVHZ Zone
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Non-HVHZ
                    </Badge>
                  )}
                  
                  {jurisdictionInfo.portalUrl && (
                    <Badge variant="outline" className="gap-1">
                      Online Portal Available
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HVHZ Warning */}
      {jurisdictionInfo?.isHVHZ && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            This property is in a <strong>High Velocity Hurricane Zone (HVHZ)</strong>. 
            Only HVHZ-approved products with valid NOAs will be available for selection.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
