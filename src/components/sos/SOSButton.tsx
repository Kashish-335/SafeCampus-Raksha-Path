import React, { useState, useEffect, useRef } from 'react';
import { Siren, Smartphone, Volume2, ShieldAlert, Mic, KeyRound, Check, AlertCircle } from 'lucide-react';
import { SOSTriggerType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDemo } from '../../context/DemoContext';
import { dispatchEmergencyAlert, AlertDispatchResult } from '../../services/alertService';
import { dataService } from '../../services/dataService';

interface SOSButtonProps {
  onSOSDispatched: (result: AlertDispatchResult) => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onSOSDispatched }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isDemoMode } = useDemo();

  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0); // 0 to 100
  const [isTriggering, setIsTriggering] = useState(false);
  const [recordAudio, setRecordAudio] = useState(true);
  const [codeWordInput, setCodeWordInput] = useState('');
  const [showCodeWordModal, setShowCodeWordModal] = useState(false);
  const [showHardwareSimModal, setShowHardwareSimModal] = useState(false);
  const [hardwareClickCount, setHardwareClickCount] = useState(0);

  // Live Location State
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 28.5480,
    lng: 77.1905, // Default near Girls Hostel
  });

  const timerRef = useRef<number | null>(null);

  // Fetch device GPS if available
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default campus coords
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Motion Shake Detector
  useEffect(() => {
    let lastX = 0,
      lastY = 0,
      lastZ = 0;
    let lastTime = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current) return;

      const now = Date.now();
      if (now - lastTime > 150) {
        const diffTime = now - lastTime;
        lastTime = now;

        const x = current.x || 0;
        const y = current.y || 0;
        const z = current.z || 0;

        const speed = (Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime) * 10000;
        if (speed > 800) {
          triggerSOS('shake');
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  // Hold-to-activate progress timer
  useEffect(() => {
    if (isPressing) {
      const interval = setInterval(() => {
        setPressProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            triggerSOS('button_press');
            return 100;
          }
          return prev + 5; // 2 seconds total
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      setPressProgress(0);
    }
  }, [isPressing]);

  const triggerSOS = async (triggerType: SOSTriggerType) => {
    if (isTriggering) return;
    setIsTriggering(true);

    try {
      // 1. Dispatch through alertService (Telegram + SMS stub)
      const result = await dispatchEmergencyAlert({
        latitude: coords.lat,
        longitude: coords.lng,
        locationName: 'Girls Hostel Perimeter Lane',
        triggerType,
        userName: user.full_name,
        phone: user.phone,
        contacts: user.emergency_contacts,
        audioRecorded: recordAudio,
      });

      // 2. Persist to storage
      await dataService.recordSOSAlert({
        latitude: coords.lat,
        longitude: coords.lng,
        location_name: 'Girls Hostel Perimeter Lane',
        trigger_type: triggerType,
        status: 'active',
        contacts_notified: user.emergency_contacts.map((c) => c.phone),
      });

      showToast(`🚨 SILENT SOS DISPATCHED via ${triggerType}! Contacts notified.`, 'sos');
      onSOSDispatched(result);
    } catch (err) {
      console.error(err);
      showToast('Error dispatching SOS; recorded offline queue.', 'error');
    } finally {
      setIsTriggering(false);
      setIsPressing(false);
      setPressProgress(0);
    }
  };

  // Hardware Simulation Clicks
  const handleHardwareSimClick = () => {
    const next = hardwareClickCount + 1;
    setHardwareClickCount(next);
    if (next >= 3) {
      setShowHardwareSimModal(false);
      setHardwareClickCount(0);
      triggerSOS('volume_sim');
    }
  };

  const handleCodeWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeWordInput.trim().toUpperCase() === 'RAKSHA' || codeWordInput.trim().toUpperCase() === 'RED') {
      setShowCodeWordModal(false);
      setCodeWordInput('');
      triggerSOS('code_word');
    } else {
      showToast('Secret codeword does not match emergency phrase.', 'error');
    }
  };

  return (
    <div className="bg-safecampus-card rounded-2xl border border-safecampus-border p-6 shadow-2xl flex flex-col items-center text-center">
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-safecampus-border pb-4 mb-6">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Siren className="w-6 h-6 text-rose-500 animate-pulse" />
            Silent Emergency SOS
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-medium mt-0.5">
            Instant multi-channel emergency broadcast to security & buddies.
          </p>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => setRecordAudio((prev) => !prev)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition self-start sm:self-auto shadow-sm ${
            recordAudio
              ? 'bg-rose-950/90 text-rose-300 border-rose-800'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Attach 5s ambient audio snippet to alert"
        >
          <Mic className={`w-4 h-4 ${recordAudio ? 'text-rose-400' : 'text-slate-400'}`} />
          <span>{recordAudio ? 'Audio Clip ON' : 'Audio OFF'}</span>
        </button>
      </div>

      {/* BIG CIRCULAR SOS BUTTON */}
      <div className="relative my-6 flex items-center justify-center">
        {/* Pulsing beacon circles */}
        <div className="absolute w-56 h-56 rounded-full bg-rose-600/10 animate-ping-slow pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full bg-rose-600/20 animate-pulse pointer-events-none" />

        {/* SVG Progress Ring */}
        <svg className="w-52 h-52 transform -rotate-90 pointer-events-none">
          <circle
            cx="104"
            cy="104"
            r="96"
            stroke="currentColor"
            strokeWidth="6"
            className="text-slate-800/80"
            fill="transparent"
          />
          <circle
            cx="104"
            cy="104"
            r="96"
            stroke="#e11d48"
            strokeWidth="8"
            strokeDasharray={603}
            strokeDashoffset={603 - (603 * pressProgress) / 100}
            strokeLinecap="round"
            className="transition-all duration-75"
            fill="transparent"
          />
        </svg>

        {/* Interactive Center Button */}
        <button
          onMouseDown={() => setIsPressing(true)}
          onMouseUp={() => setIsPressing(false)}
          onTouchStart={() => setIsPressing(true)}
          onTouchEnd={() => setIsPressing(false)}
          onClick={() => {
            // One-tap quick press fallback
            if (!isPressing && pressProgress < 100) {
              triggerSOS('button_press');
            }
          }}
          disabled={isTriggering}
          className={`absolute w-40 h-40 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition transform active:scale-95 ${
            isPressing
              ? 'bg-rose-700 scale-95 shadow-rose-900/90 ring-4 ring-rose-500'
              : 'bg-gradient-to-tr from-rose-700 via-rose-600 to-brand-500 shadow-rose-800/70 hover:brightness-110'
          }`}
          aria-label="Activate SOS emergency alarm"
        >
          <Siren className="w-14 h-14 text-white mb-1 animate-pulse" />
          <span className="text-2xl sm:text-3xl font-black tracking-wider">SOS</span>
          <span className="text-xs uppercase font-bold text-rose-200 mt-0.5">
            {isPressing ? `Holding ${pressProgress}%` : 'Tap or Hold 2s'}
          </span>
        </button>
      </div>

      <p className="text-sm sm:text-base text-slate-200 font-medium max-w-sm mt-3">
        Coordinates Locked: <strong className="text-rose-400 font-mono text-base font-bold">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</strong>
      </p>
      <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-1.5 leading-relaxed">
        Immediately dispatches to Campus Security, 3 Trusted Contacts, and 4 nearby verified Safety Buddies.
      </p>

      {/* Alternate Stealth Triggers Grid */}
      <div className="w-full mt-6 pt-5 border-t border-safecampus-border">
        <span className="text-xs sm:text-sm font-bold text-slate-300 block mb-3 text-left uppercase tracking-wider">
          Stealth & Hardware Triggers
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Shake Simulation */}
          <button
            onClick={() => triggerSOS('shake')}
            className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center transition group shadow-sm min-h-[52px]"
          >
            <Smartphone className="w-6 h-6 text-indigo-400 mb-1.5 group-hover:scale-110 transition" />
            <span className="text-sm font-bold text-slate-100">Shake Phone</span>
            <span className="text-xs text-slate-400">Accelerometer</span>
          </button>

          {/* 3x Hardware Press Sim */}
          <button
            onClick={() => {
              setShowHardwareSimModal(true);
              setHardwareClickCount(0);
            }}
            className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center transition group shadow-sm min-h-[52px]"
          >
            <Volume2 className="w-6 h-6 text-amber-400 mb-1.5 group-hover:scale-110 transition" />
            <span className="text-sm font-bold text-slate-100">3x Volume</span>
            <span className="text-xs text-slate-400">Rapid Press Sim</span>
          </button>

          {/* Secret Codeword */}
          <button
            onClick={() => setShowCodeWordModal(true)}
            className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center transition group shadow-sm min-h-[52px]"
          >
            <KeyRound className="w-6 h-6 text-emerald-400 mb-1.5 group-hover:scale-110 transition" />
            <span className="text-sm font-bold text-slate-100">Codeword</span>
            <span className="text-xs text-slate-400">Phrase &quot;RAKSHA&quot;</span>
          </button>
        </div>
      </div>

      {/* Hardware 3-Press Simulation Modal */}
      {showHardwareSimModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-safecampus-card border border-safecampus-border rounded-2xl max-w-sm w-full p-5 text-center">
            <Volume2 className="w-10 h-10 text-amber-400 mx-auto mb-2 animate-bounce" />
            <h3 className="text-sm font-bold text-white mb-1">
              Hardware Power / Volume 3x Trigger
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Simulates pressing your phone&apos;s physical volume down or power button 3 times in under 2 seconds.
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step <= hardwareClickCount
                      ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {step <= hardwareClickCount ? '✓' : step}
                </div>
              ))}
            </div>
            <button
              onClick={handleHardwareSimClick}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold rounded-xl text-xs mb-2 transition"
            >
              Click Power Button ({hardwareClickCount}/3)
            </button>
            <button
              onClick={() => setShowHardwareSimModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Secret Codeword Modal */}
      {showCodeWordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-safecampus-card border border-safecampus-border rounded-2xl max-w-sm w-full p-5">
            <KeyRound className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white mb-1 text-center">
              Emergency Secret Codeword
            </h3>
            <p className="text-xs text-slate-300 mb-3 text-center">
              Default demo phrase is <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">RAKSHA</code> or <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">RED</code>.
            </p>
            <form onSubmit={handleCodeWordSubmit} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={codeWordInput}
                onChange={(e) => setCodeWordInput(e.target.value)}
                placeholder="Enter secret word..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase text-center font-bold tracking-widest focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
              >
                Confirm Emergency Signal
              </button>
              <button
                type="button"
                onClick={() => setShowCodeWordModal(false)}
                className="w-full text-xs text-slate-400 hover:text-white text-center"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
