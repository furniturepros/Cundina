import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const group_id = searchParams.get('group_id');
    if (!group_id) return new Response(JSON.stringify({ error:'group_id required' }), { status:400 });

    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: group } = await s.from('groups').select('id,name,contribution_amount').eq('id', group_id).single();
    const { data: activeMems } = await s.from('memberships').select('user_id').eq('group_id', group_id).eq('is_active', true);
    const activeCount = activeMems?.length || 0;

    const { data: lateInst } = await s.from('installments')
      .select('id,from_user_id,to_user_id,due_date,amount').eq('group_id', group_id).eq('status','late').order('due_date', { ascending:true });

    const { data: users } = await s.from('users').select('id,full_name');
    const nameOf = (id) => (users||[]).find(u=>u.id===id)?.full_name || '—';

    const late = (lateInst||[]).map(i => ({
      id: i.id, from_user_id: i.from_user_id, to_user_id: i.to_user_id,
      from_name: nameOf(i.from_user_id), to_name: nameOf(i.to_user_id),
      due_date: i.due_date, amount: i.amount
    }));

    const counts = {}; for (const i of (lateInst||[])) counts[i.from_user_id] = (counts[i.from_user_id]||0)+1;
    const atRisk = Object.entries(counts).filter(([_,c])=>c>=2).map(([user_id,c])=>({ user_id, name: nameOf(user_id), late_count:c }));

    const tdy = new Date().toISOString().slice(0,10);
    const { data: cycles } = await s.from('cycles').select('ordinal,payout_date').eq('group_id', group_id).order('payout_date', { ascending:true });
    const { data: order } = await s.from('payout_order').select('user_id,cycle_ordinal').eq('group_id', group_id);
    const upcoming = (cycles||[]).find(c => c.payout_date >= tdy);
    let nextPayout = null;
    if (upcoming) {
      const recUserId = (order||[]).find(o => o.cycle_ordinal === upcoming.ordinal)?.user_id || '';
      nextPayout = { date: upcoming.payout_date, ordinal: upcoming.ordinal, recipient: nameOf(recUserId), pot: (group?.contribution_amount||0)*activeCount };
    }

    const { data: audits } = await s.from('audit_logs').select('created_at,action,details').eq('group_id', group_id).order('created_at', { ascending:false }).limit(10);

    return new Response(JSON.stringify({
      group: { id: group?.id, name: group?.name, amount: group?.contribution_amount, activeCount },
      cards: { atRiskCount: atRisk.length, lateCount: late.length, nextPayout },
      tables: { atRisk, late, recentActions: (audits||[]).map(a => ({ when: a.created_at, action: a.action, details: a.details })) }
    }), { status:200, headers:{'content-type':'application/json'} });
  } catch (e) { return new Response(JSON.stringify({ error:String(e?.message||e) }), { status:500 }); }
}
