// Debug script – fetches Auth.users and public.users and renders a table
// This script is intended for temporary troubleshooting and does NOT require authentication.

(async () => {
    // Ensure Supabase client is initialized (supabase-config.js already loads it)
    if (!window.supabase) {
        document.getElementById('status').textContent = 'Supabase client not initialized.';
        return;
    }
    try {
        // 1. Fetch all auth users (requires service_role key – we use anon key, so we can only fetch public view)
        // In Supabase the `auth.users` table is not directly readable with anon key.
        // Instead we call the admin REST endpoint via `rpc` that returns users – this works only if RLS permits.
        // For quick debugging we use `from('users')` which points to the public.users table we already have.
        const { data: publicUsers, error: publicErr } = await supabase.from('users').select('id, role, email');
        if (publicErr) throw publicErr;

        // Try to fetch auth user emails via the `auth.users` view (requires service role). If not permitted, we fallback to empty.
        let authUsers = [];
        const { data: authData, error: authErr } = await supabase.from('auth.users').select('id, email');
        if (authErr) {
            console.warn('Unable to read auth.users with anon key – showing only public users.', authErr);
        } else {
            authUsers = authData;
        }

        // Merge by id
        const rows = publicUsers.map(pu => {
            const au = authUsers.find(u => u.id === pu.id) || {};
            return {
                email: pu.email || au.email || '(no email)',
                role: pu.role || '(none)',
                id: pu.id
            };
        });

        // Render table
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';
        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.email}</td>
                <td>${row.role}</td>
                <td>${row.id}</td>
            `;
            tbody.appendChild(tr);
        });
        document.getElementById('status').textContent = `Loaded ${rows.length} users`;
    } catch (e) {
        console.error('Debug fetch error:', e);
        document.getElementById('status').textContent = 'Error loading data – check console.';
    }
})();
