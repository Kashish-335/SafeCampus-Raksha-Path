import React from 'react';
import { Map, AlertTriangle, Siren, Footprints, Users, BarChart3, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type TabType = 'map' | 'report' | 'sos' | 'walk' | 'profile' | 'admin' | 'earth-view';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const { isAdmin } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-safecampus-dark/95 backdrop-blur-lg border-t border-safecampus-border py-2 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-around relative">
        {/* 1. Safety Map Tab */}
        <button
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[72px] py-1.5 px-2 rounded-xl transition-all ${
            currentTab === 'map'
              ? 'text-white bg-brand-950/70 border border-brand-700/60 font-bold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
          }`}
          aria-label="Safety Map"
        >
          <Map className="w-5 sm:w-6 h-5 sm:h-6 mb-1 text-cyan-400" />
          <span className="text-xs sm:text-sm tracking-normal">Map</span>
        </button>

        {/* 2. Report Issue Tab */}
        <button
          onClick={() => onTabChange('report')}
          className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[72px] py-1.5 px-2 rounded-xl transition-all ${
            currentTab === 'report'
              ? 'text-white bg-brand-950/70 border border-brand-700/60 font-bold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
          }`}
          aria-label="Report Issue"
        >
          <AlertTriangle className="w-5 sm:w-6 h-5 sm:h-6 mb-1 text-amber-400" />
          <span className="text-xs sm:text-sm tracking-normal">Report</span>
        </button>

        {/* 3. CENTER EMERGENCY SOS BUTTON */}
        <div className="relative -top-3 sm:-top-4 flex flex-col items-center px-1">
          <button
            onClick={() => onTabChange('sos')}
            className={`w-14 sm:w-16 h-14 sm:h-16 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
              currentTab === 'sos'
                ? 'bg-rose-600 ring-4 ring-rose-400/50 shadow-rose-600/60 scale-105'
                : 'bg-gradient-to-tr from-rose-700 via-rose-600 to-brand-500 shadow-rose-900/70 hover:brightness-110'
            }`}
            aria-label="Silent Emergency SOS"
          >
            <Siren className="w-7 sm:w-8 h-7 sm:h-8 text-white animate-pulse" />
          </button>
          <span className="text-xs sm:text-sm font-extrabold text-rose-400 mt-1 uppercase tracking-wider">
            SOS
          </span>
        </div>

        {/* 4. Safe Walk Tab */}
        <button
          onClick={() => onTabChange('walk')}
          className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[72px] py-1.5 px-2 rounded-xl transition-all ${
            currentTab === 'walk'
              ? 'text-white bg-brand-950/70 border border-brand-700/60 font-bold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
          }`}
          aria-label="Walk With Me"
        >
          <Footprints className="w-5 sm:w-6 h-5 sm:h-6 mb-1 text-emerald-400" />
          <span className="text-xs sm:text-sm tracking-normal">Walk</span>
        </button>

        {/* 5. Earth View Tab */}
        <button
          onClick={() => onTabChange('earth-view')}
          className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[72px] py-1.5 px-2 rounded-xl transition-all ${
            currentTab === 'earth-view'
              ? 'text-white bg-cyan-950/70 border border-cyan-700/60 font-bold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
          }`}
          aria-label="Earth View 3D Globe"
        >
          <Globe className="w-5 sm:w-6 h-5 sm:h-6 mb-1 text-cyan-400" />
          <span className="text-xs sm:text-sm tracking-normal">Earth</span>
        </button>

        {/* 6. Profile / Admin Tab */}
        {isAdmin ? (
          <button
            onClick={() => onTabChange('admin')}
            className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[72px] py-1.5 px-2 rounded-xl transition-all ${
              currentTab === 'admin'
                ? 'text-white bg-purple-950/70 border border-purple-700/60 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
            }`}
            aria-label="Admin Dashboard"
          >
            <BarChart3 className="w-5 sm:w-6 h-5 sm:h-6 mb-1 text-purple-400" />
            <span className="text-xs sm:text-sm tracking-normal">Admin</span>
          </button>
        ) : (
          <button
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[72px] py-1.5 px-2 rounded-xl transition-all ${
              currentTab === 'profile'
                ? 'text-white bg-brand-950/70 border border-brand-700/60 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
            }`}
            aria-label="Safety Buddies"
          >
            <Users className="w-5 sm:w-6 h-5 sm:h-6 mb-1 text-brand-300" />
            <span className="text-xs sm:text-sm tracking-normal">Buddies</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
