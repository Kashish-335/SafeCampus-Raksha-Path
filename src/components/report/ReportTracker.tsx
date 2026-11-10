import React, { useState } from 'react';
import { Report, ReportStatus } from '../../types';
import { CheckCircle2, Clock, Shield, Search, ArrowRight, Sparkles, Filter } from 'lucide-react';

interface ReportTrackerProps {
  reports: Report[];
  onSelectReport?: (report: Report) => void;
}

export const ReportTracker: React.FC<ReportTrackerProps> = ({ reports, onSelectReport }) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filtered = reports.filter((r) => {
    if (filter === 'active' && r.status === 'resolved') return false;
    if (filter === 'resolved' && r.status !== 'resolved') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-safecampus-card rounded-2xl border border-safecampus-border p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-400" />
            Issue Resolution Tracker
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-medium mt-0.5">
            Realtime lifecycle tracking from submission to field fix.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              filter === 'all'
                ? 'bg-brand-900 text-brand-200 border border-brand-700/60 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            All ({reports.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              filter === 'active'
                ? 'bg-rose-900 text-rose-200 border border-rose-700/60 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            Open ({reports.filter((r) => r.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              filter === 'resolved'
                ? 'bg-emerald-900 text-emerald-200 border border-emerald-700/60 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            Resolved ({reports.filter((r) => r.status === 'resolved').length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by keyword, location, or issue..."
          className="w-full bg-slate-900 border border-safecampus-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* List of Reports with Step Tracker */}
      <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">
            No matching reports found.
          </div>
        ) : (
          filtered.slice(0, 20).map((report) => (
            <div
              key={report.id}
              onClick={() => onSelectReport && onSelectReport(report)}
              className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                        report.status === 'resolved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                          : report.urgency >= 4
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {report.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-rose-400">
                      Urgency {report.urgency}/5
                    </span>
                    {report.is_anonymous && (
                      <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        🔒 Anonymous
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white mt-1.5 leading-snug">
                    {report.title}
                  </h4>
                </div>
                <span className="text-xs text-slate-400 shrink-0 font-medium">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                📍 <strong className="text-white">{report.location_name}</strong> — {report.description}
              </p>

              {/* Status Stepper Tracker */}
              <div className="pt-2.5 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <StatusStep
                    label="Submitted"
                    completed={true}
                    current={report.status === 'submitted'}
                  />
                  <StepConnector completed={['assigned', 'in_progress', 'resolved'].includes(report.status)} />
                  <StatusStep
                    label="Assigned"
                    completed={['assigned', 'in_progress', 'resolved'].includes(report.status)}
                    current={report.status === 'assigned'}
                  />
                  <StepConnector completed={['in_progress', 'resolved'].includes(report.status)} />
                  <StatusStep
                    label="In Progress"
                    completed={['in_progress', 'resolved'].includes(report.status)}
                    current={report.status === 'in_progress'}
                  />
                  <StepConnector completed={report.status === 'resolved'} />
                  <StatusStep
                    label="Resolved"
                    completed={report.status === 'resolved'}
                    current={report.status === 'resolved'}
                  />
                </div>
                {report.assigned_to && (
                  <div className="mt-2 text-xs text-brand-300 flex items-center justify-between font-medium">
                    <span>Assigned to: <strong className="text-white">{report.assigned_to}</strong></span>
                    {report.resolved_at && (
                      <span className="text-emerald-400 font-semibold">
                        Resolved on {new Date(report.resolved_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatusStep: React.FC<{ label: string; completed: boolean; current: boolean }> = ({
  label,
  completed,
  current,
}) => {
  return (
    <div className="flex items-center gap-1">
      <div
        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
          completed
            ? 'bg-emerald-500 text-slate-950'
            : current
            ? 'bg-brand-500 text-white animate-pulse'
            : 'bg-slate-800 text-slate-500'
        }`}
      >
        {completed ? '✓' : '•'}
      </div>
      <span className={completed || current ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
        {label}
      </span>
    </div>
  );
};

const StepConnector: React.FC<{ completed: boolean }> = ({ completed }) => {
  return (
    <div
      className={`flex-1 h-0.5 mx-1 ${
        completed ? 'bg-emerald-500/80' : 'bg-slate-800'
      }`}
    />
  );
};
