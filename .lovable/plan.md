## Goal

Split the current Inventory Manager into two distinct roles:

- **Inventory Manager** — raw materials only (stock in/out, usage, inventory view). No sales access.
- **Sales Manager** *(new)* — sales entry, edit, delete, and sales history only.

Existing inventory managers keep their current role; admin assigns Sales Manager separately.

## Database changes (migration)

1. Add `sales_manager` to the `app_role` enum.
2. Add `sales_manager` to the `signup_department` enum.
3. Update `handle_new_user()` trigger function to map the new `sales_manager` signup option.
4. Add RLS policies on `sales` table allowing users with role `sales_manager` to SELECT / INSERT / UPDATE / DELETE (mirroring current inventory_manager policies).
5. Remove sales INSERT/UPDATE/DELETE permission from `inventory_manager` policies on the `sales` table (keep SELECT only if needed, otherwise drop entirely). Admin/super_admin policies stay.

## Frontend changes

**`src/hooks/auth-context.ts`**
- Add `isSalesManager: boolean`.

**`src/hooks/useAuth.tsx`**
- Add `"sales_manager"` to signup zod enum and priority array.
- Expose `isSalesManager: roles.includes("sales_manager")`.

**`src/App.tsx`**
- New route group `/sales` using a new `SalesManagerLayout`, with:
  - `index` → `SalesEntry`
  - `history` → `SalesHistory`
- Remove `sales` and `sales-history` routes from `/inventory`.

**`src/layouts/SalesManagerLayout.tsx`** *(new)*
- Header + nav like other layouts. Tabs: Record Sale, Sales History.
- Guards: redirect non-sales-manager (admin → `/admin`, else `/login`).

**`src/layouts/InventoryManagerLayout.tsx`**
- Remove Record Sale and Sales History nav items.

**`src/pages/Login.tsx`**
- Add `sales_manager` to enum, state, signup dropdown ("Sales Manager").
- Redirect `sales_manager` → `/sales`.

**`src/pages/admin/UserManagement.tsx`**
- Add `sales_manager: "Sales Manager"` to label maps and role options.

## Out of scope

- Existing inventory managers are not auto-granted the new role. Admin must assign it via User Management.
- Admin panel `/admin/sales` (SalesHistory view) stays as-is for admins.

## Files touched

- new migration
- `src/hooks/auth-context.ts`
- `src/hooks/useAuth.tsx`
- `src/App.tsx`
- `src/layouts/SalesManagerLayout.tsx` (new)
- `src/layouts/InventoryManagerLayout.tsx`
- `src/pages/Login.tsx`
- `src/pages/admin/UserManagement.tsx`
