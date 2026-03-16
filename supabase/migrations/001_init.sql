-- ============================================
-- QGO Relocation - Full Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- BRANCHES (Multi-branch support)
-- ============================================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  email TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'surveyor', 'agent')) NOT NULL,
  phone TEXT,
  branch_id UUID REFERENCES branches(id),
  is_available BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGENTS (Referral system)
-- ============================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  referral_code TEXT UNIQUE NOT NULL,
  commission_percent NUMERIC DEFAULT 5.0,
  total_referrals INT DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ITEMS LIBRARY (Predefined items)
-- ============================================
CREATE TABLE item_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  icon TEXT,
  order_index INT DEFAULT 0
);

CREATE TABLE item_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES item_categories(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  default_length_cm NUMERIC,
  default_width_cm NUMERIC,
  default_height_cm NUMERIC,
  icon TEXT,
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- PRICING (for quote calculator)
-- ============================================
CREATE TABLE pricing_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  origin_country TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  lcl_rate_per_m3 NUMERIC,
  container_20ft_price NUMERIC,
  container_40ft_price NUMERIC,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SURVEYOR AVAILABILITY
-- ============================================
CREATE TABLE surveyor_unavailability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surveyor_id UUID REFERENCES profiles(id),
  unavailable_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SURVEY REQUESTS
-- ============================================
CREATE TABLE survey_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token UUID DEFAULT gen_random_uuid() UNIQUE,
  tracking_code TEXT UNIQUE, -- 8-digit human-readable code
  branch_id UUID REFERENCES branches(id),
  agent_id UUID REFERENCES agents(id),

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_whatsapp TEXT,

  -- Move details
  pickup_address TEXT NOT NULL,
  pickup_city TEXT,
  pickup_country TEXT DEFAULT 'UAE',
  destination_country TEXT,
  destination_city TEXT,
  preferred_date DATE,
  property_type TEXT CHECK (property_type IN ('apartment','villa','office','studio','other')),
  notes TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','assigned','in_progress','completed','cancelled','quoted','invoice_sent','paid'
  )),

  -- Documents
  documents_uploaded BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate tracking code trigger
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tracking_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tracking_code
BEFORE INSERT ON survey_requests
FOR EACH ROW EXECUTE FUNCTION generate_tracking_code();

-- ============================================
-- SURVEY ASSIGNMENTS
-- ============================================
CREATE TABLE survey_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_request_id UUID REFERENCES survey_requests(id) ON DELETE CASCADE,
  surveyor_id UUID REFERENCES profiles(id),
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed','cancelled'))
);

-- ============================================
-- ROOMS
-- ============================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_request_id UUID REFERENCES survey_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  order_index INT DEFAULT 0,
  photo_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ITEMS (in rooms)
-- ============================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  library_item_id UUID REFERENCES item_library(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  length_cm NUMERIC NOT NULL DEFAULT 0,
  width_cm NUMERIC NOT NULL DEFAULT 0,
  height_cm NUMERIC NOT NULL DEFAULT 0,
  quantity INT DEFAULT 1,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('good','fragile','damaged')),
  photo_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  is_manual BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Computed volume view
CREATE VIEW items_with_volume AS
SELECT
  *,
  ROUND((length_cm * width_cm * height_cm * quantity) / 1000000.0, 4) AS volume_m3
FROM items;

-- ============================================
-- SURVEYS (final completed survey)
-- ============================================
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_request_id UUID REFERENCES survey_requests(id) UNIQUE,
  surveyor_id UUID REFERENCES profiles(id),

  -- Volume & Container
  total_volume_m3 NUMERIC,
  container_type TEXT CHECK (container_type IN ('lcl','20ft','40ft')),
  fill_percentage NUMERIC,

  -- Route details
  origin_port TEXT,
  destination_port TEXT,
  estimated_departure DATE,
  estimated_arrival DATE,

  -- Quote
  quoted_price NUMERIC,
  currency TEXT DEFAULT 'USD',
  price_breakdown JSONB,

  -- Notes
  special_notes TEXT,
  special_notes_ar TEXT,

  -- Signature
  signature_url TEXT,

  -- PDF
  pdf_url TEXT,

  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id),
  survey_request_id UUID REFERENCES survey_requests(id),
  invoice_number TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT CHECK (payment_method IN ('online','cash','bank_transfer')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','overdue','cancelled')),
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'QGO-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('invoice_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE invoice_seq START 1;
CREATE TRIGGER set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ============================================
-- DOCUMENTS (customer uploads)
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_request_id UUID REFERENCES survey_requests(id) ON DELETE CASCADE,
  uploaded_by_email TEXT,
  doc_type TEXT CHECK (doc_type IN ('passport','visa','noc','customs','other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GPS LOCATIONS
-- ============================================
CREATE TABLE gps_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surveyor_id UUID REFERENCES profiles(id),
  survey_request_id UUID REFERENCES survey_requests(id),
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  accuracy NUMERIC,
  speed NUMERIC,
  battery NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keep only last 100 locations per surveyor per day (cleanup function)
CREATE INDEX idx_gps_surveyor_time ON gps_locations(surveyor_id, recorded_at DESC);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_request_id UUID REFERENCES survey_requests(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  sender_email TEXT, -- for customer (no profile)
  sender_name TEXT NOT NULL,
  sender_role TEXT CHECK (sender_role IN ('admin','surveyor','customer')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS LOG
-- ============================================
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_request_id UUID REFERENCES survey_requests(id),
  type TEXT CHECK (type IN ('email','whatsapp','sms')),
  recipient TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','failed','pending')),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMER FEEDBACK
-- ============================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_request_id UUID REFERENCES survey_requests(id) UNIQUE,
  customer_email TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  surveyor_rating INT CHECK (surveyor_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOXES (QR labels)
-- ============================================
CREATE TABLE boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_request_id UUID REFERENCES survey_requests(id) ON DELETE CASCADE,
  box_number INT NOT NULL,
  label TEXT,
  contents TEXT[],
  room_id UUID REFERENCES rooms(id),
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEED: Default item categories & items
-- ============================================
INSERT INTO item_categories (name, name_ar, icon, order_index) VALUES
('Bedroom', 'غرفة النوم', '🛏️', 1),
('Living Room', 'غرفة المعيشة', '🛋️', 2),
('Kitchen', 'المطبخ', '🍳', 3),
('Dining Room', 'غرفة الطعام', '🪑', 4),
('Office', 'المكتب', '💼', 5),
('Outdoor', 'خارجي', '🌿', 6),
('Boxes & Cartons', 'صناديق وكراتين', '📦', 7);

-- Bedroom items
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'King Bed', 'سرير كينج', 200, 180, 50 FROM item_categories WHERE name = 'Bedroom';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Queen Bed', 'سرير كوين', 200, 150, 50 FROM item_categories WHERE name = 'Bedroom';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Single Bed', 'سرير مفرد', 200, 90, 50 FROM item_categories WHERE name = 'Bedroom';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Wardrobe (3 door)', 'خزانة 3 أبواب', 180, 60, 210 FROM item_categories WHERE name = 'Bedroom';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Dresser', 'تسريحة', 120, 50, 150 FROM item_categories WHERE name = 'Bedroom';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Bedside Table', 'طاولة سرير', 50, 40, 60 FROM item_categories WHERE name = 'Bedroom';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'TV Unit', 'وحدة تلفزيون', 150, 40, 50 FROM item_categories WHERE name = 'Bedroom';

-- Living Room items
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, '3-Seater Sofa', 'أريكة 3 مقاعد', 220, 90, 90 FROM item_categories WHERE name = 'Living Room';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, '2-Seater Sofa', 'أريكة 2 مقاعد', 160, 90, 90 FROM item_categories WHERE name = 'Living Room';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Armchair', 'كرسي بذراعين', 90, 90, 90 FROM item_categories WHERE name = 'Living Room';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Coffee Table', 'طاولة قهوة', 120, 60, 45 FROM item_categories WHERE name = 'Living Room';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'TV (65")', 'تلفزيون 65 بوصة', 150, 10, 90 FROM item_categories WHERE name = 'Living Room';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Bookshelf', 'رف كتب', 100, 30, 200 FROM item_categories WHERE name = 'Living Room';

-- Kitchen items
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Refrigerator', 'ثلاجة', 70, 70, 180 FROM item_categories WHERE name = 'Kitchen';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Washing Machine', 'غسالة', 60, 60, 85 FROM item_categories WHERE name = 'Kitchen';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Dishwasher', 'غسالة أطباق', 60, 60, 85 FROM item_categories WHERE name = 'Kitchen';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Microwave', 'ميكروويف', 50, 35, 30 FROM item_categories WHERE name = 'Kitchen';

-- Dining
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Dining Table (6 seater)', 'طاولة طعام 6 أشخاص', 180, 90, 78 FROM item_categories WHERE name = 'Dining Room';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Dining Chair', 'كرسي طعام', 50, 50, 95 FROM item_categories WHERE name = 'Dining Room';

-- Boxes
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Small Box', 'صندوق صغير', 40, 30, 30 FROM item_categories WHERE name = 'Boxes & Cartons';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Medium Box', 'صندوق متوسط', 60, 40, 40 FROM item_categories WHERE name = 'Boxes & Cartons';
INSERT INTO item_library (category_id, name, name_ar, default_length_cm, default_width_cm, default_height_cm)
SELECT id, 'Large Box', 'صندوق كبير', 80, 60, 60 FROM item_categories WHERE name = 'Boxes & Cartons';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read own, admins read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- Survey requests: admins/assigned surveyors can access
CREATE POLICY "Admins see all requests" ON survey_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);
CREATE POLICY "Surveyors see assigned requests" ON survey_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM survey_assignments sa
    WHERE sa.survey_request_id = id AND sa.surveyor_id = auth.uid()
  )
);

-- GPS: surveyors can insert own, admins can read all
CREATE POLICY "Surveyors insert own GPS" ON gps_locations FOR INSERT WITH CHECK (surveyor_id = auth.uid());
CREATE POLICY "Admins read all GPS" ON gps_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);
