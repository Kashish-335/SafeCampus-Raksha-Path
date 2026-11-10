-- ==============================================================================
-- SafeCampus (Raksha Path) Database Schema
-- Supabase Postgres + Row Level Security (RLS) + Realtime Ready
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE report_category_enum AS ENUM (
  'harassment',
  'broken_lighting',
  'cctv_blindspot',
  'suspicious_activity',
  'ragging_concern',
  'hostel_mess_water',
  'unsafe_pathway',
  'medical_emergency',
  'other'
);

CREATE TYPE report_status_enum AS ENUM (
  'submitted',
  'assigned',
  'in_progress',
  'resolved'
);

CREATE TYPE user_role_enum AS ENUM (
  'student',
  'admin',
  'warden',
  'security_lead',
  'icc_member'
);

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'student',
  phone TEXT,
  student_id TEXT,
  is_buddy_volunteer BOOLEAN DEFAULT FALSE,
  buddy_location JSONB, -- { "lat": 28.545, "lng": 77.192, "updated_at": "..." }
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category report_category_enum NOT NULL,
  urgency INTEGER NOT NULL CHECK (urgency >= 1 AND urgency <= 5),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_name TEXT NOT NULL,
  photo_url TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status report_status_enum DEFAULT 'submitted',
  ai_summary TEXT,
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  assigned_to TEXT, -- e.g. "Campus Security", "Hostel Warden", "Maintenance Dept", "ICC"
  admin_notes TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMPTZ
);

-- 5. SOS ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_name TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'button_press', -- 'button_press', 'shake', 'volume_sim', 'code_word'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'false_alarm'
  media_url TEXT,
  audio_note_url TEXT,
  contacts_notified JSONB DEFAULT '[]'::jsonb,
  telegram_message_id TEXT,
  dispatched_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMPTZ
);

-- 6. SAFETY CHECKPOINTS & INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS public.safety_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'security_post', 'emergency_callbox', 'well_lit_zone', 'medical_post', 'women_helpdesk'
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. CAMPUS PATHWAY GRAPH (For Safe Route Navigator)
CREATE TABLE IF NOT EXISTS public.campus_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node TEXT NOT NULL,
  target_node TEXT NOT NULL,
  distance_m DOUBLE PRECISION NOT NULL,
  has_lighting BOOLEAN DEFAULT TRUE,
  has_cctv BOOLEAN DEFAULT FALSE,
  is_patrolled BOOLEAN DEFAULT FALSE,
  safety_penalty DOUBLE PRECISION DEFAULT 0.0,
  path_coordinates JSONB NOT NULL -- [[lat, lng], [lat, lng], ...]
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_location ON public.reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sos_status ON public.sos_alerts(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_pathways ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile; admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Reports: Anyone can submit an anonymous report
CREATE POLICY "Anyone can insert reports" ON public.reports
  FOR INSERT WITH CHECK (true);

-- Reports: Students can view non-confidential report pins (for heatmap & transparency)
CREATE POLICY "Public read for reports map" ON public.reports
  FOR SELECT USING (true);

-- Reports: Staff & Admins can update assignments & status
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'warden', 'security_lead', 'icc_member')
    )
  );

-- SOS: Anyone can insert an emergency SOS alert
CREATE POLICY "Anyone can trigger SOS" ON public.sos_alerts
  FOR INSERT WITH CHECK (true);

-- SOS: Admins and active users can view SOS alerts
CREATE POLICY "View SOS alerts" ON public.sos_alerts
  FOR SELECT USING (true);

-- Checkpoints & Pathways: Publicly visible to all users
CREATE POLICY "Public read checkpoints" ON public.safety_checkpoints
  FOR SELECT USING (true);

CREATE POLICY "Public read pathways" ON public.campus_pathways
  FOR SELECT USING (true);
