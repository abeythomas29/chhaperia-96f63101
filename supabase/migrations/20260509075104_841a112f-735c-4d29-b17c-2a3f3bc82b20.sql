
CREATE POLICY "Inventory managers can update raw materials"
ON public.raw_materials FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'inventory_manager'))
WITH CHECK (has_role(auth.uid(), 'inventory_manager'));

CREATE POLICY "Inventory managers can delete raw materials"
ON public.raw_materials FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'inventory_manager'));
