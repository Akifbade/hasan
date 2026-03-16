-- Fix infinite recursion in RLS policies by using SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop all existing policies to start fresh
DO $$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- PROFILES
CREATE POLICY profiles_own_select ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY profiles_own_update ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY profiles_admin_insert ON profiles FOR INSERT WITH CHECK (is_admin());

-- SURVEY REQUESTS: public can insert (form) and read (track page)
CREATE POLICY sr_public_insert ON survey_requests FOR INSERT WITH CHECK (true);
CREATE POLICY sr_public_select ON survey_requests FOR SELECT USING (true);
CREATE POLICY sr_admin_update ON survey_requests FOR UPDATE USING (is_admin());
CREATE POLICY sr_admin_delete ON survey_requests FOR DELETE USING (is_admin());
CREATE POLICY sr_surveyor_update ON survey_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM survey_assignments sa WHERE sa.survey_request_id = id AND sa.surveyor_id = auth.uid())
);

-- SURVEY ASSIGNMENTS
CREATE POLICY sa_admin_all ON survey_assignments FOR ALL USING (is_admin());
CREATE POLICY sa_surveyor_select ON survey_assignments FOR SELECT USING (surveyor_id = auth.uid());
CREATE POLICY sa_surveyor_update ON survey_assignments FOR UPDATE USING (surveyor_id = auth.uid());
CREATE POLICY sa_admin_insert ON survey_assignments FOR INSERT WITH CHECK (is_admin());

-- ROOMS
CREATE POLICY rooms_admin ON rooms FOR ALL USING (is_admin());
CREATE POLICY rooms_surveyor ON rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM survey_assignments sa 
    WHERE sa.survey_request_id = rooms.survey_request_id AND sa.surveyor_id = auth.uid())
);

-- ITEMS
CREATE POLICY items_admin ON items FOR ALL USING (is_admin());
CREATE POLICY items_surveyor ON items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM rooms r 
    JOIN survey_assignments sa ON sa.survey_request_id = r.survey_request_id 
    WHERE r.id = items.room_id AND sa.surveyor_id = auth.uid()
  )
);

-- SURVEYS (final completed surveys)
CREATE POLICY surveys_admin ON surveys FOR ALL USING (is_admin());
CREATE POLICY surveys_surveyor ON surveys FOR ALL USING (surveyor_id = auth.uid());
CREATE POLICY surveys_public ON surveys FOR SELECT USING (true);

-- GPS LOCATIONS
CREATE POLICY gps_insert ON gps_locations FOR INSERT WITH CHECK (surveyor_id = auth.uid());
CREATE POLICY gps_admin ON gps_locations FOR ALL USING (is_admin());
CREATE POLICY gps_public ON gps_locations FOR SELECT USING (true);

-- CHAT MESSAGES: public read+write (customers use token, not auth)
CREATE POLICY chat_select ON chat_messages FOR SELECT USING (true);
CREATE POLICY chat_insert ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY chat_admin ON chat_messages FOR UPDATE USING (is_admin());
CREATE POLICY chat_delete ON chat_messages FOR DELETE USING (is_admin());

-- ITEM CATEGORIES & LIBRARY
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY ica_select ON item_categories FOR SELECT USING (true);
CREATE POLICY ica_admin ON item_categories FOR ALL USING (is_admin());
CREATE POLICY il_select ON item_library FOR SELECT USING (true);
CREATE POLICY il_admin ON item_library FOR ALL USING (is_admin());

-- PRICING ROUTES
ALTER TABLE pricing_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY pr_select ON pricing_routes FOR SELECT USING (true);
CREATE POLICY pr_admin ON pricing_routes FOR ALL USING (is_admin());

-- INVOICES
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY inv_admin ON invoices FOR ALL USING (is_admin());
