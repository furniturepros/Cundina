import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { group_id, old_user_id, new_member, actor_id } = await req.json();
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: newUser, error: uErr } = await s.from('users').upsert({ full_name:new_member.name, email:new_member.email }, { onConflict:'email' }).select().single();
    if (uErr) throw new Error(uErr.message);
    await s.from('memberships').upsert({ group_id, user_id: newUser.id, role:'member', is_active:true }, { onConflict:'group_id,user_id' });
    const { data: cycles } = await s.from('cycles').select('ordinal,payout_date').eq('group_id', group_id).order('ordinal');
    const { data: order } = await s.from('payout_order').select('*').eq('group_id', group_id);
    const { data: g } = await s.from('groups').select('contribution_amount').eq('id', group_id).single();
    const today = new Date().toISOString().slice(0,10);
    const past = (cycles||[]).filter(c=>c.payout_date<today);
    const catchups = past.map(c=>{
      const rec = (order||[]).find(o=>o.cycle_ordinal===c.ordinal)?.user_id;
      return { group_id, cycle_ordinal:c.ordinal, from_user_id:newUser.id, to_user_id:rec, due_date: today, amount:g?.contribution_amount||0, status:'due', method:null, cash_note:'catchup' };
    });
    if (catchups.length) await s.from('installments').insert(catchups);
    await s.from('memberships').update({ is_active:false }).eq('group_id', group_id).eq('user_id', old_user_id);
    await s.from('audit_logs').insert([{ actor_id, group_id, action:'replace', details:{ old_user_id, new_user_id:newUser.id, catchup_count:catchups.length } }]);
    return new Response(JSON.stringify({ ok:true, new_user_id:newUser.id, catchup_count:catchups.length }), { status:200 });
  } catch (e) { return new Response(JSON.stringify({ error:String(e?.message||e) }), { status:500 }); }
}
