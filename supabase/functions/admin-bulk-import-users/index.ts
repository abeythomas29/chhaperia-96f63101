import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ImportUser {
  name: string;
  username: string; // email
  requested_department: string; // 'worker' | 'inventory_manager' | 'slitting_manager'
  status?: string;
  employee_id?: string;
  role?: string; // optional override role to assign; defaults to requested_department
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await caller.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return json({ error: "Only admins can import users" }, 403);

    const body = await req.json();
    const users: ImportUser[] = body.users ?? [];
    const defaultPassword: string = body.default_password ?? "Welcome@123";
    if (!Array.isArray(users) || users.length === 0) {
      return json({ error: "users array required" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const results: Array<{ email: string; status: string; user_id?: string; error?: string }> = [];

    // Pre-fetch existing auth users to detect duplicates
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingMap = new Map(existing.users.map((u) => [u.email?.toLowerCase() ?? "", u.id]));

    for (const u of users) {
      const email = u.username.trim();
      const emailLower = email.toLowerCase();
      try {
        let userId = existingMap.get(emailLower);

        if (!userId) {
          const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: {
              name: u.name,
              employee_id: u.employee_id ?? `EMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
              requested_department: u.requested_department,
            },
          });
          if (createErr || !created.user) {
            results.push({ email, status: "error", error: createErr?.message ?? "create failed" });
            continue;
          }
          userId = created.user.id;
        }

        // Upsert profile
        await admin.from("profiles").upsert(
          {
            user_id: userId,
            name: u.name,
            employee_id: u.employee_id ?? `EMP-${userId.slice(0, 6)}`,
            username: email,
            requested_department: u.requested_department,
            status: u.status ?? "active",
          },
          { onConflict: "user_id" },
        );

        // Assign role
        const role = u.role ?? u.requested_department;
        await admin.from("user_roles").upsert(
          { user_id: userId, role },
          { onConflict: "user_id,role" },
        );

        results.push({ email, status: existingMap.has(emailLower) ? "existed" : "created", user_id: userId });
      } catch (e) {
        results.push({ email, status: "error", error: (e as Error).message });
      }
    }

    return json({ results, default_password: defaultPassword });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
