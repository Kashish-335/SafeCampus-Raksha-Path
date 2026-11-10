import { RouteOption, Report } from '../types';
import { CAMPUS_LANDMARKS, CAMPUS_CHECKPOINTS } from './mockData';

export function calculateCampusRoutes(
  startId: string,
  destId: string,
  reports: Report[],
  isNightTime: boolean = true
): { fastest: RouteOption; safest: RouteOption } {
  const start = CAMPUS_LANDMARKS.find((l) => l.id === startId) || CAMPUS_LANDMARKS[0];
  const dest = CAMPUS_LANDMARKS.find((l) => l.id === destId) || CAMPUS_LANDMARKS[1];

  // Base Euclidean distance in meters approx
  const baseDistanceMeters = Math.round(
    calculateDistanceM(start.lat, start.lng, dest.lat, dest.lng)
  );

  // Fastest Route: direct path with slightly perturbed intermediate waypoints (cuts through rear alleys)
  const fastestCoords: [number, number][] = generateFastestWaypoints(start, dest);
  const fastestDistance = Math.max(250, baseDistanceMeters);
  const fastestTime = Math.ceil(fastestDistance / 80); // ~80m per min walk

  // Count incidents near fastest route
  const fastestIncidents = countIncidentsNearPath(fastestCoords, reports, 120);

  // Safest Route: detours via brightly lit main boulevard and security checkpoints
  const safestCoords: [number, number][] = generateSafestWaypoints(start, dest);
  const safestDistance = Math.round(fastestDistance * 1.25); // ~25% longer
  const safestTime = Math.ceil(safestDistance / 80);

  // Count incidents near safest route
  const safestIncidents = countIncidentsNearPath(safestCoords, reports, 80);

  // Calculate Safety Scores (0 - 100)
  // Factors: Base (80) - (incidents * penalty) + (security bonus) - (night penalty if dark)
  const nightFactor = isNightTime ? 1.5 : 1.0;
  const fastestPenalty = Math.min(60, fastestIncidents * 8 * nightFactor);
  const fastestSafetyScore = Math.max(35, Math.min(70, Math.round(85 - fastestPenalty)));

  const safestBonus = 18; // well lit + security post
  const safestPenalty = Math.min(15, safestIncidents * 4);
  const safestSafetyScore = Math.max(88, Math.min(98, Math.round(85 + safestBonus - safestPenalty)));

  const fastestRoute: RouteOption = {
    id: 'fastest',
    name: 'Fastest Direct Route',
    distance_meters: fastestDistance,
    estimated_time_minutes: fastestTime,
    safety_score: fastestSafetyScore,
    coordinates: fastestCoords,
    lighting_quality: 'Poor',
    security_posts_count: 0,
    recent_incidents_nearby: fastestIncidents,
    rationale: `Saves ~${safestTime - fastestTime} min, but traverses unlit shortcuts near ${
      fastestIncidents > 0 ? `${fastestIncidents} reported hazards` : 'dark corridors'
    }. Not recommended after 8 PM.`,
  };

  const safestRoute: RouteOption = {
    id: 'safest',
    name: 'Safest Patrolled Corridor',
    distance_meters: safestDistance,
    estimated_time_minutes: safestTime,
    safety_score: safestSafetyScore,
    coordinates: safestCoords,
    lighting_quality: 'High',
    security_posts_count: 2,
    recent_incidents_nearby: safestIncidents,
    rationale: `100% illuminated pathway via Central Boulevard. Under continuous CCTV coverage and within 50m of 2 active Security & Helpdesk posts.`,
  };

  return { fastest: fastestRoute, safest: safestRoute };
}

// Generate realistic polyline paths
function generateFastestWaypoints(
  start: { lat: number; lng: number; id: string },
  dest: { lat: number; lng: number; id: string }
): [number, number][] {
  // Direct shortcut route (closer to western rear boundary if traversing north-south)
  const midLat = (start.lat + dest.lat) / 2;
  const midLng = Math.min(start.lng, dest.lng) - 0.0012; // swings toward darker west perimeter
  return [
    [start.lat, start.lng],
    [midLat + 0.0004, midLng],
    [midLat - 0.0004, midLng + 0.0003],
    [dest.lat, dest.lng],
  ];
}

function generateSafestWaypoints(
  start: { lat: number; lng: number; id: string },
  dest: { lat: number; lng: number; id: string }
): [number, number][] {
  // Safest route routes through Central Quad (28.5460, 77.1935)
  const quadLat = 28.5460;
  const quadLng = 28.5435;
  const hostelAvenueLat = 28.5475;
  const hostelAvenueLng = 28.5420;

  return [
    [start.lat, start.lng],
    [(start.lat + quadLat) / 2, (start.lng + quadLng) / 2],
    [quadLat, quadLng],
    [hostelAvenueLat, hostelAvenueLng],
    [dest.lat, dest.lng],
  ];
}

function calculateDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function countIncidentsNearPath(
  coords: [number, number][],
  reports: Report[],
  thresholdM: number
): number {
  let count = 0;
  const checked = new Set<string>();

  for (const report of reports) {
    if (report.status === 'resolved') continue;
    for (const [lat, lng] of coords) {
      const dist = calculateDistanceM(lat, lng, report.latitude, report.longitude);
      if (dist <= thresholdM && !checked.has(report.id)) {
        checked.add(report.id);
        count++;
        break;
      }
    }
  }
  return count;
}
