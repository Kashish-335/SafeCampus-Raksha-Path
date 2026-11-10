import React from 'react';
import { Shield, Moon, Sun, Calculator, UserCheck, ShieldAlert, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDemo } from '../../context/DemoContext';
import { CampusLocation } from '../../services/campusMapService';

interface MobileHeaderProps {
  onOpenDisguise: () => void;
  onOpenPrivacy: () => void;
  onOpenCampusSearch: () => void;
  currentCampus?: CampusLocation | null;
  currentTab: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenDisguise,
  onOpenPrivacy,
  onOpenCampusSearch,
  currentCampus,
}) => {
  const { isAdmin, loginAsStudent, loginAsAdmin } = useAuth();
  const { isNightMode, toggleNightMode } = useDemo();

  return (
    <header className="sticky top-0 z-40 bg-safecampus-dark/95 backdrop-blur-md border-b border-safecampus-border px-3 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Brand & Clear Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-safecampus-dark" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                SafeCampus
              </h1>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-900/90 text-brand-300 border border-brand-700/60 shadow-sm">
                Raksha Path
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Safer Campuses, Smarter Communities
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center flex-wrap gap-2 pt-1 sm:pt-0">
          {/* Campus Selector Button */}
          <button
            onClick={onOpenCampusSearch}
            title="Switch Campus / 3D Fly-In"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition text-sm font-semibold flex items-center gap-1.5 border border-slate-700 shadow-sm"
            aria-label="Switch campus"
          >
            <GraduationCap className="w-4 h-4 text-purple-400" />
            <span className="max-w-[130px] truncate">
              {currentCampus?.shortName || 'Select Campus'}
            </span>
          </button>

          {/* Quick Disguise Button */}
          <button
            onClick={onOpenDisguise}
            title="Calculator Disguise (Hide App Instantly)"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition text-sm font-semibold flex items-center gap-1.5 border border-slate-700 shadow-sm"
            aria-label="Disguise as calculator"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Disguise</span>
          </button>

          {/* Day / Night Mode Toggle */}
          <button
            onClick={toggleNightMode}
            title={isNightMode ? 'Switch to Day Mode' : 'Simulate Night Risk Scenario'}
            className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition border border-slate-700 shadow-sm flex items-center justify-center"
            aria-label="Toggle day or night mode"
          >
            {isNightMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Role Switcher (Student <-> Admin) */}
          <button
            onClick={isAdmin ? loginAsStudent : loginAsAdmin}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition border shadow-sm ${
              isAdmin
                ? 'bg-purple-900/80 text-purple-200 border-purple-500/60 hover:bg-purple-800/80'
                : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle between Student and Admin perspective"
          >
            <UserCheck className="w-4 h-4 text-brand-400" />
            <span>{isAdmin ? 'Admin View' : 'Student View'}</span>
          </button>

          {/* Privacy & Consent trigger */}
          <button
            onClick={onOpenPrivacy}
            className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition border border-slate-700 shadow-sm flex items-center justify-center"
            title="Privacy by Design & Data Retention"
            aria-label="Privacy settings"
          >
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
