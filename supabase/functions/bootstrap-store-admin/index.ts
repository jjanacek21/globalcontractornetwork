import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const email = 'admin@gcn.support';
  const password = 'Ebn4zcx7';

  // Try to find existing user
  let userId: string | null = null;
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find((u: any) => (u.email || '').toLowerCase() === email);
  if (existing) {
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    userId = data.user!.id;
  }

  // Assign admin role
  const { error: roleErr } = await admin
    .from('user_roles')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

  return new Response(JSON.stringify({ ok: true, userId, roleErr: roleErr?.message ?? null }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
