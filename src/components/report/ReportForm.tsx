import React, { useState } from 'react';
import { Shield, Sparkles, MapPin, Camera, AlertCircle, CheckCircle2, EyeOff, Loader2 } from 'lucide-react';
import { Report, ReportCategory } from '../../types';
import { classifyReport } from '../../services/geminiClassifier';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';

interface ReportFormProps {
  existingReports: Report[];
  onReportSubmitted: (newReport: Report) => void;
  initialLocation?: { lat: number; lng: number };
}

export const ReportForm: React.FC<ReportFormProps> = ({
  existingReports,
  onReportSubmitted,
  initialLocation,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('broken_lighting');
  const [locationName, setLocationName] = useState('Gate 3 Approach Lane');
  const [lat, setLat] = useState<number>(initialLocation?.lat || 28.5491);
  const [lng, setLng] = useState<number>(initialLocation?.lng || 77.1892);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  // Quick Preset Sample Incidents for Instant Hackathon Testing
  const handleQuickPreset = (preset: {
    t: string;
    d: string;
    c: ReportCategory;
    loc: string;
    la: number;
    lo: number;
  }) => {
    setTitle(preset.t);
    setDescription(preset.d);
    setCategory(preset.c);
    setLocationName(preset.loc);
    setLat(preset.la);
    setLng(preset.lo);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Please provide a title and incident description.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Run AI Classifier (Gemini API with fallback NLP)
      const aiResult = await classifyReport({
        title,
        description,
        locationName,
        lat,
        lng,
        existingReports,
      });

      setAiAnalysisResult(aiResult);

      // 2. Persist via unified DataService
      const savedReport = await dataService.addReport({
        title,
        description,
        category: aiResult.category,
        urgency: aiResult.urgency,
        latitude: lat,
        longitude: lng,
        location_name: locationName,
        is_anonymous: isAnonymous,
        status: 'submitted',
        ai_summary: aiResult.summary,
        is_duplicate: aiResult.is_duplicate,
        duplicate_of: aiResult.duplicate_id,
        assigned_to: aiResult.assigned_department,
        photo_url: photoPreview || undefined,
      });

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#be123c', '#701a75', '#10b981'],
      });

      showToast(
        `Report logged successfully! Urgency ${aiResult.urgency}/5 assigned to ${aiResult.assigned_department}`,
        'success'
      );

      onReportSubmitted(savedReport);

      // Reset form fields
      setTitle('');
      setDescription('');
      setPhotoPreview(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to submit report. Queued for offline sync.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-safecampus-card rounded-2xl border border-safecampus-border p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-safecampus-border pb-4 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            File Confidential Campus Report
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-medium mt-0.5">
            Fix safety and infrastructure issues before they escalate.
          </p>
        </div>

        {/* Anonymous Toggle (Default ON) */}
        <label className="flex items-center gap-2.5 cursor-pointer bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-700 self-start sm:self-auto shadow-sm">
          <EyeOff className={`w-4 h-4 ${isAnonymous ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-sm font-semibold text-slate-200">
            {isAnonymous ? 'Anonymous ON' : 'Identified'}
          </span>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-9 h-5 rounded-full transition-colors p-0.5 ${
              isAnonymous ? 'bg-emerald-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                isAnonymous ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </label>
      </div>

      {/* Quick Demo Pre-fill Chips */}
      <div className="mb-5">
        <span className="text-xs sm:text-sm font-bold text-slate-300 block mb-2">
          ✨ One-Click Demo Scenarios:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              handleQuickPreset({
                t: 'Broken high-mast sodium light behind Gate 3',
                d: 'Pitch black along the north boundary wall. Female hostellers walking back from metro have to navigate without any visibility.',
                c: 'broken_lighting',
                loc: 'Gate 3 North Walkway',
                la: 28.5492,
                lo: 77.1891,
              })
            }
            className="text-xs sm:text-sm font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition shadow-sm"
          >
            💡 Unlit Gate 3 Walkway
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickPreset({
                t: 'Aggressive group catcalling near Sports Pavillion',
                d: 'Group of 4 individuals loitering after sunset intimidating joggers and female sports students.',
                c: 'harassment',
                loc: 'Sports Ground Pavillion',
                la: 28.5422,
                lo: 77.1952,
              })
            }
            className="text-xs sm:text-sm font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition shadow-sm"
          >
            🚨 Sports Ground Harassment
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickPreset({
                t: 'Seniors summoning first-years behind Block C at 11 PM',
                d: 'Unsanctioned ragging session with senior students cornering juniors for personal tasks.',
                c: 'ragging_concern',
                loc: 'Block C Back Courtyard',
                la: 28.5441,
                lo: 77.1895,
              })
            }
            className="text-xs sm:text-sm font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition shadow-sm"
          >
            🚫 Block C Ragging Alert
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selector */}
        <div>
          <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory)}
            className="w-full bg-slate-900 border border-safecampus-border rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
          >
            <option value="broken_lighting">💡 Broken Lighting / Dark Corridor</option>
            <option value="harassment">⚠️ Harassment / Stalking / Catcalling</option>
            <option value="cctv_blindspot">📷 CCTV Blindspot / Faulty Camera</option>
            <option value="ragging_concern">🚫 Ragging / Intimidation Concern</option>
            <option value="unsafe_pathway">🚧 Unsafe Pathway / Broken Boundary</option>
            <option value="hostel_mess_water">🚰 Hostel / Mess / Water Quality</option>
            <option value="suspicious_activity">👁️ Suspicious Activity / Trespass</option>
            <option value="medical_emergency">🚑 Medical / Health Emergency</option>
            <option value="other">📌 Other General Issue</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-1.5">
            Issue Summary
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Streetlight pole #4 out of order"
            className="w-full bg-slate-900 border border-safecampus-border rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-1.5">
            Detailed Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe what happened, exact location cues, and time of occurrence..."
            className="w-full bg-slate-900 border border-safecampus-border rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-500 focus:outline-none resize-none leading-relaxed"
            required
          />
        </div>

        {/* Location Name & Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-400" /> Location Description
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Near Library Side Gate"
              className="w-full bg-slate-900 border border-safecampus-border rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-1.5">
              Coordinates (Map Pin)
            </label>
            <div className="bg-slate-900 border border-safecampus-border rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-slate-300 font-mono flex items-center justify-between">
              <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
              <span className="text-xs font-semibold text-emerald-400">Campus GPS Locked</span>
            </div>
          </div>
        </div>

        {/* Optional Photo Attachment */}
        <div>
          <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-slate-400" /> Attach Photo (Optional)
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2 transition shadow-sm">
              <span>Choose Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            {photoPreview && (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-xl border border-brand-500 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Classifier Feedback Card if result ready */}
        {aiAnalysisResult && (
          <div className="bg-gradient-to-r from-brand-950 to-purple-950 rounded-xl p-4 border border-brand-800/60 text-sm animate-fadeIn shadow-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-brand-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-400" /> AI Classification Complete
              </span>
              <span className="bg-rose-900 text-rose-200 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                Urgency: {aiAnalysisResult.urgency}/5
              </span>
            </div>
            <p className="text-slate-200 text-xs sm:text-sm mb-1.5 leading-relaxed">{aiAnalysisResult.summary}</p>
            <div className="text-xs sm:text-sm text-emerald-300 font-semibold">
              👉 Routed To: {aiAnalysisResult.assigned_department}
            </div>
            {aiAnalysisResult.is_duplicate && (
              <div className="mt-1.5 text-xs text-amber-300 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Duplicate detected: Merged with active incident #{aiAnalysisResult.duplicate_id}.
              </div>
            )}
          </div>
        )}

        {/* Submit Button (Minimum 16px font and 48px height) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[48px] bg-gradient-to-r from-brand-700 to-brand-500 hover:from-brand-600 hover:to-brand-400 text-white font-bold py-3 px-6 rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-700/30 transition disabled:opacity-50 mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing with Gemini AI Classifier...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Submit & AI Classify Issue</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
