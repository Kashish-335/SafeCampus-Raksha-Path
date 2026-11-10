import React from 'react';
import { Sparkles, Moon, RefreshCw } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { useToast } from '../../context/ToastContext';

export const DemoModeBanner: React.FC = () => {
  const { isDemoMode, isNightMode, resetDemoData } = useDemo();
  const { showToast } = useToast();

  if (!isDemoMode) return null;

  const handleReset = () => {
    resetDemoData();
    showToast('Demo dataset reset to original campus incidents.', 'success');
  };

  return (
    <div className="bg-gradient-to-r from-brand-950 via-purple-950 to-slate-900 border-b border-brand-800/40 px-3 sm:px-6 py-2 text-sm text-slate-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center flex-wrap gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
          </span>
          <span className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-400" />
            HerHack Hackathon Live Demo:
          </span>
          <span className="text-slate-300 font-medium hidden sm:inline">
            Dehradun & Delhi Campuses • Live 3D Incident & Safe Route Tracking
          </span>
          {isNightMode && (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-900/80 text-indigo-200 border border-indigo-700/60 flex items-center gap-1">
              <Moon className="w-3 h-3" /> Night Risk Multiplier
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-xl border border-slate-700 transition shadow-sm"
            title="Reset dataset back to fresh demo records"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-400" />
            Reset Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoModeBanner;
