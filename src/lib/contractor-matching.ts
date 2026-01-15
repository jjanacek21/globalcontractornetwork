// Smart matching algorithm for contractors and jobs

export interface MatchScore {
  total: number;
  breakdown: {
    category: number;
    distance: number;
    rating: number;
    availability: number;
    verification: number;
  };
}

export interface JobRequest {
  service_category: string;
  lat: number | null;
  lng: number | null;
  urgency: string;
  timeline: string | null;
}

export interface ContractorForMatching {
  id: string;
  category: string;
  secondary_trades: string[] | null;
  lat?: number;
  lng?: number;
  average_rating: number | null;
  is_verified: boolean | null;
  availability_days: number | null;
  service_area?: string[] | null;
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Calculate match score between a job and contractor
export function calculateMatchScore(
  job: JobRequest,
  contractor: ContractorForMatching,
  contractorLat?: number,
  contractorLng?: number
): MatchScore {
  const breakdown = {
    category: 0,
    distance: 0,
    rating: 0,
    availability: 0,
    verification: 0,
  };

  // Category Match (30 points max)
  const jobCategory = job.service_category?.toLowerCase() || '';
  const contractorCategory = contractor.category?.toLowerCase() || '';
  const secondaryTrades = (contractor.secondary_trades || []).map(t => t.toLowerCase());
  
  if (jobCategory === contractorCategory) {
    breakdown.category = 30;
  } else if (secondaryTrades.includes(jobCategory)) {
    breakdown.category = 20;
  } else if (isCategoryRelated(jobCategory, contractorCategory)) {
    breakdown.category = 15;
  }

  // Distance Score (25 points max)
  if (job.lat && job.lng && contractorLat && contractorLng) {
    const distance = calculateDistance(job.lat, job.lng, contractorLat, contractorLng);
    if (distance <= 10) {
      breakdown.distance = 25;
    } else if (distance <= 25) {
      breakdown.distance = 15;
    } else if (distance <= 50) {
      breakdown.distance = 5;
    }
  } else {
    // If no location data, give partial score
    breakdown.distance = 10;
  }

  // Rating Score (20 points max)
  const rating = contractor.average_rating || 0;
  breakdown.rating = Math.round((rating / 5) * 20);

  // Availability Score (15 points max)
  const urgencyScore = getUrgencyScore(job.urgency, contractor.availability_days);
  breakdown.availability = urgencyScore;

  // Verification Score (10 points max)
  if (contractor.is_verified) {
    breakdown.verification = 10;
  }

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { total, breakdown };
}

function getUrgencyScore(urgency: string, availabilityDays: number | null): number {
  const days = availabilityDays || 7;
  
  switch (urgency) {
    case 'emergency':
      return days <= 1 ? 15 : days <= 3 ? 10 : 5;
    case 'urgent':
      return days <= 3 ? 15 : days <= 7 ? 10 : 5;
    case 'standard':
      return days <= 7 ? 15 : days <= 14 ? 10 : 5;
    case 'flexible':
      return 15; // Any availability works
    default:
      return 10;
  }
}

function isCategoryRelated(cat1: string, cat2: string): boolean {
  const relatedGroups = [
    ['roofing', 'roof coating', 'gutters', 'siding'],
    ['plumbing', 'water damage', 'leak repair'],
    ['electrical', 'hvac', 'generator'],
    ['landscaping', 'tree removal', 'fencing'],
    ['painting', 'drywall', 'flooring'],
    ['windows', 'doors', 'glass'],
    ['general contractor', 'remodeling', 'renovation'],
    ['mold remediation', 'water damage', 'restoration'],
  ];

  for (const group of relatedGroups) {
    if (group.some(c => cat1.includes(c)) && group.some(c => cat2.includes(c))) {
      return true;
    }
  }
  return false;
}

// Get color for match score badge
export function getMatchScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

// Get label for match score
export function getMatchScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Low Match';
}
