import { useBuildingDepartments, BuildingDepartment } from './useBuildingDepartments';

export interface JurisdictionInfo {
  county: string;
  city: string;
  isHVHZ: boolean;
  buildingDepartment: BuildingDepartment | null;
  portalUrl: string | null;
  requiresHVHZProducts: boolean;
}

// HVHZ zones in Florida (coastal areas of Broward and Miami-Dade)
const HVHZ_CITIES = [
  'miami', 'miami beach', 'miami gardens', 'miami shores', 'miami springs',
  'north miami', 'north miami beach', 'hialeah', 'hialeah gardens',
  'fort lauderdale', 'hollywood', 'pembroke pines', 'miramar', 'coral springs',
  'pompano beach', 'lauderhill', 'davie', 'plantation', 'sunrise', 'tamarac',
  'coconut creek', 'margate', 'deerfield beach', 'lauderdale lakes',
  'north lauderdale', 'parkland', 'weston', 'southwest ranches', 'cooper city',
  'dania beach', 'hallandale beach', 'aventura', 'sunny isles beach', 'bal harbour',
  'surfside', 'key biscayne', 'coral gables', 'south miami', 'pinecrest',
  'cutler bay', 'homestead', 'florida city', 'doral', 'sweetwater', 'medley',
  'opa-locka', 'westchester', 'kendall', 'palmetto bay', 'sunny isles',
];

const HVHZ_COUNTIES = ['broward', 'miami-dade'];

export function useJurisdictionDetector() {
  const { departments, loading, getByCity, getByCounty } = useBuildingDepartments();

  const detectFromAddress = (address: string): JurisdictionInfo => {
    const normalizedAddress = address.toLowerCase();
    
    let detectedCity = '';
    let detectedCounty = '';
    let isHVHZ = false;
    let buildingDepartment: BuildingDepartment | null = null;

    // Check for city matches
    for (const dept of departments) {
      if (dept.city) {
        const cityLower = dept.city.toLowerCase();
        if (normalizedAddress.includes(cityLower)) {
          detectedCity = dept.city;
          detectedCounty = dept.county;
          buildingDepartment = dept;
          break;
        }
      }
    }

    // If no city match, try county match
    if (!detectedCounty) {
      for (const dept of departments) {
        const countyLower = dept.county.toLowerCase();
        if (normalizedAddress.includes(countyLower)) {
          detectedCounty = dept.county;
          const depts = getByCounty(dept.county);
          if (depts.length > 0) {
            buildingDepartment = depts[0];
            detectedCity = depts[0].city || '';
          }
          break;
        }
      }
    }

    // Check if in HVHZ
    isHVHZ = HVHZ_CITIES.some(city => normalizedAddress.includes(city)) ||
             HVHZ_COUNTIES.some(county => normalizedAddress.includes(county));

    return {
      county: detectedCounty,
      city: detectedCity,
      isHVHZ,
      buildingDepartment,
      portalUrl: buildingDepartment?.portal_url || null,
      requiresHVHZProducts: isHVHZ,
    };
  };

  const detectFromCoordinates = async (lat: number, lng: number): Promise<JurisdictionInfo> => {
    return {
      county: '',
      city: '',
      isHVHZ: false,
      buildingDepartment: null,
      portalUrl: null,
      requiresHVHZProducts: false,
    };
  };

  const getHVHZStatus = (county: string, city?: string): boolean => {
    const countyLower = county.toLowerCase();
    const cityLower = city?.toLowerCase() || '';
    
    return HVHZ_COUNTIES.some(c => countyLower.includes(c)) ||
           HVHZ_CITIES.some(c => cityLower.includes(c));
  };

  return {
    loading,
    departments,
    detectFromAddress,
    detectFromCoordinates,
    getHVHZStatus,
    getByCity,
    getByCounty,
  };
}
