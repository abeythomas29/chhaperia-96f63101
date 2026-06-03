
REVOKE EXECUTE ON FUNCTION public.adjust_raw_material_stock_on_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_raw_material_on_sale_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_raw_material_usage_on_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reverse_raw_material_stock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reverse_raw_material_on_sale_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reverse_raw_material_usage() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_raw_material_stock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_raw_material_on_sale() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_raw_material_stock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
