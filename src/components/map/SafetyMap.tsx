import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Officially supported Web Worker configuration for MapLibre GL JS v6+ in Vite & Safari
maplibregl.setWorkerUrl(maplibreWorkerUrl);
import { Report, SafetyCheckpoint, RouteOption, SafetyBuddy } from '../../types';
import { useDemo } from '../../context/DemoContext';
import {
  reportsToGeoJSON,
  checkpointsToGeoJSON,
  generateStreetLampsGeoJSON,
  landmarksToGeoJSON,
  campusPathwaysGeoJSON,
  routeToGeoJSON,
  safetyBuddiesToGeoJSON,
  OSM_RASTER_STYLE,
} from '../../utils/geo';
import { CampusLocation, PRESET_CAMPUSES } from '../../services/campusMapService';
import {
  Flame,
  Shield,
  Layers,
  Compass,
  Eye,
  Navigation,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Moon,
  Sun,
  Video,
} from 'lucide-react';

interface SafetyMapProps {
  reports: Report[];
  checkpoints: SafetyCheckpoint[];
  buddies?: SafetyBuddy[];
  selectedReport?: Report | null;
  onSelectReport?: (report: Report) => void;
  onMapClick?: (lat: number, lng: number) => void;
  pinnedLocation?: { lat: number; lng: number } | null;
  activeRoute?: RouteOption | null;
  selectedCampus?: CampusLocation | null;
  liveSosLocation?: { lat: number; lng: number } | null;
}

export const SafetyMap: React.FC<SafetyMapProps> = ({
  reports,
  checkpoints,
  buddies = [],
  selectedReport,
  onSelectReport,
  onMapClick,
  pinnedLocation,
  activeRoute,
  selectedCampus,
  liveSosLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const currentPopupRef = useRef<maplibregl.Popup | null>(null);

  const { isNightMode } = useDemo();

  // 2D vs 3D State: Auto-detect low-spec devices
  const [is3DMode, setIs3DMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('safecampus_3d_mode');
    if (saved !== null) return saved === 'true';
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      return false; // Auto-select 2D on low-end
    }
    return true; // Default 3D
  });

  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showCheckpoints, setShowCheckpoints] = useState<boolean>(true);
  const [showStreetLamps, setShowStreetLamps] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isPlayingRoutePreview, setIsPlayingRoutePreview] = useState<boolean>(false);
  const [usingFallbackStyle, setUsingFallbackStyle] = useState<boolean>(false);

  // Preferred Motion
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialPitch = is3DMode ? 58 : 0;
    const initialBearing = is3DMode ? -20 : 0;
    const centerLng = selectedCampus?.lng || 77.1925;
    const centerLat = selectedCampus?.lat || 28.5458;

    const mapStyleUrl =
      import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

    let mapInstance: maplibregl.Map;

    try {
      mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyleUrl,
        center: [centerLng, centerLat],
        zoom: 17,
        pitch: initialPitch,
        bearing: initialBearing,
        maxPitch: 75,
        attributionControl: false,
      });
    } catch (e) {
      console.warn('MapLibre WebGL or style init failed, falling back to 2D OSM raster:', e);
      mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style: OSM_RASTER_STYLE,
        center: [centerLng, centerLat],
        zoom: 17,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });
      setUsingFallbackStyle(true);
      setIs3DMode(false);
    }

    // Add navigation controls (visualizePitch: true displays pitch tilt ring)
    mapInstance.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }),
      'top-right'
    );

    // Fallback detection on error
    mapInstance.on('error', (e: any) => {
      if (!isLoadedRef.current && (e.error?.message?.includes('style') || e.error?.message?.includes('fetch'))) {
        console.warn('Map style error, applying OSM raster fallback:', e);
        try {
          mapInstance.setStyle(OSM_RASTER_STYLE);
          setUsingFallbackStyle(true);
        } catch {}
      }
    });

    mapInstance.on('load', () => {
      isLoadedRef.current = true;
      mapInstance.resize();
      setupMapLayers(mapInstance);
      updateNightModeStyle(mapInstance, isNightMode);
    });

    // Re-apply layers if style reloads or falls back
    mapInstance.on('styledata', () => {
      if (isLoadedRef.current && !mapInstance.getSource('reports-clustered-src')) {
        setupMapLayers(mapInstance);
      }
    });

    // Map Click
    mapInstance.on('click', (e: any) => {
      if (onMapClick) {
        onMapClick(e.lngLat.lat, e.lngLat.lng);
      }
    });

    // Observe container size changes (tab switches, responsive breakpoints)
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        mapInstance.resize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    mapRef.current = mapInstance;

    return () => {
      resizeObserver?.disconnect();
      mapInstance.remove();
      mapRef.current = null;
      isLoadedRef.current = false;
    };
  }, []);

  // Setup 3D Extrusions and GeoJSON Data Sources/Layers
  const setupMapLayers = (map: maplibregl.Map) => {
    // 1. 3D Building Fill-Extrusion Layer
    // Check if vector tiles have "building" source layer
    const style = map.getStyle();
    let buildingSourceId = 'openmaptiles';
    if (style && style.sources) {
      if (!style.sources['openmaptiles']) {
        const firstVector = Object.keys(style.sources).find((k) => style.sources[k].type === 'vector');
        if (firstVector) buildingSourceId = firstVector;
      }
    }

    if (!map.getLayer('3d-buildings') && map.getSource(buildingSourceId)) {
      try {
        map.addLayer({
          id: '3d-buildings',
          source: buildingSourceId,
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': [
              'case',
              // Highlight hostel / residential buildings
              [
                'any',
                ['==', ['get', 'type'], 'dormitory'],
                ['==', ['get', 'building'], 'dormitory'],
                ['==', ['get', 'building'], 'residential'],
              ],
              '#be185d', // Hostels colored in rich magenta
              [
                'any',
                ['==', ['get', 'type'], 'university'],
                ['==', ['get', 'building'], 'university'],
              ],
              '#312e81', // Academic blocks in deep indigo
              '#1e1b4b', // Other buildings
            ],
            'fill-extrusion-height': [
              'coalesce',
              ['get', 'render_height'],
              ['get', 'height'],
              ['get', 'levels'],
              12,
            ],
            'fill-extrusion-base': [
              'coalesce',
              ['get', 'render_min_height'],
              ['get', 'min_height'],
              0,
            ],
            'fill-extrusion-opacity': 0.88,
          },
        });
      } catch (err) {
        console.warn('Vector building extrusion not available in current style:', err);
      }
    }

    // 2. Faint Walking Pathway Graph Line Layer
    if (!map.getSource('campus-pathways')) {
      map.addSource('campus-pathways', {
        type: 'geojson',
        data: campusPathwaysGeoJSON(),
      });
      map.addLayer({
        id: 'campus-pathways-line',
        type: 'line',
        source: 'campus-pathways',
        paint: {
          'line-color': '#94a3b8',
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.45,
        },
      });
    }

    // 3. Street Lamps Glow Layer
    if (!map.getSource('street-lamps')) {
      map.addSource('street-lamps', {
        type: 'geojson',
        data: generateStreetLampsGeoJSON(),
      });
      // Outer Glow
      map.addLayer({
        id: 'street-lamps-glow',
        type: 'circle',
        source: 'street-lamps',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 8, 18, 16],
          'circle-color': '#fef08a',
          'circle-opacity': 0.7,
          'circle-blur': 0.75,
        },
      });
      // Bright Core
      map.addLayer({
        id: 'street-lamps-core',
        type: 'circle',
        source: 'street-lamps',
        paint: {
          'circle-radius': 3.5,
          'circle-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });
    }

    // 4. Incident Heatmap Layer (Weighted by urgency)
    if (!map.getSource('reports-heatmap-src')) {
      map.addSource('reports-heatmap-src', {
        type: 'geojson',
        data: reportsToGeoJSON(reports),
      });
      map.addLayer({
        id: 'reports-heatmap-layer',
        type: 'heatmap',
        source: 'reports-heatmap-src',
        maxzoom: 18,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'urgency'], 1, 0.2, 5, 1.0],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 14, 0.5, 18, 2.5],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(30, 27, 75, 0)',
            0.2,
            'rgb(67, 56, 202)',
            0.4,
            'rgb(190, 24, 93)',
            0.7,
            'rgb(249, 115, 22)',
            1.0,
            'rgb(225, 29, 72)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 14, 15, 18, 35],
          'heatmap-opacity': 0.85,
        },
      });
    }

    // 5. Clustered Reports Layer
    if (!map.getSource('reports-clustered-src')) {
      map.addSource('reports-clustered-src', {
        type: 'geojson',
        data: reportsToGeoJSON(reports),
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 40,
      });

      // Cluster Circles
      map.addLayer({
        id: 'reports-clusters',
        type: 'circle',
        source: 'reports-clustered-src',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#9333ea', // purple for < 5
            5,
            '#ea580c', // orange for 5 - 10
            10,
            '#e11d48', // red for 10+
          ],
          'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 10, 28],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      // Cluster Count Text
      map.addLayer({
        id: 'reports-cluster-count',
        type: 'symbol',
        source: 'reports-clustered-src',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Unclustered Individual Incident Circles
      map.addLayer({
        id: 'reports-unclustered-circle',
        type: 'circle',
        source: 'reports-clustered-src',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 6, 18, 11],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
        },
      });

      // Cluster Click: Zoom In
      map.on('click', 'reports-clusters', (e: any) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['reports-clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource('reports-clustered-src') as maplibregl.GeoJSONSource;
        if (source && clusterId !== undefined) {
          source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
            const geom = features[0].geometry as GeoJSON.Point;
            map.easeTo({
              center: [geom.coordinates[0], geom.coordinates[1]],
              zoom: zoom + 0.5,
              duration: 500,
            });
          });
        }
      });

      // Unclustered Point Click: Popup
      map.on('click', 'reports-unclustered-circle', (e: any) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const geom = feature.geometry as GeoJSON.Point;
        const p = feature.properties as any;

        if (currentPopupRef.current) {
          currentPopupRef.current.remove();
        }

        const isResolved = p.is_resolved === 1;
        const popupHtml = `
          <div style="font-family: sans-serif; min-width: 200px; padding: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${
                isResolved ? '#d1fae5' : '#ffe4e6'
              }; color: ${isResolved ? '#065f46' : '#9f1239'};">
                ${p.status || 'SUBMITTED'}
              </span>
              <span style="font-size: 10px; font-weight: 700; color: #e11d48;">
                Urgency ${p.urgency}/5
              </span>
            </div>
            <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">${p.title}</strong>
            <p style="font-size: 11px; color: #64748b; margin: 2px 0 4px 0;">📍 ${p.location_name}</p>
            ${
              p.ai_summary
                ? `<div style="font-size: 10px; color: #701a75; background: #fdf2f8; padding: 4px 6px; border-radius: 4px; margin-bottom: 4px;">🤖 ${p.ai_summary}</div>`
                : ''
            }
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 12, closeButton: true })
          .setLngLat([geom.coordinates[0], geom.coordinates[1]])
          .setHTML(popupHtml)
          .addTo(map);

        currentPopupRef.current = popup;

        const originalReport = reports.find((r) => r.id === p.id);
        if (originalReport && onSelectReport) {
          onSelectReport(originalReport);
        }
      });

      // Pointer Cursor Handlers
      map.on('mouseenter', 'reports-clusters', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'reports-clusters', () => (map.getCanvas().style.cursor = ''));
      map.on('mouseenter', 'reports-unclustered-circle', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'reports-unclustered-circle', () => (map.getCanvas().style.cursor = ''));
    }

    // 6. Checkpoints & Infrastructure Symbol Layer
    if (!map.getSource('checkpoints-src')) {
      map.addSource('checkpoints-src', {
        type: 'geojson',
        data: checkpointsToGeoJSON(checkpoints),
      });

      map.addLayer({
        id: 'checkpoints-circle',
        type: 'circle',
        source: 'checkpoints-src',
        paint: {
          'circle-radius': 9,
          'circle-color': '#701a75',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fbcfe8',
        },
      });

      map.addLayer({
        id: 'checkpoints-label',
        type: 'symbol',
        source: 'checkpoints-src',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#f8fafc',
          'text-halo-color': '#0f0e17',
          'text-halo-width': 2,
        },
      });

      map.on('click', 'checkpoints-circle', (e: any) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const geom = feature.geometry as GeoJSON.Point;
        const p = feature.properties as any;

        new maplibregl.Popup({ offset: 10 })
          .setLngLat([geom.coordinates[0], geom.coordinates[1]])
          .setHTML(`
            <div style="font-family: sans-serif; padding: 2px;">
              <strong style="color: #be123c; font-size: 12px;">🛡️ ${p.name}</strong>
              <p style="font-size: 11px; color: #475569; margin: 4px 0;">${p.description || 'Active Safety Station'}</p>
              ${p.phone ? `<a href="tel:${p.phone}" style="display:inline-block; font-size:10px; color:#fff; background:#881337; padding:2px 6px; border-radius:4px; text-decoration:none;">📞 Call ${p.phone}</a>` : ''}
            </div>
          `)
          .addTo(map);
      });
    }

    // 7. Route 3D Lines (Fastest vs Safest)
    if (!map.getSource('route-src')) {
      map.addSource('route-src', {
        type: 'geojson',
        data: routeToGeoJSON(activeRoute || null),
      });

      // Safest Route Aura Glow
      map.addLayer({
        id: 'route-glow-layer',
        type: 'line',
        source: 'route-src',
        filter: ['==', ['get', 'is_safest'], 1],
        paint: {
          'line-color': '#10b981',
          'line-width': 14,
          'line-opacity': 0.4,
          'line-blur': 6,
        },
      });

      // Core Route Line
      map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: 'route-src',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['==', ['get', 'is_safest'], 1], 6, 4],
          'line-opacity': 0.95,
        },
      });
    }

    // 8. Pinned Location Marker
    if (!map.getSource('pinned-loc-src')) {
      map.addSource('pinned-loc-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'pinned-loc-circle',
        type: 'circle',
        source: 'pinned-loc-src',
        paint: {
          'circle-radius': 9,
          'circle-color': '#e11d48',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });
    }

    // 9. Safety Buddies Approximate Buffer Circles
    if (!map.getSource('buddies-src')) {
      map.addSource('buddies-src', {
        type: 'geojson',
        data: safetyBuddiesToGeoJSON(buddies),
      });
      map.addLayer({
        id: 'buddies-approx-circle',
        type: 'circle',
        source: 'buddies-src',
        paint: {
          'circle-radius': 24, // Represents privacy zone
          'circle-color': '#8b5cf6',
          'circle-opacity': 0.25,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#c084fc',
        },
      });
    }
  };

  // Night Mode Visual Tuning
  const updateNightModeStyle = (map: maplibregl.Map, isNight: boolean) => {
    if (!map || !map.isStyleLoaded()) return;

    // Adjust 3D building extrusions
    if (map.getLayer('3d-buildings')) {
      try {
        map.setPaintProperty(
          '3d-buildings',
          'fill-extrusion-color',
          isNight
            ? [
                'case',
                [
                  'any',
                  ['==', ['get', 'type'], 'dormitory'],
                  ['==', ['get', 'building'], 'dormitory'],
                  ['==', ['get', 'building'], 'residential'],
                ],
                '#9d174d', // Deep rose for hostels in night
                '#15102a', // Midnight dark for standard buildings
              ]
            : [
                'case',
                [
                  'any',
                  ['==', ['get', 'type'], 'dormitory'],
                  ['==', ['get', 'building'], 'dormitory'],
                ],
                '#be185d',
                '#cbd5e1', // Light slate in daytime
              ]
        );
      } catch {}
    }

    // Adjust Street Lamps brightness
    if (map.getLayer('street-lamps-glow')) {
      try {
        map.setPaintProperty('street-lamps-glow', 'circle-opacity', isNight ? 0.85 : 0.2);
        map.setPaintProperty(
          'street-lamps-glow',
          'circle-radius',
          isNight ? ['interpolate', ['linear'], ['zoom'], 15, 12, 18, 22] : 6
        );
      } catch {}
    }
  };

  // Synchronize Night Mode changes
  useEffect(() => {
    if (mapRef.current && isLoadedRef.current) {
      updateNightModeStyle(mapRef.current, isNightMode);
    }
  }, [isNightMode]);

  // Update Reports & Heatmap Data
  useEffect(() => {
    if (!mapRef.current || !isLoadedRef.current) return;

    const filteredReports = reports.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      return true;
    });

    const geojson = reportsToGeoJSON(filteredReports);

    const clusterSrc = mapRef.current.getSource('reports-clustered-src') as maplibregl.GeoJSONSource;
    if (clusterSrc) clusterSrc.setData(geojson);

    const heatSrc = mapRef.current.getSource('reports-heatmap-src') as maplibregl.GeoJSONSource;
    if (heatSrc) heatSrc.setData(geojson);

    // Toggle heatmap layer visibility
    if (mapRef.current.getLayer('reports-heatmap-layer')) {
      mapRef.current.setLayoutProperty(
        'reports-heatmap-layer',
        'visibility',
        showHeatmap ? 'visible' : 'none'
      );
    }

    // Toggle checkpoints visibility
    if (mapRef.current.getLayer('checkpoints-circle')) {
      mapRef.current.setLayoutProperty(
        'checkpoints-circle',
        'visibility',
        showCheckpoints ? 'visible' : 'none'
      );
    }
  }, [reports, categoryFilter, showHeatmap, showCheckpoints]);

  // Update Route GeoJSON
  useEffect(() => {
    if (!mapRef.current || !isLoadedRef.current) return;
    const routeSrc = mapRef.current.getSource('route-src') as maplibregl.GeoJSONSource;
    if (routeSrc) {
      routeSrc.setData(routeToGeoJSON(activeRoute || null));
    }

    if (activeRoute && activeRoute.coordinates.length > 0) {
      // Fit bounds to route
      const coords = activeRoute.coordinates;
      const bounds = coords.reduce(
        (b, coord) => b.extend([coord[1], coord[0]]),
        new maplibregl.LngLatBounds([coords[0][1], coords[0][0]], [coords[0][1], coords[0][0]])
      );
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 18, pitch: is3DMode ? 55 : 0 });
    }
  }, [activeRoute, is3DMode]);

  // Update Pinned Location
  useEffect(() => {
    if (!mapRef.current || !isLoadedRef.current) return;
    const pinSrc = mapRef.current.getSource('pinned-loc-src') as maplibregl.GeoJSONSource;
    if (pinSrc) {
      if (pinnedLocation) {
        pinSrc.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [pinnedLocation.lng, pinnedLocation.lat] },
              properties: {},
            },
          ],
        });
      } else {
        pinSrc.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [pinnedLocation]);

  // 2D / 3D Mode Toggle
  const toggle2D3D = () => {
    if (!mapRef.current) return;
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    localStorage.setItem('safecampus_3d_mode', String(next3D));

    mapRef.current.easeTo({
      pitch: next3D ? 58 : 0,
      bearing: next3D ? -20 : 0,
      duration: prefersReducedMotion ? 0 : 900,
    });
  };

  // Cinematic Campus Fly-In
  useEffect(() => {
    if (!mapRef.current || !selectedCampus) return;
    const map = mapRef.current;

    if (prefersReducedMotion) {
      map.setCenter([selectedCampus.lng, selectedCampus.lat]);
      map.setZoom(selectedCampus.zoom || 17);
      return;
    }

    map.flyTo({
      center: [selectedCampus.lng, selectedCampus.lat],
      zoom: selectedCampus.zoom || 17,
      pitch: is3DMode ? 60 : 0,
      bearing: -25,
      duration: 3200,
      essential: true,
    });
  }, [selectedCampus, prefersReducedMotion]);

  // 3D Safe Route Camera Flight Preview (10-second smooth traversal)
  const handlePreviewRouteFlight = useCallback(() => {
    if (!mapRef.current || !activeRoute || activeRoute.coordinates.length < 2) return;
    const map = mapRef.current;
    const coords = activeRoute.coordinates; // [[lat, lng], ...]

    setIsPlayingRoutePreview(true);

    if (prefersReducedMotion) {
      const bounds = coords.reduce(
        (b, c) => b.extend([c[1], c[0]]),
        new maplibregl.LngLatBounds([coords[0][1], coords[0][0]], [coords[0][1], coords[0][0]])
      );
      map.fitBounds(bounds, { padding: 40 });
      setIsPlayingRoutePreview(false);
      return;
    }

    let currentIndex = 0;
    const stepDuration = Math.round(9000 / Math.max(1, coords.length - 1));

    function flyNextStep() {
      if (currentIndex >= coords.length) {
        setIsPlayingRoutePreview(false);
        return;
      }

      const [lat, lng] = coords[currentIndex];
      const nextCoord = coords[currentIndex + 1];

      // Calculate bearing toward next point
      let bearing = -20;
      if (nextCoord) {
        const dLng = nextCoord[1] - lng;
        const dLat = nextCoord[0] - lat;
        bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI;
      }

      map.easeTo({
        center: [lng, lat],
        zoom: 17.8,
        pitch: 65, // Low angle forward 3D view
        bearing: bearing,
        duration: stepDuration,
        easing: (t: number) => t,
      });

      currentIndex++;
      setTimeout(flyNextStep, stepDuration);
    }

    flyNextStep();
  }, [activeRoute, prefersReducedMotion]);

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-safecampus-border shadow-2xl">
      {/* Fallback Notice Banner if OSM raster active */}
      {usingFallbackStyle && (
        <div className="absolute top-2 left-2 right-2 z-[1000] bg-amber-950/90 border border-amber-600/60 rounded-xl px-3 py-1.5 text-xs text-amber-200 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Vector style offline: Switched seamlessly to 2D OpenStreetMap raster view.</span>
          </div>
          <button
            onClick={() => setUsingFallbackStyle(false)}
            className="text-amber-400 font-bold hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Map Filter Controls Bar */}
      <div className="absolute top-3 left-3 right-14 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-safecampus-card/90 backdrop-blur-md text-slate-200 text-xs px-2.5 py-1.5 rounded-xl border border-safecampus-border shadow-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Categories ({reports.length})</option>
            <option value="harassment">Harassment</option>
            <option value="broken_lighting">Broken Lighting</option>
            <option value="cctv_blindspot">CCTV Blindspots</option>
            <option value="ragging_concern">Ragging</option>
            <option value="unsafe_pathway">Unsafe Pathways</option>
            <option value="suspicious_activity">Suspicious Activity</option>
          </select>

          {/* 2D / 3D Mode Toggle */}
          <button
            onClick={toggle2D3D}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md backdrop-blur-md transition border ${
              is3DMode
                ? 'bg-purple-900/90 text-purple-200 border-purple-500/60 ring-1 ring-purple-500/30'
                : 'bg-safecampus-card/90 text-slate-300 border-safecampus-border'
            }`}
            title="Toggle between 2D Top-Down and 3D Extruded Perspective"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>{is3DMode ? '3D View' : '2D View'}</span>
          </button>

          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 shadow-md backdrop-blur-md transition border ${
              showHeatmap
                ? 'bg-rose-900/80 text-rose-200 border-rose-500/60'
                : 'bg-safecampus-card/90 text-slate-300 border-safecampus-border'
            }`}
            title="Toggle native incident heatmap"
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-rose-400' : 'text-slate-400'}`} />
            <span>Heatmap</span>
          </button>

          {/* Safety Posts Toggle */}
          <button
            onClick={() => setShowCheckpoints((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 shadow-md backdrop-blur-md transition border ${
              showCheckpoints
                ? 'bg-indigo-900/80 text-indigo-200 border-indigo-500/60'
                : 'bg-safecampus-card/90 text-slate-300 border-safecampus-border'
            }`}
            title="Toggle Security booths and Helpdesks"
          >
            <Shield className={`w-3.5 h-3.5 ${showCheckpoints ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span>Posts</span>
          </button>
        </div>
      </div>

      {/* Floating Route Preview Flight Button (Active when route is selected) */}
      {activeRoute && (
        <div className="absolute top-14 left-3 z-[1000] pointer-events-auto flex items-center gap-2">
          <button
            onClick={handlePreviewRouteFlight}
            disabled={isPlayingRoutePreview}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition backdrop-blur-md border ${
              isPlayingRoutePreview
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white border-emerald-400/50'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{isPlayingRoutePreview ? 'Traversing Route...' : '3D Route Camera Preview'}</span>
          </button>
        </div>
      )}

      {/* MapLibre DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px] flex-1 relative z-0" />

      {/* Floating Bottom Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto bg-safecampus-dark/90 backdrop-blur-md border border-safecampus-border px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3 text-[11px] text-slate-300">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>High Risk (4-5)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Resolved / Safe</span>
        </div>
        {is3DMode && (
          <div className="flex items-center gap-1 text-[10px] text-purple-300 border-l border-slate-700 pl-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
            <span>3D Hostels</span>
          </div>
        )}
      </div>
    </div>
  );
};
