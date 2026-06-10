// Debug script – fetches all users and renders a table
// This script is intended for temporary troubleshooting.

(async () => {
    if (!window.supabase) {
        document.getElementById('status').textContent = 'DB client not initialized.';
        return;
    }
    try {
        const { data: users, error: err } = await supabase.from('users').select('id, email, role');
        if (err) throw err;

        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';
        (users || []).forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.email || '(no email)'}</td>
                <td>${row.role || '(none)'}</td>
                <td>${row.id}</td>
            `;
            tbody.appendChild(tr);
        });
        document.getElementById('status').textContent = `Loaded ${(users || []).length} users`;
    } catch (e) {
        console.error('Debug fetch error:', e);
        document.getElementById('status').textContent = 'Error loading data – check console.';
    }
})();
