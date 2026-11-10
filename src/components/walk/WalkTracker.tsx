import React, { useState, useEffect } from 'react';
import { RouteOption } from '../../types';
import { Footprints, Clock, ShieldCheck, AlertTriangle, CheckCircle2, Siren, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dispatchEmergencyAlert, AlertDispatchResult } from '../../services/alertService';
import confetti from 'canvas-confetti';

interface WalkTrackerProps {
  route: RouteOption;
  destinationName: string;
  onEndTrip: () => void;
  onTriggerSOS: (result: AlertDispatchResult) => void;
}

export const WalkTracker: React.FC<WalkTrackerProps> = ({
  route,
  destinationName,
  onEndTrip,
  onTriggerSOS,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [secondsRemaining, setSecondsRemaining] = useState(route.estimated_time_minutes * 60);
  const [checkInCountdown, setCheckInCountdown] = useState(120); // 2-min checkin prompt
  const [checkInRequired, setCheckInRequired] = useState(false);
  const [hasDeviated, setHasDeviated] = useState(false);

  // Active ETA Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleMissedCheckinAlert();
          return 0;
        }
        return prev - 1;
      });

      setCheckInCountdown((prev) => {
        if (prev <= 1) {
          setCheckInRequired(true);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleConfirmCheckin = () => {
    setCheckInRequired(false);
    setCheckInCountdown(120);
    showToast('Check-in confirmed. Live trip telemetry safe.', 'success');
  };

  const handleSimulateDeviation = async () => {
    setHasDeviated(true);
    showToast('⚠️ Route deviation (>50m off course) detected! Auto-alerting contacts...', 'sos');

    const result = await dispatchEmergencyAlert({
      latitude: 28.5441,
      longitude: 77.1897,
      locationName: `Off-route near Block C while walking to ${destinationName}`,
      triggerType: 'walk_deviation',
      userName: user.full_name,
      contacts: user.emergency_contacts,
      audioRecorded: true,
    });

    onTriggerSOS(result);
  };

  const handleMissedCheckinAlert = async () => {
    showToast('🚨 Missed safety check-in! Automated emergency alert triggered.', 'sos');
    const result = await dispatchEmergencyAlert({
      latitude: route.coordinates[0][0],
      longitude: route.coordinates[0][1],
      locationName: `En-route to ${destinationName} (Missed Check-in)`,
      triggerType: 'walk_deviation',
      userName: user.full_name,
      contacts: user.emergency_contacts,
    });
    onTriggerSOS(result);
  };

  const handleArriveSafely = () => {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#ec4899'],
    });
    showToast(`🎉 You have safely arrived at ${destinationName}!`, 'success');
    onEndTrip();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-safecampus-card rounded-2xl border-2 border-emerald-500/50 p-5 shadow-2xl relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-safecampus-border pb-3 mb-4">
        <button
          onClick={onEndTrip}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Cancel Trip
        </button>
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Active Trip Monitoring
        </span>
      </div>

      <div className="text-center mb-6">
        <div className="text-xs text-slate-400 mb-1">Walking toward</div>
        <h3 className="text-xl font-extrabold text-white flex items-center justify-center gap-2">
          <Footprints className="w-5 h-5 text-brand-400 animate-bounce" />
          {destinationName}
        </h3>
        <p className="text-xs text-emerald-400 font-semibold mt-1">
          {route.name} (Safety Index {route.safety_score}/100)
        </p>
      </div>

      {/* Countdown Timer Display */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-center max-w-xs mx-auto mb-6">
        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
          <Clock className="w-3.5 h-3.5 text-brand-400" /> Estimated Time Remaining
        </div>
        <div className="text-4xl font-extrabold text-white font-mono tracking-tight">
          {formatTime(secondsRemaining)}
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          Next check-in prompt in: <strong className="text-slate-300">{formatTime(checkInCountdown)}</strong>
        </div>
      </div>

      {/* Check-in Notification Banner if Required */}
      {checkInRequired && (
        <div className="bg-amber-950/80 border border-amber-600/70 rounded-xl p-3 mb-4 animate-bounce-in text-center">
          <p className="text-xs font-bold text-amber-200 mb-2">
            Are you okay? Automated safety check-in prompt:
          </p>
          <button
            onClick={handleConfirmCheckin}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold rounded-lg text-xs shadow-md"
          >
            Yes, I Am Safe (Confirm Check-in)
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2.5">
        <button
          onClick={handleArriveSafely}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition"
        >
          <CheckCircle2 className="w-4 h-4" />
          I Have Arrived Safely
        </button>

        {/* Hackathon Simulation Trigger: 50m Deviation */}
        <button
          onClick={handleSimulateDeviation}
          className="w-full py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-rose-800 transition"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          Simulate 50m Route Deviation (Auto-Alert)
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-[10px] text-slate-400">
        Trusted contacts ({user.emergency_contacts.length}) can view your encrypted live telemetry.
      </div>
    </div>
  );
};
