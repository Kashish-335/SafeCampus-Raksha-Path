import React, { useState } from 'react';
import { Search, GraduationCap, MapPin, X, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { CampusLocation, PRESET_CAMPUSES, campusMapService } from '../../services/campusMapService';

interface CampusSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCampus: (campus: CampusLocation) => void;
  selectedCampusId?: string;
}

export const CampusSearchModal: React.FC<CampusSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCampus,
  selectedCampusId,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CampusLocation[]>(PRESET_CAMPUSES);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults(PRESET_CAMPUSES);
      return;
    }
    setIsSearching(true);
    try {
      const res = await campusMapService.searchCampuses(val);
      setResults(res);
    } catch {
      setResults(PRESET_CAMPUSES);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-safecampus-card border border-safecampus-border rounded-3xl max-w-md w-full p-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-safecampus-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-900/70 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Auto Campus Map Explorer</h3>
              <p className="text-[11px] text-slate-400">Search any university or switch campus</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close campus search">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search college, university, or city..."
            className="w-full bg-slate-900 border border-safecampus-border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-brand-400 absolute right-3 top-2.5 animate-spin" />
          )}
        </div>

        {/* Results List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-400" />
            {query.trim() ? 'Search Results (Nominatim / Overpass)' : 'Featured Universities'}
          </div>

          {results.map((campus) => {
            const isSelected = selectedCampusId === campus.id;
            return (
              <div
                key={campus.id}
                onClick={() => {
                  onSelectCampus(campus);
                  onClose();
                }}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                  isSelected
                    ? 'bg-purple-950/70 border-purple-500/60 text-white ring-1 ring-purple-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🏛️</span>
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{campus.shortName || campus.name}</span>
                      {campus.isPreloaded && (
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800">
                          3D Ready
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      📍 {campus.city || campus.country}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-brand-400 font-semibold">
                  <span>Fly-In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-safecampus-border text-[10px] text-slate-500 text-center">
          Nominatim OSM Geocoding • Overpass Vector Data • 3D Cinematic Fly-In
        </div>
      </div>
    </div>
  );
};
