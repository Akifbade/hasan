// ONE-TIME migration runner - can be deleted after use
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FIX_SQL = `
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
$$ LANGUAGE sql SECURITY DEFINER STABLE;
`

const DROP_SQL = `
DO $d$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $d$;
`

const POLICIES = [
  `CREATE POLICY profiles_own_select ON profiles FOR SELECT USING (auth.uid() = id OR is_admin())`,
  `CREATE POLICY profiles_own_update ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin())`,
  `CREATE POLICY sr_public_insert ON survey_requests FOR INSERT WITH CHECK (true)`,
  `CREATE POLICY sr_public_select ON survey_requests FOR SELECT USING (true)`,
  `CREATE POLICY sr_admin_update ON survey_requests FOR UPDATE USING (is_admin())`,
  `CREATE POLICY sr_admin_delete ON survey_requests FOR DELETE USING (is_admin())`,
  `CREATE POLICY sa_admin_all ON survey_assignments FOR ALL USING (is_admin())`,
  `CREATE POLICY sa_surveyor_select ON survey_assignments FOR SELECT USING (surveyor_id = auth.uid())`,
  `CREATE POLICY sa_surveyor_update ON survey_assignments FOR UPDATE USING (surveyor_id = auth.uid())`,
  `CREATE POLICY rooms_admin ON rooms FOR ALL USING (is_admin())`,
  `CREATE POLICY rooms_surveyor ON rooms FOR ALL USING (EXISTS (SELECT 1 FROM survey_assignments sa WHERE sa.survey_request_id = rooms.survey_request_id AND sa.surveyor_id = auth.uid()))`,
  `CREATE POLICY items_admin ON items FOR ALL USING (is_admin())`,
  `CREATE POLICY items_surveyor ON items FOR ALL USING (EXISTS (SELECT 1 FROM rooms r JOIN survey_assignments sa ON sa.survey_request_id = r.survey_request_id WHERE r.id = items.room_id AND sa.surveyor_id = auth.uid()))`,
  `CREATE POLICY surveys_admin ON surveys FOR ALL USING (is_admin())`,
  `CREATE POLICY surveys_surveyor ON surveys FOR ALL USING (surveyor_id = auth.uid())`,
  `CREATE POLICY surveys_public ON surveys FOR SELECT USING (true)`,
  `CREATE POLICY gps_insert ON gps_locations FOR INSERT WITH CHECK (surveyor_id = auth.uid())`,
  `CREATE POLICY gps_admin ON gps_locations FOR ALL USING (is_admin())`,
  `CREATE POLICY gps_public ON gps_locations FOR SELECT USING (true)`,
  `CREATE POLICY chat_select ON chat_messages FOR SELECT USING (true)`,
  `CREATE POLICY chat_insert ON chat_messages FOR INSERT WITH CHECK (true)`,
  `CREATE POLICY chat_admin ON chat_messages FOR UPDATE USING (is_admin())`,
  `ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE item_library ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE pricing_routes ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE invoices ENABLE ROW LEVEL SECURITY`,
  `CREATE POLICY ica_select ON item_categories FOR SELECT USING (true)`,
  `CREATE POLICY ica_admin ON item_categories FOR ALL USING (is_admin())`,
  `CREATE POLICY il_select ON item_library FOR SELECT USING (true)`,
  `CREATE POLICY il_admin ON item_library FOR ALL USING (is_admin())`,
  `CREATE POLICY pr_select ON pricing_routes FOR SELECT USING (true)`,
  `CREATE POLICY pr_admin ON pricing_routes FOR ALL USING (is_admin())`,
  `CREATE POLICY inv_admin ON invoices FOR ALL USING (is_admin())`,
]

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes('Bearer')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const results: string[] = []

  // Run via pg rpc (won't work) or via raw query
  // We'll use the admin client to run each statement
  const adminUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  async function runSQL(sql: string): Promise<string> {
    const resp = await fetch(`${adminUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`,
        'apikey': adminKey,
      },
      body: JSON.stringify({ sql }),
    })
    if (!resp.ok) {
      const err = await resp.text()
      // Try alternative: use pg meta
      return `FAILED: ${err.slice(0, 100)}`
    }
    return 'OK'
  }

  // Run using pg_net or direct approach
  // Actually, use the Supabase pg-meta REST API
  async function runSQLViaMeta(sql: string): Promise<string> {
    const metaUrl = adminUrl.replace('.supabase.co', '.supabase.co') + '/pg/query'
    // Try the internal pg meta endpoint
    const resp = await fetch(`${adminUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`,
        'apikey': adminKey,
        'x-connection-encrypted': adminKey,
      },
      body: JSON.stringify({ query: sql }),
    })
    if (!resp.ok) {
      const err = await resp.text()
      return `FAILED ${resp.status}: ${err.slice(0, 100)}`
    }
    return 'OK'
  }

  // Create a PostgreSQL function first via direct SQL execution using the DB URL
  const dbUrl = Deno.env.get('DATABASE_URL') ?? Deno.env.get('SUPABASE_DB_URL') ?? ''

  results.push(`DB URL available: ${!!dbUrl}`)
  results.push(`Test via meta: ${await runSQLViaMeta('SELECT 1+1 as t')}`)
  results.push(`Test via rpc: ${await runSQL('SELECT 1+1 as t')}`)

  return new Response(JSON.stringify({ results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
