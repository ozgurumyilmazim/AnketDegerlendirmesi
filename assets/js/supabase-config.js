// ====================================================================
// SUPABASE COMPATIBILITY WRAPPER
// Now delegates to pg-config.js for PostgreSQL backend
// Kept for backward compatibility - new code should use pg-config.js
// ====================================================================

// If PG_CONFIG is not loaded yet, set defaults
if (typeof window.PG_CONFIG === 'undefined') {
    console.warn('pg-config.js not loaded - loading via supabase-config.js fallback');
    // Inline minimal config for backward compat
    window.PG_CONFIG = {
        apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3001/api'
            : '/api',
        tables: { testResults: 'test_results' }
    };
}

// Ensure PG_API is set as supabase
if (!window.PG_API) {
    console.warn('PG_API not initialized - creating stub');
    window.PG_API = {
        from: () => ({
            select: () => ({ eq: () => ({ single: () => ({ then: (cb) => cb({ data: null, error: 'Offline' }) }) }) }),
            insert: () => ({ then: (cb) => cb({ data: null, error: 'Offline' }) }),
            upsert: () => ({ then: (cb) => cb({ data: null, error: 'Offline' }) }),
        }),
        auth: { signInWithPassword: () => Promise.resolve({ error: 'Offline' }) },
    };
}

// Set global supabase reference
if (!window.supabase) {
    window.supabase = window.PG_API;
}

// Compatibility wrapper for task definitions scripts
window.supabaseClient = {
    get supabaseClient() {
        return window.PG_API || window.supabase;
    }
};

// Ensure AuthService exists (from pg-config.js)
if (!window.AuthService) {
    window.AuthService = {
        async signIn() { return { error: 'Auth not configured' }; },
        async signOut() {},
        async getSession() { return { data: { session: null } }; },
        async isAdmin() { return false; },
    };
}

// Connection status
function initializeSupabase() {
    const ok = !!window.PG_API && !!window.PG_CONFIG;
    if (!ok) {
        console.warn('PostgreSQL API not configured - offline / dev mode');
    } else {
        console.log('PostgreSQL API backend ready');
    }
    return ok;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeSupabase();
});
