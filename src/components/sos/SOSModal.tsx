import React from 'react';
import { Siren, CheckCircle2, Send, ExternalLink, ShieldCheck, Calculator, X } from 'lucide-react';
import { AlertDispatchResult } from '../../services/alertService';

interface SOSModalProps {
  dispatchResult: AlertDispatchResult | null;
  onClose: () => void;
  onOpenDisguise: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  dispatchResult,
  onClose,
  onOpenDisguise,
}) => {
  if (!dispatchResult) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-safecampus-card border-2 border-rose-600 rounded-3xl max-w-lg w-full p-5 shadow-2xl relative overflow-hidden">
        {/* Pulsing red banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-pulse" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/50 flex items-center justify-center">
              <Siren className="w-7 h-7 text-rose-500 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                Active Distress Alert
              </span>
              <h2 className="text-base font-extrabold text-white mt-0.5">
                Silent SOS Dispatched
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            aria-label="Close SOS alert modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channels Status Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold mb-1">Telegram Bot</div>
            <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold mb-1">SMS Alert</div>
            <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sent (Stub)
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold mb-1">Safety Buddies</div>
            <div className="text-xs font-bold text-purple-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 3 Notified
            </div>
          </div>
        </div>

        {/* Dispatch Recipients */}
        <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-800 mb-3 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
            👥 Verified Alert Recipients:
          </span>
          <ul className="space-y-1">
            {dispatchResult.dispatchDetails.recipients.map((rec, i) => (
              <li key={i} className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                <span className="text-emerald-400">✓</span> {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Telegram Message Payload Preview */}
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 mb-4 font-mono text-[11px] text-slate-300 max-h-32 overflow-y-auto">
          <div className="text-[10px] text-slate-500 font-sans font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <Send className="w-3 h-3 text-brand-400" /> Telegram & SMS Emergency Payload:
          </div>
          <pre className="whitespace-pre-wrap font-sans text-xs text-rose-200">
            {dispatchResult.dispatchDetails.formattedMessage}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenDisguise();
            }}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            Switch to Calculator Disguise
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition"
          >
            <ShieldCheck className="w-4 h-4" />
            I Am Safe / Stand Down
          </button>
        </div>
      </div>
    </div>
  );
};
