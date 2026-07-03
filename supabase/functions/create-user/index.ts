import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── 1. Verify caller is admin ─────────────────────────────────
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) throw new Error('غير مصرح');
    if (user.app_metadata?.role !== 'admin') throw new Error('صلاحية المدير فقط');

    // ── 2. Parse body ─────────────────────────────────────────────
    const { email, password, role, name, phone } = await req.json();
    if (!email || !password || !role) throw new Error('البيانات ناقصة');
    if (!['supplier', 'distributor'].includes(role)) throw new Error('دور غير صحيح');
    if (!name?.trim()) throw new Error('الاسم مطلوب لإنشاء ملف الشريك');

    // ── 3. Create auth user (service role) ───────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { name, phone },
    });
    if (createErr) throw createErr;
    const newUserId = newUser.user!.id;

    // ── 4. Get partner row linked to the new user ──────────────
    // The database trigger public.auto_create_partner() handles creation.
    // We just need to fetch the ID to return it.
    let partnerId = null;
    let attempts = 0;
    while (attempts < 5) {
      const { data: partnerRow } = await supabaseAdmin
        .from('partners')
        .select('id')
        .eq('user_id', newUserId)
        .maybeSingle();
      
      if (partnerRow) {
        partnerId = partnerRow.id;
        break;
      }
      
      // Wait a bit for the trigger to finish
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!partnerId) {
      throw new Error('فشل ربط الحساب بملف الشريك تلقائياً. يرجى المحاولة مرة أخرى.');
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUserId, partnerId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
