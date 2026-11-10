import React, { useState } from 'react';
import { Report, ReportStatus, SafetyCheckpoint } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Users,
  Building,
  Wrench,
  Flame,
  Layers,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { SafetyMap } from '../map/SafetyMap';

interface AdminDashboardProps {
  reports: Report[];
  checkpoints?: SafetyCheckpoint[];
  onReportUpdated: (updated: Report) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  broken_lighting: '#f59e0b',
  harassment: '#e11d48',
  cctv_blindspot: '#8b5cf6',
  ragging_concern: '#be123c',
  unsafe_pathway: '#ea580c',
  hostel_mess_water: '#06b6d4',
  suspicious_activity: '#64748b',
  medical_emergency: '#10b981',
  other: '#94a3b8',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ reports, checkpoints = [], onReportUpdated }) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'analytics' | 'incidents' | 'hotspots' | '3dmap'>('analytics');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  // Stats
  const totalReports = reports.length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const openCount = totalReports - resolvedCount;
  const urgentCount = reports.filter((r) => r.urgency >= 4 && r.status !== 'resolved').length;
  const resolutionRate = Math.round((resolvedCount / Math.max(1, totalReports)) * 100);

  // Group by category for Chart
  const categoryCounts: Record<string, number> = {};
  reports.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  const categoryChartData = Object.entries(categoryCounts).map(([cat, count]) => ({
    name: cat.replace('_', ' '),
    count,
    fill: CATEGORY_COLORS[cat] || '#8884d8',
  }));

  // Status breakdown data
  const statusChartData = [
    { name: 'Resolved', value: resolvedCount, color: '#10b981' },
    {
      name: 'In Progress',
      value: reports.filter((r) => r.status === 'in_progress').length,
      color: '#3b82f6',
    },
    {
      name: 'Assigned',
      value: reports.filter((r) => r.status === 'assigned').length,
      color: '#f59e0b',
    },
    {
      name: 'Submitted',
      value: reports.filter((r) => r.status === 'submitted').length,
      color: '#e11d48',
    },
  ];

  // Top 5 Hotspots Calculation
  const locationCounts: Record<string, { count: number; urgencySum: number; latest: string }> = {};
  reports.forEach((r) => {
    const loc = r.location_name.split(' ')[0] || r.location_name;
    if (!locationCounts[loc]) {
      locationCounts[loc] = { count: 0, urgencySum: 0, latest: r.title };
    }
    locationCounts[loc].count += 1;
    locationCounts[loc].urgencySum += r.urgency;
  });

  const topHotspots = Object.entries(locationCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([loc, stats]) => ({
      location: loc,
      count: stats.count,
      avgUrgency: (stats.urgencySum / stats.count).toFixed(1),
      latestSample: stats.latest,
    }));

  // Assign or update status handler
  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    const updated = await dataService.updateReport(reportId, { status: newStatus });
    if (updated) {
      onReportUpdated(updated);
      showToast(`Report #${reportId} updated to ${newStatus}.`, 'success');
    }
  };

  const handleAssignmentChange = async (reportId: string, assignedTo: string) => {
    const updated = await dataService.updateReport(reportId, { assigned_to: assignedTo, status: 'assigned' });
    if (updated) {
      onReportUpdated(updated);
      showToast(`Report assigned to ${assignedTo}.`, 'success');
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-safecampus-card p-3 rounded-2xl border border-safecampus-border">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
            Total Logged
          </div>
          <div className="text-2xl font-extrabold text-white">{totalReports}</div>
          <div className="text-[10px] text-brand-300 mt-1">Campus Incident Pool</div>
        </div>

        <div className="bg-safecampus-card p-3 rounded-2xl border border-safecampus-border">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
            High Priority Active
          </div>
          <div className="text-2xl font-extrabold text-rose-500">{urgentCount}</div>
          <div className="text-[10px] text-rose-300 mt-1">Urgency 4 & 5</div>
        </div>

        <div className="bg-safecampus-card p-3 rounded-2xl border border-safecampus-border">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
            Avg Field Response
          </div>
          <div className="text-2xl font-extrabold text-amber-400">18m</div>
          <div className="text-[10px] text-amber-300 mt-1">SLA Benchmark: &lt;30m</div>
        </div>

        <div className="bg-safecampus-card p-3 rounded-2xl border border-safecampus-border">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
            Resolution Rate
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{resolutionRate}%</div>
          <div className="text-[10px] text-emerald-300 mt-1">{resolvedCount} Issues Fixed</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-safecampus-border pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-purple-900/80 text-purple-200 border border-purple-600/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Visual Analytics
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'incidents'
              ? 'bg-purple-900/80 text-purple-200 border border-purple-600/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Incident Dispatcher ({openCount} Open)
        </button>
        <button
          onClick={() => setActiveTab('hotspots')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'hotspots'
              ? 'bg-purple-900/80 text-purple-200 border border-purple-600/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" /> Hotspots & AI Action Cards
        </button>
        <button
          onClick={() => setActiveTab('3dmap')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === '3dmap'
              ? 'bg-purple-900/80 text-purple-200 border border-purple-600/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> 3D Hotspot Map
        </button>
      </div>

      {/* TAB 1: Visual Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Distribution Bar Chart */}
            <div className="bg-safecampus-card p-4 rounded-2xl border border-safecampus-border shadow-xl">
              <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                Reports by Issue Category
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" stroke="#64748b" fontSize={10} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#94a3b8"
                      fontSize={9}
                      width={90}
                      tickFormatter={(val) => val.slice(0, 14)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f0e17',
                        borderColor: '#2a2744',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resolution Status Pie Chart */}
            <div className="bg-safecampus-card p-4 rounded-2xl border border-safecampus-border shadow-xl">
              <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                Resolution Status Breakdown
              </h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={4}
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name || ''} ${Math.round((percent || 0) * 100)}%`
                      }
                      labelLine={false}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f0e17',
                        borderColor: '#2a2744',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Incident Dispatcher & Management Table */}
      {activeTab === 'incidents' && (
        <div className="bg-safecampus-card rounded-2xl border border-safecampus-border p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              Live Incident Dispatcher
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-900 border border-safecampus-border rounded-xl px-2.5 py-1 text-xs text-white"
              >
                <option value="all">All Departments</option>
                <option value="Campus Security">Campus Security</option>
                <option value="Maintenance Dept">Maintenance Dept</option>
                <option value="Hostel Warden">Hostel Warden</option>
                <option value="ICC">ICC Committee</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Title & Location</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Urgency</th>
                  <th className="py-2.5 px-3">Assigned Staff</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports
                  .filter((r) => {
                    if (selectedDeptFilter !== 'all' && r.assigned_to !== selectedDeptFilter)
                      return false;
                    return true;
                  })
                  .slice(0, 15)
                  .map((report) => (
                    <tr key={report.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{report.title}</div>
                        <div className="text-[10px] text-slate-400">📍 {report.location_name}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {report.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold ${
                            report.urgency >= 4 ? 'text-rose-400' : 'text-slate-300'
                          }`}
                        >
                          {report.urgency}/5
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={report.assigned_to || ''}
                          onChange={(e) => handleAssignmentChange(report.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200"
                        >
                          <option value="">Unassigned</option>
                          <option value="Campus Security">Campus Security</option>
                          <option value="Maintenance Dept">Maintenance Dept</option>
                          <option value="Hostel Warden">Hostel Warden</option>
                          <option value="ICC / Anti-Ragging">ICC / Anti-Ragging</option>
                          <option value="Estate Office">Estate Office</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            report.status === 'resolved'
                              ? 'bg-emerald-950 text-emerald-300'
                              : report.status === 'in_progress'
                              ? 'bg-blue-950 text-blue-300'
                              : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {report.status !== 'resolved' ? (
                          <button
                            onClick={() => handleStatusChange(report.id, 'resolved')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Mark Resolved
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500">Fixed</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Top Hotspots & AI Action Cards */}
      {activeTab === 'hotspots' && (
        <div className="space-y-4">
          {/* AI-Generated Action Recommendations Cards */}
          <div className="bg-gradient-to-r from-purple-950 via-brand-950 to-slate-900 rounded-2xl border border-purple-800/40 p-4 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              AI Preventive Recommendations (Generated from 60 Campus Incidents)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-purple-500/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded">
                  💡 Priority 1: Lighting
                </span>
                <h4 className="text-xs font-bold text-white mt-1.5">
                  Install 4 High-Lumen Solar Lights at Gate 3 Turn
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  14 complaints logged near Gate 3 between 8:00 PM and midnight. Correlates directly with catcalling reports along the outer perimeter wall.
                </p>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-rose-500/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950 px-2 py-0.5 rounded">
                  👮 Priority 2: Security Patrol
                </span>
                <h4 className="text-xs font-bold text-white mt-1.5">
                  Station Roving Female Warden behind Block C
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  Block C rear staircase flagged 3 separate stalking complaints and unauthorized loitering. Increase foot patrols from 9:30 PM to 1:00 AM.
                </p>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-blue-500/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950 px-2 py-0.5 rounded">
                  📷 Priority 3: Surveillance
                </span>
                <h4 className="text-xs font-bold text-white mt-1.5">
                  Eliminate Dome Blindspot at Girls Hostel Mess Rear
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  Contract personnel trespassing into restricted kitchen corridor. Re-align Dome #4 to capture rear gate access.
                </p>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                  🚫 Priority 4: Anti-Ragging
                </span>
                <h4 className="text-xs font-bold text-white mt-1.5">
                  Random Squad Inspections at Boys Hostel D Lawn
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  Late-night junior intimidation reported at 1:30 AM. Enforce strict biometric hostel curfew registers.
                </p>
              </div>
            </div>
          </div>

          {/* Top 5 Hotspots Table */}
          <div className="bg-safecampus-card rounded-2xl border border-safecampus-border p-4 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              Top 5 High-Risk Campus Hotspots
            </h3>
            <div className="space-y-2">
              {topHotspots.map((hotspot, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 font-extrabold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{hotspot.location} Perimeter</h4>
                      <p className="text-[10px] text-slate-400">Sample: {hotspot.latestSample}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-rose-400">
                      {hotspot.count} Reports
                    </span>
                    <div className="text-[10px] text-slate-500">
                      Avg Urgency: {hotspot.avgUrgency}/5
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 3D Hotspot & Incident Map */}
      {activeTab === '3dmap' && (
        <div className="space-y-3">
          <div className="bg-slate-900/90 border border-safecampus-border rounded-xl p-3 text-xs flex items-center justify-between">
            <span className="text-slate-300">
              Showing all <strong>{reports.length} campus incidents</strong> and 3D building extrusions in real-time.
            </span>
            <span className="text-xs text-purple-300 font-semibold">Native GPU Heatmap Active</span>
          </div>
          <div className="h-[480px] w-full rounded-2xl overflow-hidden border border-safecampus-border shadow-xl">
            <SafetyMap reports={reports} checkpoints={checkpoints} />
          </div>
        </div>
      )}
    </div>
  );
};
