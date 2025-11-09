import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { group_id, actor_id, mode='shrink' } = await req.json();
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: mems } = await s.from('memberships').select('user_id').eq('group_id', group_id).eq('is_active', true);
    if (!mems || mems.length<2) return new Response(JSON.stringify({ error:'Not enough members' }), { status:400 });
    await s.from('audit_logs').insert([{ actor_id, group_id, action:'shortfall', details:{ mode, active_members: mems.length } }]);
    return new Response(JSON.stringify({ ok:true, mode, note: mode==='shrink' ? 'pot_will_shrink' : 'not_supported_in_mvp' }), { status:200 });
  } catch (e) { return new Response(JSON.stringify({ error:String(e?.message||e) }), { status:500 }); }
}
