/**
 * Earth View - CesiumJS 3D Campus Explorer
 * 
 * Interactive 3D globe for exploring Dehradun colleges and universities.
 * Uses CesiumJS with high-resolution Esri World Satellite imagery & OpenStreetMap.
 * Watermark-free, free-tier compliant, and gracefully handles invalid Cesium Ion tokens.
 */

import React, { useRef, useState, useEffect } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { CampusLocation, PRESET_CAMPUSES } from '../services/campusMapService';
import { Globe, ArrowLeft, Building2, MapPin, AlertCircle, RefreshCw, Compass, Layers } from 'lucide-react';

// Ensure Cesium static asset base URL is configured
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium/';
}

interface EarthViewProps {
  selectedCampus?: CampusLocation;
  onSelectCampus?: (campus: CampusLocation) => void;
  onBackToMap?: () => void;
}

type ImagerySource = 'satellite' | 'street';

export const EarthView: React.FC<EarthViewProps> = ({
  selectedCampus = PRESET_CAMPUSES[1], // default UPES Bidholi if not passed
  onSelectCampus,
  onBackToMap,
}) => {
  const CesiumIonToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [initStatus, setInitStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [imagerySource, setImagerySource] = useState<ImagerySource>('satellite');

  const dehradunCampuses = PRESET_CAMPUSES.filter((c) => c.cityGroup === 'Dehradun');

  // Factory function to build legitimate, watermark-free imagery layers
  const buildImageryLayer = (source: ImagerySource): Cesium.ImageryLayer => {
    if (source === 'satellite') {
      // Esri World Imagery (high-resolution global satellite photography, no watermarks, free for non-commercial web display)
      return new Cesium.ImageryLayer(
        new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
          credit: '© Esri, Maxar, Earthstar Geographics',
        })
      );
    } else {
      // Official OpenStreetMap standard cartography (free open data, no watermarks)
      return new Cesium.ImageryLayer(
        new Cesium.UrlTemplateImageryProvider({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          maximumLevel: 19,
          credit: '© OpenStreetMap contributors',
        })
      );
    }
  };

  const handleToggleImagery = (source: ImagerySource) => {
    setImagerySource(source);
    if (!viewerRef.current || viewerRef.current.isDestroyed()) return;
    try {
      const layers = viewerRef.current.imageryLayers;
      layers.removeAll();
      layers.add(buildImageryLayer(source));
      console.log(`[SafeCampus EarthView] Switched base imagery to: ${source}`);
    } catch (err) {
      console.warn('[SafeCampus EarthView] Could not switch imagery layer:', err);
    }
  };

  const flyToCampus = (campus: CampusLocation) => {
    if (!viewerRef.current || viewerRef.current.isDestroyed()) return;
    try {
      console.log(`[SafeCampus EarthView] Flying camera to ${campus.shortName} (${campus.lat}, ${campus.lng})`);
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(campus.lng, campus.lat, 2200),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
        duration: 2.2,
      });
      if (onSelectCampus) {
        onSelectCampus(campus);
      }
    } catch (err) {
      console.warn('[SafeCampus EarthView] Camera flyTo warning:', err);
    }
  };

  const resetCamera = () => {
    if (!viewerRef.current || viewerRef.current.isDestroyed()) return;
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(78.0322, 30.3165, 35000), // Dehradun Valley overview
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-60),
        roll: 0,
      },
      duration: 2,
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let viewer: Cesium.Viewer | null = null;
    let isCancelled = false;

    const initCesium = async () => {
      try {
        console.log('[SafeCampus EarthView] Initializing Cesium Globe...');
        console.log('[SafeCampus EarthView] Container dimensions:', containerRef.current?.clientWidth, 'x', containerRef.current?.clientHeight);

        setInitStatus('loading');

        if (CesiumIonToken) {
          Cesium.Ion.defaultAccessToken = CesiumIonToken;
        }

        // Use Esri World Satellite imagery as default (watermark-free and highly detailed)
        const initialLayer = buildImageryLayer('satellite');

        // Create the Cesium viewer with robust ellipsoid terrain
        viewer = new Cesium.Viewer(containerRef.current!, {
          baseLayer: initialLayer,
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          shouldAnimate: true,
        });

        if (isCancelled) {
          viewer.destroy();
          return;
        }

        viewerRef.current = viewer;

        // Configure atmospheric lighting and sky
        if (viewer.scene.globe) {
          viewer.scene.globe.enableLighting = false; // Prevents nighttime side from rendering dark/black
          viewer.scene.globe.depthTestAgainstTerrain = false;
        }

        // Add pins for all Dehradun campuses
        dehradunCampuses.forEach((camp) => {
          if (!viewer || viewer.isDestroyed()) return;
          viewer.entities.add({
            id: `campus-${camp.id}`,
            name: camp.shortName,
            description: camp.name,
            position: Cesium.Cartesian3.fromDegrees(camp.lng, camp.lat, 0),
            point: {
              pixelSize: 10,
              color: Cesium.Color.fromCssColorString('#06b6d4'),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
            },
            label: {
              text: camp.shortName,
              font: '12px Plus Jakarta Sans, sans-serif',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.fromCssColorString('#0f172a'),
              outlineWidth: 3,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -12),
            },
          });
        });

        // Try to asynchronously add OSM 3D Buildings if Ion token allows
        if (CesiumIonToken) {
          Cesium.createOsmBuildingsAsync()
            .then((osmBuildings) => {
              if (!isCancelled && viewer && !viewer.isDestroyed()) {
                viewer.scene.primitives.add(osmBuildings);
                console.log('[SafeCampus EarthView] Cesium OSM 3D buildings loaded successfully');
              }
            })
            .catch((bErr) => {
              console.warn('[SafeCampus EarthView] OSM buildings note (token 401, rendering high-res satellite 2D rooftops):', bErr?.message || bErr);
            });
        }

        // Fly camera to target campus or Dehradun valley
        const target = selectedCampus || dehradunCampuses[0];
        if (target) {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(target.lng, target.lat, 2500),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-45),
              roll: 0,
            },
            duration: 1.8,
          });
        }

        if (!isCancelled) {
          setInitStatus('ready');
          console.log('[SafeCampus EarthView] Cesium Globe ready with watermark-free imagery.');
        }
      } catch (err: any) {
        console.error('[SafeCampus EarthView] Initialization error:', err);
        if (!isCancelled) {
          setInitStatus('error');
          setErrorMessage(err?.message || 'Cesium WebGL rendering initialization failed.');
        }
      }
    };

    // Small delay ensures flex layout has non-zero computed width/height
    const timer = setTimeout(() => {
      initCesium();
    }, 50);

    const handleResize = () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
      viewerRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden bg-slate-950 border border-safecampus-border shadow-2xl flex flex-col">
      {/* 3D Globe Canvas Container */}
      <div
        ref={containerRef}
        className="w-full flex-1 min-h-[480px] relative"
        style={{ minHeight: '480px' }}
      />

      {/* Floating Top Controls Toolbar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-auto">
        <div className="flex items-center gap-2">
          {onBackToMap && (
            <button
              onClick={onBackToMap}
              className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-100 rounded-xl border border-safecampus-border backdrop-blur-md shadow-lg flex items-center gap-2 text-sm font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4 text-brand-400" />
              <span>Back to Campus Map</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-900/80 rounded-xl border border-safecampus-border text-xs text-slate-300 backdrop-blur-md">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">Earth View 3D</span>
          </div>
        </div>

        {/* Imagery Mode Toggle & Quick Fly-To College Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-safecampus-border">
          {/* Imagery Switcher */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => handleToggleImagery('satellite')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition ${
                imagerySource === 'satellite'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Esri World Satellite Imagery (Watermark-free)"
            >
              Satellite
            </button>
            <button
              onClick={() => handleToggleImagery('street')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition ${
                imagerySource === 'street'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="OpenStreetMap Cartography"
            >
              Street
            </button>
          </div>

          <Building2 className="w-4 h-4 text-brand-400 ml-1" />
          <select
            value={selectedCampus?.id || ''}
            onChange={(e) => {
              const camp = PRESET_CAMPUSES.find((c) => c.id === e.target.value);
              if (camp) flyToCampus(camp);
            }}
            className="bg-slate-800 text-white text-xs font-medium rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="" disabled>Fly to Dehradun College...</option>
            {dehradunCampuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName}
              </option>
            ))}
          </select>
          <button
            onClick={resetCamera}
            title="Overview of Dehradun Valley"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Quick College Selector Pills at Bottom */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 overflow-x-auto pb-1 z-10 pointer-events-auto scrollbar-none">
        {dehradunCampuses.map((c) => (
          <button
            key={c.id}
            onClick={() => flyToCampus(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 backdrop-blur-md shadow-md border ${
              selectedCampus?.id === c.id
                ? 'bg-brand-600/90 text-white border-brand-400 ring-2 ring-brand-400/30'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800/90'
            }`}
          >
            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>{c.shortName}</span>
          </button>
        ))}
      </div>

      {/* Loading Overlay */}
      {initStatus === 'loading' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-20">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Loading Earth View 3D Globe...</h3>
          <p className="text-sm text-slate-300 max-w-md">
            Initializing Cesium 3D Globe with satellite photography and Dehradun college locations.
          </p>
        </div>
      )}

      {/* Error Fallback Overlay with Working Back Button */}
      {initStatus === 'error' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-20">
          <div className="p-4 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-400 mb-4">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Earth View is temporarily unavailable</h3>
          <p className="text-sm text-slate-400 max-w-md mb-5">
            {errorMessage || 'Failed to initialize Cesium 3D Globe engine. You can safely return to the SafeCampus map.'}
          </p>
          {onBackToMap && (
            <button
              onClick={onBackToMap}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition shadow-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Campus Map</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EarthView;
