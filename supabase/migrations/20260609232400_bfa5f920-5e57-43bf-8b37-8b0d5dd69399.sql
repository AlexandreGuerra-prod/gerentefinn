
-- Lock down EXECUTE on SECURITY DEFINER trigger-only functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_recompute_invoice() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_transaction_to_invoice() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_invoice_total(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Restrict user-facing RPCs to authenticated users only (already check auth.uid() internally)
REVOKE EXECUTE ON FUNCTION public.materialize_due_recurrences(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.forecast_cashflow(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.materialize_due_recurrences(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.forecast_cashflow(uuid, integer) TO authenticated;
