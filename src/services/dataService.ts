import { Report, SafetyCheckpoint, SafetyBuddy, SOSAlert, ReportStatus } from '../types';
import { INITIAL_REPORTS, CAMPUS_CHECKPOINTS, SAFETY_BUDDIES } from './mockData';
import { supabase, isSupabaseConfigured } from './supabase';

const REPORTS_STORAGE_KEY = 'safecampus_reports_v1';
const SOS_STORAGE_KEY = 'safecampus_sos_v1';
const OFFLINE_QUEUE_KEY = 'safecampus_offline_queue_v1';

export const dataService = {
  // Fetch all reports
  async getReports(): Promise<Report[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Report[];
        }
      } catch (err) {
        console.warn('Supabase query error, falling back to local store:', err);
      }
    }

    // Local Storage fallback
    const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_REPORTS;
    }
  },

  // Submit a new report
  async addReport(report: Omit<Report, 'id' | 'created_at'>): Promise<Report> {
    const newReport: Report = {
      ...report,
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .insert([newReport])
          .select()
          .single();
        if (!error && data) {
          return data as Report;
        }
      } catch (err) {
        console.warn('Supabase insert failed, queueing offline:', err);
        this.queueOfflineAction('ADD_REPORT', newReport);
      }
    }

    // Local Storage save
    const current = await this.getReports();
    const updated = [newReport, ...current];
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updated));
    return newReport;
  },

  // Update report status & assignment
  async updateReport(
    id: string,
    updates: Partial<Pick<Report, 'status' | 'assigned_to' | 'admin_notes' | 'resolution_notes' | 'urgency'>>
  ): Promise<Report | null> {
    const isResolved = updates.status === 'resolved';
    const patch = {
      ...updates,
      ...(isResolved ? { resolved_at: new Date().toISOString() } : {}),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .update(patch)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          return data as Report;
        }
      } catch (err) {
        console.warn('Supabase update failed:', err);
      }
    }

    // Local Storage update
    const current = await this.getReports();
    let updatedReport: Report | null = null;
    const updated = current.map((r) => {
      if (r.id === id) {
        updatedReport = { ...r, ...patch };
        return updatedReport;
      }
      return r;
    });

    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updated));
    return updatedReport;
  },

  // Fetch checkpoints
  async getCheckpoints(): Promise<SafetyCheckpoint[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('safety_checkpoints').select('*');
        if (!error && data && data.length > 0) {
          return data as SafetyCheckpoint[];
        }
      } catch (err) {
        console.warn('Checkpoints fetch fallback:', err);
      }
    }
    return CAMPUS_CHECKPOINTS;
  },

  // Fetch safety buddies
  async getSafetyBuddies(): Promise<SafetyBuddy[]> {
    return SAFETY_BUDDIES;
  },

  // Record SOS Alert
  async recordSOSAlert(alert: Omit<SOSAlert, 'id' | 'dispatched_at'>): Promise<SOSAlert> {
    const newAlert: SOSAlert = {
      ...alert,
      id: `sos-${Date.now()}`,
      dispatched_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('sos_alerts').insert([newAlert]);
      } catch (err) {
        console.warn('Supabase SOS alert insert failed:', err);
      }
    }

    const stored = localStorage.getItem(SOS_STORAGE_KEY);
    const alerts: SOSAlert[] = stored ? JSON.parse(stored) : [];
    alerts.unshift(newAlert);
    localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(alerts));
    return newAlert;
  },

  // Get SOS alerts
  async getSOSAlerts(): Promise<SOSAlert[]> {
    const stored = localStorage.getItem(SOS_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  // Offline queue
  queueOfflineAction(action: string, payload: any) {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = stored ? JSON.parse(stored) : [];
    queue.push({ action, payload, timestamp: Date.now() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  getOfflineQueueCount(): number {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!stored) return 0;
    try {
      return JSON.parse(stored).length;
    } catch {
      return 0;
    }
  },

  // Reset demo state back to 60 seed records
  resetDemoData() {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
    localStorage.removeItem(SOS_STORAGE_KEY);
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },
};
