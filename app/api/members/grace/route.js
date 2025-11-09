import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { group_id, member_user_id, days = 3, actor_id } = await req.json();
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const until = new Date(); until.setDate(until.getDate()+Number(days));
    const { error } = await s.from('installments').update({ status:'due', cash_note:`grace_until:${until.toISOString().slice(0,10)}` })
      .eq('group_id', group_id).eq('from_user_id', member_user_id).eq('status','late');
    if (error) throw new Error(error.message);
    await s.from('audit_logs').insert([{ actor_id, group_id, action:'grace', details:{ member_user_id, days } }]);
    await s.from('notifications').insert([{ user_id: member_user_id, title:'Grace period started', body:`You have ${days} day(s) to catch up.`, meta:{ group_id } }]);
    return new Response(JSON.stringify({ ok:true }), { status:200 });
  } catch (e) { return new Response(JSON.stringify({ error:String(e?.message||e) }), { status:500 }); }
}
