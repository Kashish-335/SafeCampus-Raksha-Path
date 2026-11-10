export type ReportCategory =
  | 'harassment'
  | 'broken_lighting'
  | 'cctv_blindspot'
  | 'suspicious_activity'
  | 'ragging_concern'
  | 'hostel_mess_water'
  | 'unsafe_pathway'
  | 'medical_emergency'
  | 'other';

export type ReportStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved';

export type UserRole = 'student' | 'admin' | 'warden' | 'security_lead' | 'icc_member';

export type SOSTriggerType = 'button_press' | 'shake' | 'volume_sim' | 'code_word' | 'walk_deviation';

export interface Report {
  id: string;
  campus_id?: string;
  title: string;
  description: string;
  category: ReportCategory;
  urgency: number; // 1 to 5
  latitude: number;
  longitude: number;
  location_name: string;
  photo_url?: string;
  is_anonymous: boolean;
  user_id?: string;
  status: ReportStatus;
  ai_summary?: string;
  is_duplicate?: boolean;
  duplicate_of?: string;
  assigned_to?: string;
  admin_notes?: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface SOSAlert {
  id: string;
  campus_id?: string;
  user_id?: string;
  user_name?: string;
  latitude: number;
  longitude: number;
  location_name: string;
  trigger_type: SOSTriggerType;
  status: 'active' | 'acknowledged' | 'resolved' | 'false_alarm';
  media_url?: string;
  audio_note_url?: string;
  contacts_notified: string[];
  telegram_message_id?: string;
  dispatched_at: string;
  resolved_at?: string;
}

export interface SafetyCheckpoint {
  id: string;
  campus_id?: string;
  name: string;
  type: 'security_post' | 'emergency_callbox' | 'well_lit_zone' | 'medical_post' | 'women_helpdesk';
  latitude: number;
  longitude: number;
  description?: string;
  is_active: boolean;
  phone?: string;
}

export interface CampusLandmark {
  id: string;
  name: string;
  lat: number;
  lng: number;
  campus_id?: string;
}

export interface CampusPathway {
  id: string;
  source_node: string;
  target_node: string;
  distance_m: number;
  has_lighting: boolean;
  has_cctv: boolean;
  is_patrolled: boolean;
  safety_penalty: number;
  path_coordinates: [number, number][];
}

export interface RouteOption {
  id: 'fastest' | 'safest';
  name: string;
  distance_meters: number;
  estimated_time_minutes: number;
  safety_score: number; // 0 - 100
  coordinates: [number, number][];
  rationale: string;
  lighting_quality: 'High' | 'Moderate' | 'Poor';
  security_posts_count: number;
  recent_incidents_nearby: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  student_id?: string;
  is_buddy_volunteer: boolean;
  emergency_contacts: EmergencyContact[];
}

export interface SafetyBuddy {
  id: string;
  name: string;
  phone: string;
  distance_m: number;
  is_available: boolean;
  is_verified: boolean;
  avatar: string;
  gender: string;
  latitude: number;
  longitude: number;
}

export interface AIClassificationResult {
  category: ReportCategory;
  urgency: number;
  summary: string;
  is_duplicate: boolean;
  duplicate_id?: string;
  rationale: string;
  recommended_action: string;
  assigned_department: string;
}

export interface WalkSession {
  id: string;
  destination_name: string;
  target_lat: number;
  target_lng: number;
  start_lat: number;
  start_lng: number;
  current_lat: number;
  current_lng: number;
  eta_minutes: number;
  started_at: string;
  last_checkin_at: string;
  status: 'active' | 'completed' | 'alert_triggered';
  emergency_contacts: string[];
}
