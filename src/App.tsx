import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoProvider, useDemo } from './context/DemoContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav, TabType } from './components/layout/BottomNav';
import { DemoModeBanner } from './components/layout/DemoModeBanner';
import { SafetyMap } from './components/map/SafetyMap';
import { CampusSearchModal } from './components/map/CampusSearchModal';
import EarthView from './components/EarthView';
import { ReportForm } from './components/report/ReportForm';
import { ReportTracker } from './components/report/ReportTracker';
import { SOSButton } from './components/sos/SOSButton';
import { SOSModal } from './components/sos/SOSModal';
import { CalculatorDisguise } from './components/sos/CalculatorDisguise';
import { RouteSelector } from './components/walk/RouteSelector';
import { WalkTracker } from './components/walk/WalkTracker';
import { BuddyList } from './components/buddies/BuddyList';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PrivacyConsentModal } from './components/auth/PrivacyConsentModal';
import { dataService } from './services/dataService';
import { Report, SafetyCheckpoint, SafetyBuddy, RouteOption } from './types';
import { AlertDispatchResult } from './services/alertService';
import { CampusLocation, PRESET_CAMPUSES } from './services/campusMapService';
import { Shield, MapPin, Eye, Sparkles } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<TabType>('map');
  const [reports, setReports] = useState<Report[]>([]);
  const [checkpoints, setCheckpoints] = useState<SafetyCheckpoint[]>([]);
  const [buddies, setBuddies] = useState<SafetyBuddy[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Campus Selection & 3D Fly-In
  const [selectedCampus, setSelectedCampus] = useState<CampusLocation>(PRESET_CAMPUSES[0]);
  const [isCampusSearchOpen, setIsCampusSearchOpen] = useState<boolean>(false);

  // Safe Route & Walk state
  const [activeRoute, setActiveRoute] = useState<RouteOption | null>(null);
  const [walkSession, setWalkSession] = useState<{ route: RouteOption; destinationName: string } | null>(null);
  const [liveSosLocation, setLiveSosLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Modals state
  const [isDisguiseOpen, setIsDisguiseOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [activeSOSResult, setActiveSOSResult] = useState<AlertDispatchResult | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [reps, cps, buds] = await Promise.all([
        dataService.getReports(),
        dataService.getCheckpoints(),
        dataService.getSafetyBuddies(),
      ]);
      setReports(reps);
      setCheckpoints(cps);
      setBuddies(buds);
    }
    loadData();

    // Online listener
    const handleOnline = () => {
      showToast('Back online! Syncing offline queue...', 'success');
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // When admin role is toggled, jump to admin tab
  useEffect(() => {
    if (isAdmin && currentTab === 'profile') {
      setCurrentTab('admin');
    }
  }, [isAdmin]);

  const handleReportSubmitted = (newReport: Report) => {
    setReports((prev) => [newReport, ...prev]);
    setSelectedReport(newReport);
    setPinnedLocation(null);
  };

  const handleReportUpdated = (updated: Report) => {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedReport?.id === updated.id) {
      setSelectedReport(updated);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPinnedLocation({ lat, lng });
    showToast(`Pinned location (${lat.toFixed(4)}, ${lng.toFixed(4)}) for report.`, 'info');
  };

  return (
    <div className="min-h-screen bg-safecampus-dark flex flex-col font-sans pb-20 select-none">
      {/* Mobile Top App Header */}
      <MobileHeader
        currentTab={currentTab}
        currentCampus={selectedCampus}
        onOpenDisguise={() => setIsDisguiseOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenCampusSearch={() => setIsCampusSearchOpen(true)}
      />

      {/* Demo Mode & Hackathon Banner */}
      <DemoModeBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-28">
        {/* TAB 1: 3D SAFETY MAP VIEW */}
        {currentTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  Explore Campus Map
                </h2>
                <p className="text-sm sm:text-base text-slate-300 font-medium mt-0.5">
                  Realtime 3D safety checkpoints, incident hotspots, and verified college zones.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 shadow-sm">
                  📍 {selectedCampus.name}
                </span>
              </div>
            </div>

            <div className="h-[480px] sm:h-[560px] lg:h-[620px] w-full rounded-2xl overflow-hidden shadow-2xl border border-safecampus-border">
              <SafetyMap
                reports={reports}
                checkpoints={checkpoints}
                buddies={buddies}
                selectedReport={selectedReport}
                onSelectReport={(r) => setSelectedReport(r)}
                onMapClick={handleMapClick}
                pinnedLocation={pinnedLocation}
                activeRoute={activeRoute}
                selectedCampus={selectedCampus}
                liveSosLocation={liveSosLocation}
              />
            </div>

            {/* Selected Report Detail Card if clicked */}
            {selectedReport && (
              <div className="p-5 rounded-2xl bg-safecampus-card border border-safecampus-border shadow-2xl animate-fadeIn">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-300 bg-brand-950 px-2.5 py-1 rounded-lg border border-brand-800">
                      {selectedReport.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-1.5">
                      {selectedReport.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-sm font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm sm:text-base text-slate-200 mb-3 leading-relaxed">
                  📍 <strong className="text-white">{selectedReport.location_name}</strong> — {selectedReport.description}
                </p>
                {selectedReport.ai_summary && (
                  <div className="text-sm text-purple-200 bg-purple-950/70 p-3 rounded-xl border border-purple-800/40 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="font-medium">{selectedReport.ai_summary}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-300 pt-2 border-t border-slate-800">
                  <span>Urgency: <strong className="text-rose-400 text-sm">{selectedReport.urgency}/5</strong></span>
                  <span>Status: <strong className="text-emerald-400 uppercase text-sm">{selectedReport.status}</strong></span>
                  {selectedReport.assigned_to && <span>Assigned to: <strong className="text-slate-100">{selectedReport.assigned_to}</strong></span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANONYMOUS REPORT & ISSUE TRACKER */}
        {currentTab === 'report' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Report Incident
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-medium mt-0.5">
                Anonymous and confidential issue reporting with AI hazard classification.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ReportForm
                existingReports={reports}
                onReportSubmitted={handleReportSubmitted}
                initialLocation={pinnedLocation || undefined}
              />
              <ReportTracker
                reports={reports}
                onSelectReport={(r) => {
                  setSelectedReport(r);
                  setCurrentTab('map');
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 3: SILENT EMERGENCY SOS */}
        {currentTab === 'sos' && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="text-center pb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Emergency SOS
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-medium mt-0.5">
                Instant multi-channel emergency broadcast with live GPS tracking.
              </p>
            </div>
            <SOSButton
              onSOSDispatched={(result) => {
                setActiveSOSResult(result);
                setLiveSosLocation({ lat: 28.5480, lng: 77.1905 });
              }}
            />
          </div>
        )}

        {/* TAB 4: WALK WITH ME & SAFE ROUTE NAVIGATOR */}
        {currentTab === 'walk' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-center pb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Safe Walk Navigator
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-medium mt-0.5">
                AI-patrolled and brightly lit campus paths with live companion tracking.
              </p>
            </div>
            {walkSession ? (
              <WalkTracker
                route={walkSession.route}
                destinationName={walkSession.destinationName}
                onEndTrip={() => {
                  setWalkSession(null);
                  setActiveRoute(null);
                }}
                onTriggerSOS={(res) => {
                  setActiveSOSResult(res);
                  setLiveSosLocation({ lat: 28.5441, lng: 77.1897 });
                }}
              />
            ) : (
              <RouteSelector
                reports={reports}
                onRouteSelected={(route) => {
                  setActiveRoute(route);
                }}
                onPreviewRoute={(route) => {
                  setActiveRoute(route);
                  setCurrentTab('map');
                  showToast(`Camera previewing ${route.name} in 3D...`, 'info');
                }}
                onStartWalk={(route, destName) => {
                  setActiveRoute(route);
                  setWalkSession({ route, destinationName: destName });
                }}
              />
            )}
          </div>
        )}

        {/* TAB 5: PEER SAFETY BUDDIES & PROFILE */}
        {currentTab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="text-center pb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Peer Safety Buddies
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-medium mt-0.5">
                Verified student responders and trusted emergency escort network.
              </p>
            </div>
            <BuddyList buddies={buddies} />
          </div>
        )}

        {/* TAB 6: ADMIN DASHBOARD */}
        {currentTab === 'admin' && (
          <div className="space-y-4">
            <AdminDashboard reports={reports} onReportUpdated={handleReportUpdated} />
          </div>
        )}

        {/* TAB 7: CESIUM 3D EARTH VIEW */}
        {currentTab === 'earth-view' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  Earth View 3D Globe
                </h2>
                <p className="text-sm sm:text-base text-slate-300 font-medium mt-0.5">
                  Interactive global 3D explorer for Dehradun universities and institutions.
                </p>
              </div>
            </div>
            <div className="h-[480px] sm:h-[580px] lg:h-[620px] w-full">
              <EarthView
                selectedCampus={selectedCampus}
                onSelectCampus={(c) => {
                  setSelectedCampus(c);
                  showToast(`Camera viewing ${c.shortName} on 3D Globe`, 'info');
                }}
                onBackToMap={() => setCurrentTab('map')}
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav currentTab={currentTab} onTabChange={(t) => setCurrentTab(t)} />

      {/* Auto Campus Map Search & Fly-In Modal */}
      <CampusSearchModal
        isOpen={isCampusSearchOpen}
        onClose={() => setIsCampusSearchOpen(false)}
        selectedCampusId={selectedCampus.id}
        onSelectCampus={(c) => {
          setSelectedCampus(c);
          showToast(`Flying into ${c.shortName} in 3D...`, 'info');
        }}
      />

      {/* Fake Calculator Disguise Screen */}
      <CalculatorDisguise
        isOpen={isDisguiseOpen}
        onClose={() => setIsDisguiseOpen(false)}
        onSilentTriggerSOS={() => {
          showToast('Silent SOS triggered from Calculator Keypad (911=)', 'sos');
        }}
      />

      {/* SOS Dispatched Details Modal */}
      <SOSModal
        dispatchResult={activeSOSResult}
        onClose={() => setActiveSOSResult(null)}
        onOpenDisguise={() => {
          setActiveSOSResult(null);
          setIsDisguiseOpen(true);
        }}
      />

      {/* Privacy and Consent Modal */}
      <PrivacyConsentModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <ToastProvider>
          <MainAppContent />
        </ToastProvider>
      </DemoProvider>
    </AuthProvider>
  );
}
