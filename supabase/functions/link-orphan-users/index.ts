import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── 1. Verify caller is admin ───────────────────────────────
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) throw new Error('غير مصرح');
    if (user.app_metadata?.role !== 'admin') throw new Error('صلاحية المدير فقط');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── 2. Get all supplier/distributor users ────────────────────
    const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) throw authErr;

    const partnerUsers = authUsers.users.filter(
      (u) => u.app_metadata?.role === 'supplier' || u.app_metadata?.role === 'distributor'
    );

    // ── 3. Get existing partners with user_id ────────────────────
    const { data: existingPartners } = await supabaseAdmin
      .from('partners')
      .select('user_id')
      .not('user_id', 'is', null);

    const linkedUserIds = new Set((existingPartners || []).map((p: any) => p.user_id));

    // ── 4. Insert missing partners ─────────────────────────────
    const toInsert = partnerUsers
      .filter((u) => !linkedUserIds.has(u.id))
      .map((u) => {
        const role = u.app_metadata?.role;
        const name = (u.user_metadata?.name || u.email || 'مجهول').trim();
        return {
          name,
          type: role === 'supplier' ? 'مورد' : 'موزع',
          phone: u.user_metadata?.phone || null,
          initial_letter: name.charAt(0) || 'م',
          user_id: u.id,
        };
      });

    let fixed = 0;
    if (toInsert.length > 0) {
      const { error: insertErr } = await supabaseAdmin.from('partners').insert(toInsert);
      if (insertErr) throw insertErr;
      fixed = toInsert.length;
    }

    return new Response(
      JSON.stringify({ success: true, fixed, message: fixed > 0 ? `تم ربط ${fixed} حساب بنجاح` : 'جميع الحسابات مرتبطة بالفعل' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
