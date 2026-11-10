import React, { useState } from 'react';
import { Navigation, ShieldCheck, Zap, AlertTriangle, ArrowRight, Sun, Shield, Clock, Video } from 'lucide-react';
import { RouteOption, Report } from '../../types';
import { CAMPUS_LANDMARKS } from '../../services/mockData';
import { calculateCampusRoutes } from '../../services/routeEngine';
import { useDemo } from '../../context/DemoContext';

interface RouteSelectorProps {
  reports: Report[];
  onRouteSelected: (route: RouteOption) => void;
  onStartWalk: (route: RouteOption, destinationName: string) => void;
  onPreviewRoute?: (route: RouteOption) => void;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  reports,
  onRouteSelected,
  onStartWalk,
  onPreviewRoute,
}) => {
  const { isNightMode } = useDemo();

  const [startId, setStartId] = useState('library');
  const [destId, setDestId] = useState('girls_hostel');
  const [activeRouteId, setActiveRouteId] = useState<'fastest' | 'safest'>('safest');

  const { fastest, safest } = calculateCampusRoutes(startId, destId, reports, isNightMode);

  const selectedRoute = activeRouteId === 'safest' ? safest : fastest;

  const handleSelect = (routeId: 'fastest' | 'safest') => {
    setActiveRouteId(routeId);
    const chosen = routeId === 'safest' ? safest : fastest;
    onRouteSelected(chosen);
  };

  const destLandmark = CAMPUS_LANDMARKS.find((l) => l.id === destId);

  return (
    <div className="bg-safecampus-card rounded-2xl border border-safecampus-border p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-safecampus-border pb-4 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-brand-400" />
            Safe Route Navigator
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-medium mt-0.5">
            Pathfinding algorithm prioritizing well-lit, security-monitored paths over dark shortcuts.
          </p>
        </div>
        {isNightMode && (
          <span className="text-xs font-bold text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-800 self-start sm:self-auto shadow-sm">
            🌙 Night Risk Multiplier Active
          </span>
        )}
      </div>

      {/* Origin & Destination Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-1.5">
            Starting Point
          </label>
          <select
            value={startId}
            onChange={(e) => {
              setStartId(e.target.value);
              const { safest: updatedSafest } = calculateCampusRoutes(e.target.value, destId, reports, isNightMode);
              onRouteSelected(updatedSafest);
            }}
            className="w-full bg-slate-900 border border-safecampus-border rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
          >
            {CAMPUS_LANDMARKS.map((lm) => (
              <option key={lm.id} value={lm.id} disabled={lm.id === destId}>
                📍 {lm.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-1.5">
            Destination
          </label>
          <select
            value={destId}
            onChange={(e) => {
              setDestId(e.target.value);
              const { safest: updatedSafest } = calculateCampusRoutes(startId, e.target.value, reports, isNightMode);
              onRouteSelected(updatedSafest);
            }}
            className="w-full bg-slate-900 border border-safecampus-border rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
          >
            {CAMPUS_LANDMARKS.map((lm) => (
              <option key={lm.id} value={lm.id} disabled={lm.id === startId}>
                🎯 {lm.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Route Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* SAFEST ROUTE CARD */}
        <div
          onClick={() => handleSelect('safest')}
          className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer relative shadow-md ${
            activeRouteId === 'safest'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-emerald-950/60 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between mb-2.5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-800">
                Recommended
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                {safest.name}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                {safest.safety_score}<span className="text-xs font-normal text-slate-400">/100</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Safety Index</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 mb-2.5 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-400" /> {safest.estimated_time_minutes} min
            </span>
            <span>•</span>
            <span>{safest.distance_meters}m</span>
            <span>•</span>
            <span className="text-emerald-400 font-sans font-semibold">Brightly Lit</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {safest.rationale}
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              <Shield className="w-3.5 h-3.5" /> 2 Security Booths on path
            </span>
            <span className="text-slate-400">0 hazards flagged</span>
          </div>
        </div>

        {/* FASTEST ROUTE CARD */}
        <div
          onClick={() => handleSelect('fastest')}
          className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer relative shadow-md ${
            activeRouteId === 'fastest'
              ? 'bg-amber-950/40 border-amber-500 shadow-amber-950/60 ring-2 ring-amber-500/30'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between mb-2.5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-md border border-amber-800">
                Direct Shortcut
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1.5 flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                {fastest.name}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black text-amber-400">
                {fastest.safety_score}<span className="text-xs font-normal text-slate-400">/100</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Safety Index</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 mb-2.5 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-400" /> {fastest.estimated_time_minutes} min
            </span>
            <span>•</span>
            <span>{fastest.distance_meters}m</span>
            <span>•</span>
            <span className="text-rose-400 font-sans font-semibold">Poorly Lit</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {fastest.rationale}
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" /> Unpatrolled alley
            </span>
            <span className="text-rose-400 font-bold">{fastest.recent_incidents_nearby} hazards flagged</span>
          </div>
        </div>
      </div>

      {/* Action Buttons (16px font minimum, 48px height) */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onPreviewRoute && (
          <button
            type="button"
            onClick={() => onPreviewRoute(selectedRoute)}
            className="flex-1 min-h-[48px] py-3.5 bg-purple-950 hover:bg-purple-900 border border-purple-600/60 text-purple-200 font-bold rounded-xl text-base flex items-center justify-center gap-2 transition shadow-md"
          >
            <Video className="w-5 h-5 text-purple-400" />
            <span>Preview in 3D Flight</span>
          </button>
        )}
        <button
          onClick={() => onStartWalk(selectedRoute, destLandmark?.name || 'Destination')}
          className="flex-1 min-h-[48px] py-3.5 bg-gradient-to-r from-brand-700 to-brand-500 hover:from-brand-600 hover:to-brand-400 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-700/30 transition"
        >
          <span>Start &ldquo;Walk With Me&rdquo;</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
