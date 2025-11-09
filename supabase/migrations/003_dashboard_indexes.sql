create index if not exists idx_installments_group_status on installments (group_id, status);
create index if not exists idx_cycles_group_date on cycles (group_id, payout_date);
create index if not exists idx_payout_order_group_ordinal on payout_order (group_id, cycle_ordinal);
create index if not exists idx_memberships_group_active on memberships (group_id, is_active);
create index if not exists idx_audit_logs_group_time on audit_logs (group_id, created_at);
