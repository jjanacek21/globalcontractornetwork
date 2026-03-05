import { useBuildingDepartments, BuildingDepartment } from './useBuildingDepartments';

export interface JurisdictionInfo {
  county: string;
  city: string;
  isHVHZ: boolean;
  buildingDepartment: BuildingDepartment | null;
  portalUrl: string | null;
  requiresHVHZProducts: boolean;
}

export function useJurisdictionDetector() {
  const { departments, loading, getByCity, getByCounty } = useBuildingDepartments();

  const detectFromAddress = (address: string): JurisdictionInfo => {
    const normalizedAddress = address.toLowerCase();
    
    let detectedCity = '';
    let detectedCounty = '';
    let isHVHZ = false;
    let buildingDepartment: BuildingDepartment | null = null;

    // Check for city matches first
    for (const dept of departments) {
      if (dept.city) {
        const cityLower = dept.city.toLowerCase();
        if (normalizedAddress.includes(cityLower)) {
          detectedCity = dept.city;
          detectedCounty = dept.county;
          buildingDepartment = dept;
          isHVHZ = dept.is_hvhz === true;
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
          // Prefer the unincorporated (city=null) row for county-level match
          const countyDept = departments.find(
            d => d.county === dept.county && !d.city
          ) || dept;
          buildingDepartment = countyDept;
          detectedCity = countyDept.city || '';
          isHVHZ = countyDept.is_hvhz === true;
          break;
        }
      }
    }

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
    // Look up from DB data instead of hardcoded lists
    if (city) {
      const dept = getByCity(city);
      if (dept) return dept.is_hvhz === true;
    }
    const countyDepts = getByCounty(county);
    return countyDepts.some(d => d.is_hvhz === true);
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
