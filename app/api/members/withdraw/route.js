import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { group_id, member_user_id, actor_id } = await req.json();
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: g } = await s.from('groups').select('contribution_amount').eq('id', group_id).single();
    const { data: cycles } = await s.from('cycles').select('ordinal,payout_date').eq('group_id', group_id).order('ordinal');
    const { data: order } = await s.from('payout_order').select('*').eq('group_id', group_id);
    const receivedOrdinal = (order||[]).find(o=>o.user_id===member_user_id)?.cycle_ordinal ?? null;
    const today = new Date().toISOString().slice(0,10);
    const pastOrCurrent = (o)=> (cycles||[]).some(c=>c.ordinal===o && c.payout_date<=today);

    await s.from('installments').delete().eq('group_id', group_id).eq('from_user_id', member_user_id).in('status',['due','late']);

    let outstanding = 0;
    if (receivedOrdinal && pastOrCurrent(receivedOrdinal)) {
      const remainingCount = (cycles||[]).filter(c => c.ordinal > receivedOrdinal).length;
      outstanding = Number(g?.contribution_amount||0) * remainingCount;
      if (outstanding>0) await s.from('outstanding_balances').insert([{ group_id, user_id: member_user_id, amount: outstanding, reason:'early_exit' }]);
    }

    const remaining = (order||[]).filter(p=>p.user_id!==member_user_id).sort((a,b)=>a.cycle_ordinal-b.cycle_ordinal);
    await s.from('payout_order').delete().eq('group_id', group_id);
    const reindexed = remaining.map((p,i)=>({ group_id, user_id: p.user_id, cycle_ordinal: i+1 }));
    if (reindexed.length) await s.from('payout_order').insert(reindexed);

    await s.from('memberships').update({ is_active:false }).eq('group_id', group_id).eq('user_id', member_user_id);
    await s.from('audit_logs').insert([{ actor_id, group_id, action:'withdraw', details:{ member_user_id, outstanding } }]);

    return new Response(JSON.stringify({ ok:true, outstanding }), { status:200 });
  } catch (e) { return new Response(JSON.stringify({ error:String(e?.message||e) }), { status:500 }); }
}
