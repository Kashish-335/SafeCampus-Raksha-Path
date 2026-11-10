import React from 'react';
import { ShieldCheck, Lock, Clock, EyeOff, Radio, Trash2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleClearCache = () => {
    localStorage.removeItem('safecampus_offline_queue_v1');
    showToast('Local temporary location cache purged.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-safecampus-card border border-safecampus-border rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-safecampus-border pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-950 border border-brand-800 flex items-center justify-center text-brand-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Privacy by Design & Consent
              </h2>
              <p className="text-xs text-slate-400">SafeCampus (Raksha Path) Data Manifesto</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close privacy modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-300">
          <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <EyeOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-0.5">100% Anonymous by Default</h4>
              <p className="text-slate-400 text-[11px]">
                Incident reports strip all personal telemetry, IP logs, and user IDs unless you explicitly toggle identifiable reporting for follow-up compensation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-0.5">24-Hour Ephemeral Location Purge</h4>
              <p className="text-slate-400 text-[11px]">
                Active GPS breadcrumbs used during Walk With Me journeys or SOS alerts are automatically shredded after 24 hours. Only aggregated hazard counts remain.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <Radio className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-0.5">Zero Passive Background Tracking</h4>
              <p className="text-slate-400 text-[11px]">
                The app never samples your location in the background. GPS coordinates are requested strictly upon manual user intent (submitting a report, initiating a walk, or pressing SOS).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <Lock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-0.5">Privacy-Preserving Safety Buddies</h4>
              <p className="text-slate-400 text-[11px]">
                Volunteer students only see an approximate randomized radius circle (~200m). Exact pinpoint coordinates are shared only after the buddy explicitly accepts the distress alert.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-safecampus-border flex items-center justify-between">
          <button
            onClick={handleClearCache}
            className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Local Telemetry Cache
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-brand-700 to-brand-500 hover:brightness-110 text-white font-bold rounded-xl text-xs transition"
          >
            Understood & Acknowledged
          </button>
        </div>
      </div>
    </div>
  );
};
