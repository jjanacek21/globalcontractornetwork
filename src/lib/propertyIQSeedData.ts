export interface PropertyOwner {
  name: string;
  owner_type: 'individual' | 'company' | 'trust';
  phones: string[];
  emails: string[];
  social_media: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  mailing_address: string;
  company_name?: string;
  registered_agent?: string;
  formation_date?: string;
  sunbiz_url?: string;
}

export interface BuildingComponent {
  name: string;
  installed_year: number;
  expected_life_years: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface PermitRecord {
  permit_number: string;
  type: string;
  date: string;
  status: string;
  value?: number;
}

export interface SaleRecord {
  date: string;
  price: number;
  buyer: string;
  seller: string;
}

export interface StormEvent {
  name: string;
  date: string;
  category: string;
  max_wind_speed: number;
  damage_reported: boolean;
  claims_filed: number;
}

export interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  property_type: string;
  sqft: number;
  lot_size: string;
  year_built: number;
  stories: number;
  assessed_value: number;
  market_value: number;
  roof_type: string;
  roof_installed: number;
  roof_expected_life: number;
  roof_condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  scores: {
    roof_replacement: number;
    renovation: number;
    investment: number;
  };
  owners: PropertyOwner[];
  building_components: BuildingComponent[];
  permits: PermitRecord[];
  sales_history: SaleRecord[];
  storm_events: StormEvent[];
  contractor_opportunities: string[];
  folio_number: string;
  zoning: string;
  flood_zone: string;
}

export const seedProperties: PropertyData[] = [
  {
    id: 'prop-001',
    address: '1240 Industrial Blvd',
    city: 'Miami',
    state: 'FL',
    zip: '33125',
    county: 'Miami-Dade',
    property_type: 'Industrial',
    sqft: 42600,
    lot_size: '1.8 acres',
    year_built: 1987,
    stories: 1,
    assessed_value: 2850000,
    market_value: 3200000,
    roof_type: 'TPO',
    roof_installed: 2016,
    roof_expected_life: 25,
    roof_condition: 'good',
    scores: { roof_replacement: 92, renovation: 65, investment: 78 },
    folio_number: '01-3124-012-0340',
    zoning: 'IU-2',
    flood_zone: 'AE',
    owners: [
      {
        name: 'Carlos Mendez',
        owner_type: 'individual',
        phones: ['(305) 555-0142', '(305) 555-0198'],
        emails: ['cmendez@mendezproperties.com', 'carlos.mendez@gmail.com'],
        social_media: {
          linkedin: 'https://linkedin.com/in/carlosmendez',
          facebook: 'https://facebook.com/carlos.mendez.miami',
        },
        mailing_address: '9800 NW 41st Street, Suite 220, Doral, FL 33178',
      },
      {
        name: 'Mendez Industrial Holdings LLC',
        owner_type: 'company',
        phones: ['(305) 555-0200'],
        emails: ['info@mendezholdings.com'],
        social_media: {
          linkedin: 'https://linkedin.com/company/mendez-industrial',
        },
        mailing_address: '9800 NW 41st Street, Suite 220, Doral, FL 33178',
        company_name: 'Mendez Industrial Holdings LLC',
        registered_agent: 'Carlos A. Mendez',
        formation_date: '2004-06-15',
        sunbiz_url: 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchByName',
      },
    ],
    building_components: [
      { name: 'Roof (TPO)', installed_year: 2016, expected_life_years: 25, condition: 'good' },
      { name: 'HVAC System', installed_year: 2019, expected_life_years: 20, condition: 'excellent' },
      { name: 'Electrical Panel', installed_year: 2010, expected_life_years: 30, condition: 'good' },
      { name: 'Plumbing', installed_year: 1987, expected_life_years: 50, condition: 'fair' },
      { name: 'Loading Dock Doors', installed_year: 2015, expected_life_years: 20, condition: 'good' },
      { name: 'Fire Suppression', installed_year: 2018, expected_life_years: 25, condition: 'excellent' },
    ],
    permits: [
      { permit_number: 'BD-2023-045821', type: 'Roof Repair', date: '2023-08-15', status: 'Closed', value: 45000 },
      { permit_number: 'BD-2019-012344', type: 'HVAC Replacement', date: '2019-03-22', status: 'Closed', value: 85000 },
      { permit_number: 'BD-2018-098712', type: 'Fire Alarm Install', date: '2018-11-05', status: 'Closed', value: 32000 },
      { permit_number: 'BD-2016-076543', type: 'Roof Replacement', date: '2016-05-10', status: 'Closed', value: 180000 },
    ],
    sales_history: [
      { date: '2015-02-28', price: 2100000, buyer: 'Mendez Industrial Holdings LLC', seller: 'Riverside Commercial Trust' },
      { date: '2004-09-14', price: 1450000, buyer: 'Riverside Commercial Trust', seller: 'Miami Industrial Corp' },
    ],
    storm_events: [
      { name: 'Hurricane Irma', date: '2017-09-10', category: 'Category 4', max_wind_speed: 130, damage_reported: true, claims_filed: 2 },
      { name: 'Hurricane Ian', date: '2022-09-28', category: 'Category 4', max_wind_speed: 155, damage_reported: false, claims_filed: 0 },
    ],
    contractor_opportunities: ['Roof Coating', 'Plumbing Upgrade', 'Parking Lot Resurfacing', 'LED Lighting Retrofit', 'Dock Seal Replacement', 'Exterior Painting'],
  },
  {
    id: 'prop-002',
    address: '8900 NW 33rd Street',
    city: 'Doral',
    state: 'FL',
    zip: '33172',
    county: 'Miami-Dade',
    property_type: 'Retail',
    sqft: 18400,
    lot_size: '0.6 acres',
    year_built: 1999,
    stories: 1,
    assessed_value: 1650000,
    market_value: 1900000,
    roof_type: 'Modified Bitumen',
    roof_installed: 2008,
    roof_expected_life: 20,
    roof_condition: 'poor',
    scores: { roof_replacement: 48, renovation: 82, investment: 71 },
    folio_number: '35-3025-008-0120',
    zoning: 'BU-1',
    flood_zone: 'X',
    owners: [
      {
        name: 'Doral Retail Partners Trust',
        owner_type: 'trust',
        phones: ['(305) 555-0312', '(786) 555-0488'],
        emails: ['admin@doralretailpartners.com'],
        social_media: {},
        mailing_address: '1200 Brickell Avenue, Suite 1500, Miami, FL 33131',
        company_name: 'Doral Retail Partners Trust',
        registered_agent: 'Patricia Vasquez, Esq.',
        formation_date: '2010-03-22',
        sunbiz_url: 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchByName',
      },
      {
        name: 'Patricia Vasquez',
        owner_type: 'individual',
        phones: ['(786) 555-0488', '(305) 555-0399'],
        emails: ['pvasquez@vasquezlaw.com', 'patricia.vasquez@outlook.com'],
        social_media: {
          linkedin: 'https://linkedin.com/in/patriciavasquez',
          twitter: 'https://twitter.com/pvasquezlaw',
        },
        mailing_address: '1200 Brickell Avenue, Suite 1500, Miami, FL 33131',
      },
    ],
    building_components: [
      { name: 'Roof (Mod Bit)', installed_year: 2008, expected_life_years: 20, condition: 'poor' },
      { name: 'HVAC Units (x4)', installed_year: 2012, expected_life_years: 15, condition: 'fair' },
      { name: 'Storefront Glass', installed_year: 1999, expected_life_years: 30, condition: 'fair' },
      { name: 'Parking Lot', installed_year: 2015, expected_life_years: 20, condition: 'good' },
      { name: 'Elevator', installed_year: 1999, expected_life_years: 25, condition: 'poor' },
    ],
    permits: [
      { permit_number: 'BD-2022-112233', type: 'Tenant Buildout', date: '2022-06-01', status: 'Closed', value: 120000 },
      { permit_number: 'BD-2015-044556', type: 'Parking Lot Resurface', date: '2015-10-12', status: 'Closed', value: 35000 },
      { permit_number: 'BD-2012-033445', type: 'HVAC Replacement', date: '2012-04-18', status: 'Closed', value: 65000 },
    ],
    sales_history: [
      { date: '2018-07-10', price: 1750000, buyer: 'Doral Retail Partners Trust', seller: 'NW Investments LLC' },
      { date: '2006-11-30', price: 1200000, buyer: 'NW Investments LLC', seller: 'Original Developer Inc' },
    ],
    storm_events: [
      { name: 'Hurricane Irma', date: '2017-09-10', category: 'Category 4', max_wind_speed: 130, damage_reported: true, claims_filed: 3 },
    ],
    contractor_opportunities: ['Full Roof Replacement', 'HVAC Upgrade', 'Storefront Renovation', 'ADA Compliance', 'Elevator Modernization', 'Interior Remodel'],
  },
  {
    id: 'prop-003',
    address: '4520 S Dixie Highway',
    city: 'West Palm Beach',
    state: 'FL',
    zip: '33405',
    county: 'Palm Beach',
    property_type: 'Office',
    sqft: 56000,
    lot_size: '2.4 acres',
    year_built: 1992,
    stories: 4,
    assessed_value: 6200000,
    market_value: 7500000,
    roof_type: 'TPO',
    roof_installed: 2005,
    roof_expected_life: 25,
    roof_condition: 'critical',
    scores: { roof_replacement: 97, renovation: 58, investment: 85 },
    folio_number: '74-43-44-21-05-000-0010',
    zoning: 'CG',
    flood_zone: 'AE',
    owners: [
      {
        name: 'Robert & Sandra Chen',
        owner_type: 'individual',
        phones: ['(561) 555-0721', '(561) 555-0722', '(917) 555-0133'],
        emails: ['rchen@chengroupfl.com', 'sandra.chen@chengroupfl.com', 'robertchen88@gmail.com'],
        social_media: {
          linkedin: 'https://linkedin.com/in/robertchen-fl',
          facebook: 'https://facebook.com/robert.chen.wpb',
          twitter: 'https://twitter.com/rchenrealestate',
        },
        mailing_address: '500 S Australian Ave, Suite 600, West Palm Beach, FL 33401',
      },
      {
        name: 'Chen Group Florida LLC',
        owner_type: 'company',
        phones: ['(561) 555-0700'],
        emails: ['info@chengroupfl.com', 'accounting@chengroupfl.com'],
        social_media: {
          linkedin: 'https://linkedin.com/company/chen-group-florida',
        },
        mailing_address: '500 S Australian Ave, Suite 600, West Palm Beach, FL 33401',
        company_name: 'Chen Group Florida LLC',
        registered_agent: 'Robert T. Chen',
        formation_date: '1998-11-02',
        sunbiz_url: 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchByName',
      },
    ],
    building_components: [
      { name: 'Roof (TPO)', installed_year: 2005, expected_life_years: 25, condition: 'critical' },
      { name: 'HVAC Chiller', installed_year: 2014, expected_life_years: 20, condition: 'good' },
      { name: 'Elevator (x2)', installed_year: 2010, expected_life_years: 25, condition: 'good' },
      { name: 'Fire Alarm System', installed_year: 2017, expected_life_years: 15, condition: 'excellent' },
      { name: 'Windows/Curtain Wall', installed_year: 1992, expected_life_years: 35, condition: 'fair' },
      { name: 'Parking Garage', installed_year: 1992, expected_life_years: 40, condition: 'fair' },
      { name: 'Electrical Switchgear', installed_year: 2008, expected_life_years: 30, condition: 'good' },
    ],
    permits: [
      { permit_number: 'PB-2023-987654', type: 'Roof Repair', date: '2023-11-20', status: 'Open', value: 28000 },
      { permit_number: 'PB-2017-123456', type: 'Fire Alarm Upgrade', date: '2017-07-14', status: 'Closed', value: 55000 },
      { permit_number: 'PB-2014-567890', type: 'HVAC Chiller Replace', date: '2014-02-28', status: 'Closed', value: 210000 },
      { permit_number: 'PB-2010-334455', type: 'Elevator Modernization', date: '2010-09-01', status: 'Closed', value: 175000 },
      { permit_number: 'PB-2005-112233', type: 'Re-Roof', date: '2005-04-15', status: 'Closed', value: 320000 },
    ],
    sales_history: [
      { date: '2012-03-15', price: 4800000, buyer: 'Chen Group Florida LLC', seller: 'Dixie Office Park Associates' },
      { date: '2001-08-22', price: 3200000, buyer: 'Dixie Office Park Associates', seller: 'South FL Development Corp' },
      { date: '1992-01-10', price: 2100000, buyer: 'South FL Development Corp', seller: 'Original Builder' },
    ],
    storm_events: [
      { name: 'Hurricane Ian', date: '2022-09-28', category: 'Category 4', max_wind_speed: 155, damage_reported: true, claims_filed: 4 },
      { name: 'Hurricane Irma', date: '2017-09-10', category: 'Category 4', max_wind_speed: 130, damage_reported: true, claims_filed: 2 },
      { name: 'Hurricane Wilma', date: '2005-10-24', category: 'Category 3', max_wind_speed: 120, damage_reported: true, claims_filed: 5 },
    ],
    contractor_opportunities: ['Full Roof Replacement (Urgent)', 'Window Replacement', 'Parking Garage Repair', 'Exterior Waterproofing', 'Lobby Renovation', 'Energy Efficiency Retrofit'],
  },
];
