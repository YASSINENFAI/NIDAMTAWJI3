import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) throw new Error('غير مصرح');
    const callerRole = user.app_metadata?.role;
    if (callerRole !== 'admin') throw new Error('صلاحية المدير فقط');

    // Parse body
    const { email, password, role, name, phone } = await req.json();
    if (!email || !password || !role) throw new Error('البيانات ناقصة');
    if (!['supplier', 'distributor'].includes(role)) throw new Error('دور غير صحيح');

    // Create user with service role
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

    return new Response(
      JSON.stringify({ success: true, userId: newUser.user?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
