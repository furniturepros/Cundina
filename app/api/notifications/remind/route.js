import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const b = await req.json();
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    async function push(user_id, title, body, meta={}) {
      const { error } = await s.from('notifications').insert([{ user_id, title, body, meta }]);
      if (error) throw new Error(error.message);
    }
    if (b.kind === 'single') {
      await push(b.user_id, b.title||'Reminder', b.body||'You have an action pending.', { group_id:b.group_id, ...(b.meta||{}) });
      return new Response(JSON.stringify({ ok:true, sent:1 }), { status:200 });
    }
    if (b.kind === 'late_payer' || b.kind === 'late_recipient') {
      const { data: inst } = await s.from('installments').select('id,from_user_id,to_user_id,due_date,amount').eq('id', b.installment_id).single();
      if (!inst) return new Response(JSON.stringify({ error:'Installment not found' }), { status:404 });
      if (b.kind === 'late_payer') {
        await push(inst.from_user_id, 'Payment reminder', `Please pay $${Number(inst.amount).toFixed(2)} (due ${inst.due_date}).`, { group_id:b.group_id, installment_id:inst.id, role:'payer' });
      } else {
        await push(inst.to_user_id, 'Heads up: expected payment', `A member still owes you $${Number(inst.amount).toFixed(2)} from ${inst.due_date}.`, { group_id:b.group_id, installment_id:inst.id, role:'recipient' });
      }
      return new Response(JSON.stringify({ ok:true, sent:1 }), { status:200 });
    }
    if (b.kind === 'bulk_all_late') {
      const { data: late } = await s.from('installments').select('id,from_user_id,due_date,amount').eq('group_id', b.group_id).eq('status','late');
      let sent = 0;
      for (const i of (late||[])) {
        await push(i.from_user_id, 'Payment reminder', `Please pay $${Number(i.amount).toFixed(2)} (due ${i.due_date}).`, { group_id:b.group_id, installment_id:i.id, role:'payer', bulk:true });
        sent++;
      }
      return new Response(JSON.stringify({ ok:true, sent }), { status:200 });
    }
    return new Response(JSON.stringify({ error:'Invalid payload' }), { status:400 });
  } catch (e) { return new Response(JSON.stringify({ error:String(e?.message||e) }), { status:500 }); }
}
