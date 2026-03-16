-- Function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if current user is surveyor (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_surveyor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'surveyor'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins see all requests" ON survey_requests;
DROP POLICY IF EXISTS "Admins manage rooms" ON rooms;
DROP POLICY IF EXISTS "Admins manage items" ON items;
DROP POLICY IF EXISTS "Admins manage surveys" ON surveys;
DROP POLICY IF EXISTS "Admins manage assignments" ON survey_assignments;
DROP POLICY IF EXISTS "Admins read all GPS" ON gps_locations;
DROP POLICY IF EXISTS "Admins manage chat" ON chat_messages;
DROP POLICY IF EXISTS "Admins manage item categories" ON item_categories;
DROP POLICY IF EXISTS "Admins manage item library" ON item_library;
DROP POLICY IF EXISTS "Admins manage pricing routes" ON pricing_routes;
DROP POLICY IF EXISTS "Admins manage invoices" ON invoices;
DROP POLICY IF EXISTS "Surveyors see assigned requests" ON survey_requests;
DROP POLICY IF EXISTS "Surveyors manage assigned rooms" ON rooms;
DROP POLICY IF EXISTS "Surveyors manage assigned items" ON items;
DROP POLICY IF EXISTS "Surveyors manage own surveys" ON surveys;
DROP POLICY IF EXISTS "Surveyors see own assignments" ON survey_assignments;
DROP POLICY IF EXISTS "Surveyors update own assignments" ON survey_assignments;
DROP POLICY IF EXISTS "Surveyors can chat on assigned surveys" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can submit survey request" ON survey_requests;
DROP POLICY IF EXISTS "Public can view surveys" ON survey_requests;
DROP POLICY IF EXISTS "Anyone can read chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can send chat message" ON chat_messages;
DROP POLICY IF EXISTS "Public can read GPS locations" ON gps_locations;
DROP POLICY IF EXISTS "Anyone can read item categories" ON item_categories;
DROP POLICY IF EXISTS "Anyone can read item library" ON item_library;
DROP POLICY IF EXISTS "Anyone can read pricing routes" ON pricing_routes;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Surveyors insert own GPS" ON gps_locations;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "survey_requests_insert_public" ON survey_requests;
DROP POLICY IF EXISTS "survey_requests_select_all" ON survey_requests;
DROP POLICY IF EXISTS "survey_requests_admin_all" ON survey_requests;
DROP POLICY IF EXISTS "survey_requests_surveyor_update" ON survey_requests;
DROP POLICY IF EXISTS "assignments_admin_all" ON survey_assignments;
DROP POLICY IF EXISTS "assignments_surveyor_select" ON survey_assignments;
DROP POLICY IF EXISTS "assignments_surveyor_update" ON survey_assignments;
DROP POLICY IF EXISTS "rooms_admin_all" ON rooms;
DROP POLICY IF EXISTS "rooms_surveyor_all" ON rooms;
DROP POLICY IF EXISTS "items_admin_all" ON items;
DROP POLICY IF EXISTS "items_surveyor_all" ON items;
DROP POLICY IF EXISTS "surveys_admin_all" ON surveys;
DROP POLICY IF EXISTS "surveys_surveyor_own" ON surveys;
DROP POLICY IF EXISTS "surveys_public_select" ON surveys;
DROP POLICY IF EXISTS "gps_surveyor_insert" ON gps_locations;
DROP POLICY IF EXISTS "gps_admin_all" ON gps_locations;
DROP POLICY IF EXISTS "gps_public_select" ON gps_locations;
DROP POLICY IF EXISTS "chat_select_all" ON chat_messages;
DROP POLICY IF EXISTS "chat_insert_all" ON chat_messages;
DROP POLICY IF EXISTS "chat_admin_all" ON chat_messages;
DROP POLICY IF EXISTS "item_categories_select_all" ON item_categories;
DROP POLICY IF EXISTS "item_categories_admin_all" ON item_categories;
DROP POLICY IF EXISTS "item_library_select_all" ON item_library;
DROP POLICY IF EXISTS "item_library_admin_all" ON item_library;
DROP POLICY IF EXISTS "pricing_routes_select_all" ON pricing_routes;
DROP POLICY IF EXISTS "pricing_routes_admin_all" ON pricing_routes;
DROP POLICY IF EXISTS "invoices_admin_all" ON invoices;

-- PROFILES: non-recursive policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT WITH CHECK (is_admin());

-- SURVEY REQUESTS
CREATE POLICY "survey_requests_insert_public" ON survey_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "survey_requests_select_all" ON survey_requests FOR SELECT USING (true);
CREATE POLICY "survey_requests_admin_all" ON survey_requests FOR UPDATE USING (is_admin());
CREATE POLICY "survey_requests_delete_admin" ON survey_requests FOR DELETE USING (is_admin());

-- SURVEY ASSIGNMENTS
CREATE POLICY "assignments_admin_all" ON survey_assignments FOR ALL USING (is_admin());
CREATE POLICY "assignments_surveyor_select" ON survey_assignments FOR SELECT USING (surveyor_id = auth.uid());
CREATE POLICY "assignments_surveyor_update" ON survey_assignments FOR UPDATE USING (surveyor_id = auth.uid());

-- ROOMS
CREATE POLICY "rooms_admin_all" ON rooms FOR ALL USING (is_admin());
CREATE POLICY "rooms_surveyor_all" ON rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM survey_assignments sa WHERE sa.survey_request_id = rooms.survey_request_id AND sa.surveyor_id = auth.uid())
);

-- ITEMS
CREATE POLICY "items_admin_all" ON items FOR ALL USING (is_admin());
CREATE POLICY "items_surveyor_all" ON items FOR ALL USING (
  EXISTS (SELECT 1 FROM rooms r JOIN survey_assignments sa ON sa.survey_request_id = r.survey_request_id WHERE r.id = items.room_id AND sa.surveyor_id = auth.uid())
);

-- SURVEYS (completed surveys)
CREATE POLICY "surveys_admin_all" ON surveys FOR ALL USING (is_admin());
CREATE POLICY "surveys_surveyor_own" ON surveys FOR ALL USING (surveyor_id = auth.uid());
CREATE POLICY "surveys_public_select" ON surveys FOR SELECT USING (true);

-- GPS LOCATIONS
CREATE POLICY "gps_surveyor_insert" ON gps_locations FOR INSERT WITH CHECK (surveyor_id = auth.uid());
CREATE POLICY "gps_admin_all" ON gps_locations FOR ALL USING (is_admin());
CREATE POLICY "gps_public_select" ON gps_locations FOR SELECT USING (true);

-- CHAT MESSAGES
CREATE POLICY "chat_select_all" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_insert_all" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_admin_all" ON chat_messages FOR UPDATE USING (is_admin());

-- ITEM CATEGORIES & LIBRARY
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item_categories_select_all" ON item_categories FOR SELECT USING (true);
CREATE POLICY "item_categories_admin_all" ON item_categories FOR ALL USING (is_admin());
CREATE POLICY "item_library_select_all" ON item_library FOR SELECT USING (true);
CREATE POLICY "item_library_admin_all" ON item_library FOR ALL USING (is_admin());

-- PRICING ROUTES
ALTER TABLE pricing_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_routes_select_all" ON pricing_routes FOR SELECT USING (true);
CREATE POLICY "pricing_routes_admin_all" ON pricing_routes FOR ALL USING (is_admin());

-- INVOICES
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_admin_all" ON invoices FOR ALL USING (is_admin());
