import { supabase, isSupabaseConfigured } from './supabase';

export type CityGroup = 'New Delhi' | 'Dehradun' | 'Other Campuses';

export interface CampusLocation {
  id: string;
  name: string;
  shortName: string;
  city: string;
  cityGroup: CityGroup;
  country: string;
  lat: number;
  lng: number;
  zoom: number;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  isPreloaded?: boolean;
  address?: string;
  stats?: {
    areaAcres?: number;
    activeCheckpoints?: number;
    activeReports?: number;
  };
}

export const PRESET_CAMPUSES: CampusLocation[] = [
  // 1. DEFAULT CAMPUS: IIT Delhi
  {
    id: 'iit-delhi',
    name: 'Indian Institute of Technology Delhi (IITD)',
    shortName: 'IIT Delhi',
    city: 'Hauz Khas, New Delhi',
    cityGroup: 'New Delhi',
    country: 'India',
    lat: 28.5458,
    lng: 77.1925,
    zoom: 17,
    bounds: [77.185, 28.540, 77.200, 28.552],
    isPreloaded: true,
    address: 'Hauz Khas, New Delhi 110016',
    stats: { areaAcres: 320, activeCheckpoints: 6, activeReports: 60 },
  },

  // 2. UPES - Bidholi Campus (Energy Acres)
  {
    id: 'upes-bidholi',
    name: 'UPES (Bidholi Campus - Energy Acres)',
    shortName: 'UPES Bidholi',
    city: 'Dehradun',
    cityGroup: 'Dehradun',
    country: 'India',
    lat: 30.4159,
    lng: 77.9667,
    zoom: 17,
    bounds: [77.961, 30.410, 77.973, 30.422],
    isPreloaded: true,
    address: 'Energy Acres, Bidholi, via Premnagar, Dehradun 248007',
    stats: { areaAcres: 44, activeCheckpoints: 5, activeReports: 8 },
  },

  // 3. UPES - Kandoli Campus (Knowledge Acres)
  {
    id: 'upes-kandoli',
    name: 'UPES (Kandoli Campus - Knowledge Acres)',
    shortName: 'UPES Kandoli',
    city: 'Dehradun',
    cityGroup: 'Dehradun',
    country: 'India',
    lat: 30.3980,
    lng: 77.9690,
    zoom: 17,
    bounds: [77.963, 30.393, 77.975, 30.403],
    isPreloaded: true,
    address: 'Knowledge Acres, Kandoli, via Premnagar, Dehradun 248007',
    stats: { areaAcres: 38, activeCheckpoints: 4, activeReports: 7 },
  },

  // 4. Graphic Era (Deemed to be University)
  {
    id: 'geu-dehradun',
    name: 'Graphic Era (Deemed to be University)',
    shortName: 'Graphic Era Deemed',
    city: 'Dehradun',
    cityGroup: 'Dehradun',
    country: 'India',
    lat: 30.2680,
    lng: 77.9960,
    zoom: 17,
    bounds: [77.991, 30.263, 78.001, 30.273],
    isPreloaded: true,
    address: '566/6 Bell Road, Clement Town, Dehradun 248002',
    stats: { areaAcres: 30, activeCheckpoints: 5, activeReports: 9 },
  },

  // 5. Graphic Era Hill University (GEHU)
  {
    id: 'gehu-dehradun',
    name: 'Graphic Era Hill University (GEHU)',
    shortName: 'Graphic Era Hill',
    city: 'Dehradun',
    cityGroup: 'Dehradun',
    country: 'India',
    lat: 30.2728,
    lng: 78.0000,
    zoom: 17,
    bounds: [77.995, 30.268, 78.005, 30.277],
    isPreloaded: true,
    address: 'Society Area, Clement Town, Dehradun 248002',
    stats: { areaAcres: 25, activeCheckpoints: 4, activeReports: 6 },
  },

  // 6. DIT University
  {
    id: 'dit-dehradun',
    name: 'DIT University',
    shortName: 'DIT University',
    city: 'Dehradun',
    cityGroup: 'Dehradun',
    country: 'India',
    lat: 30.3992,
    lng: 78.0753,
    zoom: 17,
    bounds: [78.070, 30.394, 78.081, 30.405],
    isPreloaded: true,
    address: 'Mussoorie Diversion Road, Village Makkawala, Dehradun 248009',
    stats: { areaAcres: 21, activeCheckpoints: 5, activeReports: 7 },
  },

  // 7. Uttaranchal University
  {
    id: 'uttaranchal-univ',
    name: 'Uttaranchal University',
    shortName: 'Uttaranchal Univ',
    city: 'Dehradun',
    cityGroup: 'Dehradun',
    country: 'India',
    lat: 30.3411,
    lng: 77.9542,
    zoom: 17,
    bounds: [77.948, 30.336, 77.960, 30.347],
    isPreloaded: true,
    address: 'Arcadia Grant, PO Chandanwari, Premnagar, Dehradun 248007',
    stats: { areaAcres: 50, activeCheckpoints: 5, activeReports: 8 },
  },

  // 8. IMS Unison University
  {
    id: 'ims-unison',
    name: 'IMS Unison University',
    shortName: 'IMS Unison',
    city: 'Dehradun',
    cityGroup: 'Dehradun',
    country: 'India',
    lat: 30.4001,
    lng: 78.0781,
    zoom: 17,
    bounds: [78.073, 30.395, 78.083, 30.405],
    isPreloaded: true,
    address: 'Makkawala Greens, Mussoorie Diversion Road, Dehradun 248009',
    stats: { areaAcres: 15, activeCheckpoints: 4, activeReports: 5 },
  },

  // 9. Doon University
  {
    id: 'doon-university',
    name: 'Doon University',
    shortName: 'Doon University',
    city: 'Dehradun',
    cityGroup: 'Dehradun',
    country: 'India',
    lat: 30.2674,
    lng: 78.0449,
    zoom: 17,
    bounds: [78.039, 30.262, 78.051, 30.273],
    isPreloaded: true,
    address: 'Mothrowala Road, Kedarpur, PO Defence Colony, Dehradun 248001',
    stats: { areaAcres: 55, activeCheckpoints: 4, activeReports: 6 },
  },

  // 10. Dev Bhoomi Uttarakhand University (DBUU)
  {
    id: 'dbuu-dehradun',
    name: 'Dev Bhoomi Uttarakhand University (DBUU)',
    shortName: 'Dev Bhoomi (DBUU)',
    city: 'Dehradun',
    cityGroup: 'Dehradun',
    country: 'India',
    lat: 30.3845,
    lng: 77.9314,
    zoom: 17,
    bounds: [77.925, 30.379, 77.937, 30.390],
    isPreloaded: true,
    address: 'Navgaon, Manduwala, Chakrata Road, Dehradun 248007',
    stats: { areaAcres: 42, activeCheckpoints: 4, activeReports: 6 },
  },

  // Other Featured Campuses
  {
    id: 'du-north',
    name: 'Delhi University (North Campus)',
    shortName: 'DU North',
    city: 'Delhi',
    cityGroup: 'New Delhi',
    country: 'India',
    lat: 28.6892,
    lng: 77.2089,
    zoom: 16.5,
    bounds: [77.200, 28.680, 77.218, 28.698],
    isPreloaded: true,
  },
  {
    id: 'bits-pilani',
    name: 'BITS Pilani (Vidya Vihar Campus)',
    shortName: 'BITS Pilani',
    city: 'Pilani, Rajasthan',
    cityGroup: 'Other Campuses',
    country: 'India',
    lat: 28.3639,
    lng: 75.5873,
    zoom: 16.5,
    bounds: [75.580, 28.358, 75.595, 28.370],
    isPreloaded: true,
  },
  {
    id: 'iit-bombay',
    name: 'IIT Bombay (Powai Campus)',
    shortName: 'IIT Bombay',
    city: 'Mumbai, Maharashtra',
    cityGroup: 'Other Campuses',
    country: 'India',
    lat: 19.1334,
    lng: 72.9133,
    zoom: 16.5,
    bounds: [72.905, 19.125, 72.922, 19.142],
    isPreloaded: true,
  },
];

export const DEFAULT_CAMPUS_ID = 'iit-delhi';

export function getCampusById(id: string): CampusLocation {
  return PRESET_CAMPUSES.find((c) => c.id === id) || PRESET_CAMPUSES[0];
}

export function getCampusesByCity(): Record<CityGroup, CampusLocation[]> {
  const groups: Record<CityGroup, CampusLocation[]> = {
    'New Delhi': [],
    'Dehradun': [],
    'Other Campuses': [],
  };
  for (const c of PRESET_CAMPUSES) {
    if (groups[c.cityGroup]) {
      groups[c.cityGroup].push(c);
    } else {
      groups['Other Campuses'].push(c);
    }
  }
  return groups;
}

export const campusMapService = {
  // Step 1: Nominatim Search
  async searchCampuses(query: string): Promise<CampusLocation[]> {
    const q = query.trim().toLowerCase();
    if (!q) return PRESET_CAMPUSES;

    // First check preloaded presets
    const matchedPresets = PRESET_CAMPUSES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );

    // If query has at least 3 chars, query Nominatim with fallback
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(
          query + ' university campus'
        )}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (response.ok) {
        const data = await response.json();
        const nominatimResults: CampusLocation[] = data.map((item: any) => ({
          id: `osm-${item.osm_id}`,
          name: item.display_name.split(',').slice(0, 2).join(','),
          shortName: item.name || item.display_name.split(',')[0],
          city: item.display_name.split(',')[1]?.trim() || '',
          country: item.display_name.split(',').pop()?.trim() || '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          zoom: 16.5,
        }));

        // Deduplicate
        const all = [...matchedPresets, ...nominatimResults];
        const unique = all.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
        return unique.length > 0 ? unique : matchedPresets;
      }
    } catch (err) {
      console.warn('Nominatim network lookup offline/failed:', err);
    }

    return matchedPresets;
  },

  // Step 2 & 3: Overpass Import & Graph Builder with Cache
  async importCampusData(campus: CampusLocation): Promise<{
    campus: CampusLocation;
    hasOverpassWays: boolean;
    nodeCount: number;
  }> {
    const cacheKey = `safecampus_osm_cache_${campus.id}`;

    // Check Local / Supabase cache
    const localCached = localStorage.getItem(cacheKey);
    if (localCached) {
      try {
        return JSON.parse(localCached);
      } catch {
        // continue
      }
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase
          .from('campus_cache')
          .select('metadata')
          .eq('campus_id', campus.id)
          .single();
        if (data?.metadata) {
          localStorage.setItem(cacheKey, JSON.stringify(data.metadata));
          return data.metadata;
        }
      } catch (err) {
        // continue
      }
    }

    // Try Overpass API bounding box query
    let hasWays = false;
    let nodeCount = 12;
    try {
      const delta = 0.008;
      const bbox = `${campus.lat - delta},${campus.lng - delta},${campus.lat + delta},${campus.lng + delta}`;
      const overpassQuery = `[out:json][timeout:5];(way["highway"~"footway|path|pedestrian"](${bbox}););out geom;`;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(overpassQuery),
      });

      if (res.ok) {
        const overpassData = await res.json();
        hasWays = (overpassData.elements?.length || 0) > 0;
        nodeCount = Math.max(12, overpassData.elements?.length * 4 || 12);
      }
    } catch (err) {
      console.warn('Overpass API query skipped/offline, using synthesized graph:', err);
    }

    const result = {
      campus,
      hasOverpassWays: hasWays,
      nodeCount,
    };

    localStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  },
};
