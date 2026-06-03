
## Goal

Go back to the earlier behavior where "admin" was an option at signup that also waited for approval, and make sure admins (once approved) can freely open both the Production Manager (`/worker`) and Slitting Manager (`/slitting`) layouts without being redirected to `/admin`. The forced redirect is the likely cause of the "stuck" feeling and the missing-users symptom after multi-role admins were created.

## What changes

### 1. Signup — add "Admin" as a requestable department again
- `src/pages/Login.tsx`: add **Admin** to the department dropdown (alongside Production Manager / Inventory Manager / Slitting Manager). Update the zod schema enum to include `"admin"`.
- `src/hooks/auth-context.ts` + `src/hooks/useAuth.tsx`: extend `SignupDepartment` and the `signUpSchema` enum to include `"admin"`.
- New admin signups stay **pending** (no role row is created automatically). An existing admin/super admin must approve them in User Management and assign the `admin` role — exactly like worker/slitting/inventory approvals today.
- No DB change needed: `requested_department` is already free text in the profile flow and `handle_new_user` defaults unknown values to `worker`, so we will widen the `signup_department` enum to include `'admin'` via a migration and update `handle_new_user` to map it.

### 2. Stop redirecting admins out of the other layouts
- `src/layouts/WorkerLayout.tsx`: remove the `!isWorker && isAdmin → /admin` redirect. Allow access if `isWorker || isAdmin`. Only redirect to `/login` when the user has none of those.
- `src/layouts/SlittingManagerLayout.tsx`: same change — allow `isSlittingManager || isAdmin`.
- `src/layouts/InventoryManagerLayout.tsx`: same change — allow `isInventoryManager || isAdmin` (for consistency, so admins are never stuck on any sub-layout).
- Keep the existing "Other Roles" group in `AdminSidebar` so admins can navigate to `/worker` and `/slitting` from the admin panel.

### 3. Default landing for approved admin
- `src/pages/Login.tsx`: leave admin login redirect at `/admin` (unchanged). From there the admin can jump into Production Manager or Slitting Manager via the sidebar.

## Why this should also fix the "users not showing" symptom

When an admin who also carried `worker`/`slitting_manager` roles signed in, the layout guards bounced them between `/worker` → `/admin` → `/worker` depending on order of role checks, which can interrupt the `admin_list_users` RPC call on `UserManagement`. Removing the forced redirects lets the admin page mount cleanly and finish the RPC.

## Out of scope
- No deletion of users, roles, or data.
- No change to `admin_list_users`, RLS, or grants — they were fixed in the previous migration.
- No change to the AdminSidebar structure beyond what already exists.

## Technical notes
- Migration: `ALTER TYPE public.signup_department ADD VALUE IF NOT EXISTS 'admin';` and update `handle_new_user` mapping to recognize `'admin'`.
- Approval still happens through the existing User Management UI (assign role = `admin`).
