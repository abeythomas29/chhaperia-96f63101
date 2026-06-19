
## Goal

Turn the per-card action and the issue dialog into a single "Issue" flow that can send stock either to a **Client** or to a **Production Manager** (by user ID), so production-bound stock is traceable to the manager who received it. Also tighten the dialog's vertical ratio.

## UI changes — `src/pages/admin/StockManagement.tsx`

1. Card button label: `Issue to Client` → `Issue`.
2. Header button stays `Issue Stock`.
3. Inside the dialog, add a **Recipient Type** segmented control / select at the top of the recipient row:
   - `Client` (default)
   - `Production Manager`
4. The field below it switches based on the selection:
   - Client → existing searchable client dropdown (active `company_clients`).
   - Production Manager → searchable dropdown of users whose `user_roles.role` is `production_manager` (label: `Name · employee_id`).
5. Dialog ratio fix: reduce vertical bloat — put Quantity / Thickness / Unit in a 3-col grid (already are), shrink Notes to `rows={2}`, set dialog `max-w-lg` and remove extra vertical spacing so it isn't a tall narrow column on wide screens. (Image shows it's too tall vs. width.)
6. Inward/Outward ledger: in the "Client" column for OUT rows, show the recipient — client name OR `Production Mgr: <name>` when issued to a manager.

## Data fetching

- Add a `productionManagers` list fetched via `user_roles` joined to `profiles` (filter `role = 'production_manager'`, `status = 'active'`).
- On submit:
  - If recipient = Client → insert `client_id` as today, `recipient_type = 'client'`, `recipient_user_id = null`.
  - If recipient = Production Manager → insert `recipient_type = 'production_manager'`, `recipient_user_id = <selected>`, `client_id = null`.

## Database migration

`stock_issues` currently requires `client_id NOT NULL`. Migration will:

- Add `recipient_type text NOT NULL DEFAULT 'client'` with check `in ('client','production_manager')`.
- Add `recipient_user_id uuid NULL REFERENCES profiles(user_id)`.
- Drop `NOT NULL` from `client_id`.
- Add a row-level CHECK via trigger (not CHECK constraint) ensuring exactly one of `client_id` / `recipient_user_id` is set and matches `recipient_type`.
- Backfill existing rows: `recipient_type = 'client'` (already the default).
- Keep existing RLS/grants unchanged.

## Read paths to update

- `StockManagement.tsx` ledger: select `recipient_type, recipient_user_id` and resolve manager names via a profiles lookup; display accordingly.
- `src/pages/worker/MyIssues.tsx`, `src/pages/admin/Dashboard.tsx`, `src/pages/admin/Products.tsx`, `src/pages/inventory/InventoryView.tsx`, `src/lib/stock.ts`: only touch where they render the recipient column, so manager-issued rows don't show `—`. No business-logic changes.

## Out of scope

- No new "production receipt" workflow yet — this only records who received the material. Tying it to completed production entries can come later.

## Confirm before I build

- OK to make `client_id` nullable and gate on `recipient_type`?
- Should "Production Manager" recipients be limited to role `production_manager` only, or also include `slitting_manager`?
