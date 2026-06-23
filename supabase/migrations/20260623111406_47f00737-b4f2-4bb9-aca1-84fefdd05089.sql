ALTER TABLE public.raw_material_stock_entries
  ADD COLUMN IF NOT EXISTS pallet_count numeric,
  ADD COLUMN IF NOT EXISTS roll_count numeric;