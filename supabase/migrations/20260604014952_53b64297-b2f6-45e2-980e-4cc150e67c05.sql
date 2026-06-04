ALTER POLICY "Workers can insert usage"
ON public.raw_material_usage
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.production_entries pe
    WHERE pe.id = production_entry_id
      AND pe.worker_id = auth.uid()
  )
);