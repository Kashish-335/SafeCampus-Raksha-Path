import { Report, SafetyCheckpoint, SafetyBuddy, RouteOption } from '../types';
import { CAMPUS_LANDMARKS } from '../services/mockData';

// Fallback 2D OSM Raster MapLibre Style Spec
export const OSM_RASTER_STYLE: any = {
  version: 8,
  name: 'OpenStreetMap 2D Fallback',
  sources: {
    'osm-raster-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Convert Reports to GeoJSON with risk levels
export function reportsToGeoJSON(reports: Report[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: reports.map((r) => {
      const isResolved = r.status === 'resolved';
      const riskLevel = isResolved ? 'resolved' : r.urgency >= 4 ? 'high' : r.urgency >= 2 ? 'medium' : 'low';
      const color = isResolved ? '#10b981' : r.urgency >= 4 ? '#e11d48' : '#f59e0b';

      return {
        type: 'Feature',
        id: r.id,
        geometry: {
          type: 'Point',
          coordinates: [r.longitude, r.latitude], // [lng, lat]
        },
        properties: {
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          urgency: r.urgency,
          status: r.status,
          is_resolved: isResolved ? 1 : 0,
          location_name: r.location_name,
          ai_summary: r.ai_summary || '',
          assigned_to: r.assigned_to || '',
          risk_level: riskLevel,
          color: color,
        },
      };
    }),
  };
}

// Convert Safety Checkpoints to GeoJSON
export function checkpointsToGeoJSON(checkpoints: SafetyCheckpoint[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: checkpoints.map((cp) => ({
      type: 'Feature',
      id: cp.id,
      geometry: {
        type: 'Point',
        coordinates: [cp.longitude, cp.latitude],
      },
      properties: {
        id: cp.id,
        name: cp.name,
        type: cp.type,
        description: cp.description || '',
        phone: cp.phone || '',
        icon: getCheckpointEmoji(cp.type),
      },
    })),
  };
}

// Campus Street Lamp network for night illumination
export function generateStreetLampsGeoJSON(): GeoJSON.FeatureCollection {
  // Realistic lamp coordinates along major quads and avenues
  const lampCoords: [number, number][] = [
    [77.1912, 28.5415],
    [77.1916, 28.5422],
    [77.1920, 28.5428],
    [77.1925, 28.5435],
    [77.1930, 28.5442],
    [77.1935, 28.5450],
    [77.1936, 28.5458], // Central Quad
    [77.1932, 28.5464],
    [77.1925, 28.5470],
    [77.1915, 28.5475], // Hostel approach
    [77.1908, 28.5480],
    [77.1940, 28.5465], // Mess avenue
    [77.1948, 28.5470],
    [77.1955, 28.5472], // Auditorium
    [77.1945, 28.5430], // Sports
    [77.1950, 28.5422],
  ];

  return {
    type: 'FeatureCollection',
    features: lampCoords.map((coord, idx) => ({
      type: 'Feature',
      id: `lamp-${idx}`,
      geometry: {
        type: 'Point',
        coordinates: coord,
      },
      properties: {
        id: `lamp-${idx}`,
        lumens: 2800,
        status: 'active',
      },
    })),
  };
}

// Landmarks GeoJSON (Gates, Library, Hostels, Medical)
export function landmarksToGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: CAMPUS_LANDMARKS.map((lm) => ({
      type: 'Feature',
      id: lm.id,
      geometry: {
        type: 'Point',
        coordinates: [lm.lng, lm.lat],
      },
      properties: {
        id: lm.id,
        name: lm.name,
      },
    })),
  };
}

// Faint walking path graph line layer
export function campusPathwaysGeoJSON(): GeoJSON.FeatureCollection {
  const pathways: [number, number][][] = [
    // Gate 1 to Central Quad
    [[77.1910, 28.5410], [77.1925, 28.5435], [77.1935, 28.5460]],
    // Central Quad to Girls Hostel
    [[77.1935, 28.5460], [77.1920, 28.5475], [77.1905, 28.5480]],
    // Central Quad to Gate 3
    [[77.1935, 28.5460], [77.1910, 28.5485], [77.1890, 28.5492]],
    // Block C to Parking & Gate 1
    [[77.1895, 28.5440], [77.1920, 28.5430], [77.1910, 28.5410]],
    // Quad to Mess & Auditorium
    [[77.1935, 28.5460], [77.1945, 28.5465], [77.1960, 28.5470]],
    // Sports Complex connector
    [[77.1920, 28.5430], [77.1950, 28.5420], [77.1945, 28.5465]],
  ];

  return {
    type: 'FeatureCollection',
    features: pathways.map((coords, i) => ({
      type: 'Feature',
      id: `pathway-${i}`,
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: { id: `pathway-${i}` },
    })),
  };
}

// Convert RouteOption to GeoJSON LineString (converting [lat, lng] to [lng, lat])
export function routeToGeoJSON(route: RouteOption | null): GeoJSON.FeatureCollection {
  if (!route || !route.coordinates || route.coordinates.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const lngLatCoords = route.coordinates.map(([lat, lng]) => [lng, lat]);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: `route-${route.id}`,
        geometry: {
          type: 'LineString',
          coordinates: lngLatCoords,
        },
        properties: {
          id: route.id,
          name: route.name,
          safety_score: route.safety_score,
          is_safest: route.id === 'safest' ? 1 : 0,
          color: route.id === 'safest' ? '#10b981' : '#64748b',
        },
      },
    ],
  };
}

// Safety Buddies approximate circle representation
export function safetyBuddiesToGeoJSON(buddies: SafetyBuddy[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: buddies.map((b) => ({
      type: 'Feature',
      id: b.id,
      geometry: {
        type: 'Point',
        coordinates: [b.longitude, b.latitude],
      },
      properties: {
        id: b.id,
        name: b.name,
        avatar: b.avatar,
        approx_distance: b.distance_m,
        is_available: b.is_available ? 1 : 0,
      },
    })),
  };
}

function getCheckpointEmoji(type: SafetyCheckpoint['type']): string {
  switch (type) {
    case 'women_helpdesk':
      return '🚺';
    case 'security_post':
      return '👮';
    case 'emergency_callbox':
      return '🚨';
    case 'well_lit_zone':
      return '💡';
    case 'medical_post':
      return '🏥';
    default:
      return '🛡️';
  }
}
