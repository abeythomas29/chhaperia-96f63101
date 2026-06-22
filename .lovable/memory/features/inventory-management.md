---
name: Unified Inventory Management
description: Single page combining finished stock and raw materials, with role-gated edit/issue actions and wastage reporting
type: feature
---
- `/admin/inventory`, `/worker/inventory`, `/slitting/inventory` all render `src/pages/inventory/InventoryManagement.tsx`.
- That page embeds `<StockManagement embedded readOnly={...} />` and `<RawMaterials embedded readOnly={...} />` side-by-side (xl:grid-cols-2).
- Edit/Issue/Add Stock buttons only render for Admin, Super Admin, or Inventory Manager. Other roles get view-only.
- Old `/admin/stock` and `/worker/stock` redirect to the new inventory route.
- Slitting Entry form loads issued material via `list_slitting_issued_materials()` RPC; selected entry shows Issued / Consumed / Pending and saves `stock_issue_id` on each `slitting_entries` row.
- Material Return has Reusable / Wastage radio. Reusable returns require a Location (free-text until storage_locations table exists). Wastage is aggregated by product category via `list_wastage_by_category()` and shown in Inventory Management for admins.
