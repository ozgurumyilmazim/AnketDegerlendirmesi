// ====================================================================
// PostgreSQL API CONFIGURATION
// Replaces supabase-config.js for direct PostgreSQL backend
// ====================================================================

window.PG_CONFIG = {
    apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001/api'
        : '/api',
    tables: {
        testResults: 'test_results',
        participants: 'participants',
        questions: 'questions',
        reports: 'reports'
    }
};

// ====================================================================
// AuthService — uses JWT tokens via backend API (replaces Supabase Auth)
// ====================================================================
window.AuthService = {
    _token: localStorage.getItem('mmpi_token'),

    getToken() {
        return this._token;
    },

    setToken(token) {
        this._token = token;
        if (token) {
            localStorage.setItem('mmpi_token', token);
        } else {
            localStorage.removeItem('mmpi_token');
        }
    },

    async _fetch(path, options = {}) {
        const headers = { 'Content-Type': 'application/json' };
        if (this._token) {
            headers['Authorization'] = 'Bearer ' + this._token;
        }
        const res = await fetch(window.PG_CONFIG.apiUrl + path, {
            ...options,
            headers: { ...headers, ...options.headers },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API request failed');
        return data;
    },

    async signIn(email, password) {
        const result = await this._fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(result.session.access_token);
        return { data: { user: result.user, session: result.session } };
    },

    async signOut() {
        try {
            await this._fetch('/auth/logout', { method: 'POST' });
        } catch (_) {}
        this.setToken(null);
    },

    async getSession() {
        if (!this._token) return { data: { session: null } };
        try {
            const result = await this._fetch('/auth/session');
            return { data: { session: { user: result.user } } };
        } catch (_) {
            this.setToken(null);
            return { data: { session: null } };
        }
    },

    async getUser() {
        const { data: { session } } = await this.getSession();
        return { data: { user: session?.user || null } };
    },

    async getUserRole() {
        try {
            const { data: { session } } = await this.getSession();
            return session?.user?.role || null;
        } catch (_) {
            return null;
        }
    },

    async isAdmin() {
        const role = await this.getUserRole();
        return role === 'admin';
    },

    onAuthStateChange(callback) {
        // Polling-based auth state detection
        const check = async () => {
            const { data: { session } } = await this.getSession();
            callback('SIGNED_IN', session);
        };
        check();
        return { data: { subscription: { unsubscribe: () => {} } } };
    }
};

// ====================================================================
// API Helper — generic CRUD via fetch (replaces supabase.from().*)
// ====================================================================
window.PG_API = {
    _token: localStorage.getItem('mmpi_token'),

    _getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this._token) {
            headers['Authorization'] = 'Bearer ' + this._token;
        }
        return headers;
    },

    async _fetch(path, options = {}) {
        try {
            const res = await fetch(window.PG_CONFIG.apiUrl + path, {
                ...options,
                headers: { ...this._getHeaders(), ...options.headers },
            });
            return await res.json();
        } catch (err) {
            console.error('PG_API error:', path, err);
            return { error: err.message, data: null };
        }
    },

    // CRUD helpers matching Supabase-like return { data, error }
    async get(path) {
        const result = await this._fetch(path);
        if (result.error) return { data: null, error: result.error };
        return { data: result.data, error: null };
    },

    async post(path, body) {
        const result = await this._fetch(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
        if (result.error) return { data: null, error: result.error };
        return { data: result.data, error: null };
    },

    async put(path, body) {
        const result = await this._fetch(path, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
        if (result.error) return { data: null, error: result.error };
        return { data: result.data, error: null };
    },

    async del(path) {
        const result = await this._fetch(path, { method: 'DELETE' });
        if (result.error) return { data: null, error: result.error };
        return { data: result, error: null };
    },

    // CRUD helpers that mimic Supabase query builder
    from(table) {
        const self = this;
        let _select = '*';
        let _filters = [];
        let _orderBy = null;
        let _orderDir = 'asc';
        let _limit = null;
        let _single = false;

        const _buildQuery = () => {
            const params = new URLSearchParams();
            if (_select !== '*') params.set('select', _select);
            _filters.forEach(f => params.set(f.field, f.value));
            if (_orderBy) params.set('order', `${_orderBy}:${_orderDir}`);
            if (_limit) params.set('limit', _limit);
            const qs = params.toString();
            return qs ? `?${qs}` : '';
        };

        return {
            select(columns) {
                if (columns) _select = columns;
                return this;
            },
            eq(field, value) {
                _filters.push({ field, value });
                return this;
            },
            order(column, { ascending = true } = {}) {
                _orderBy = column;
                _orderDir = ascending ? 'asc' : 'desc';
                return this;
            },
            limit(n) {
                _limit = n;
                return this;
            },
            single() {
                _single = true;
                return this;
            },
            async then(resolve, reject) {
                const result = await self._fetch(`/${table}${_buildQuery()}`);
                if (result.error) {
                    reject?.({ message: result.error });
                    return resolve?.({ data: null, error: result.error });
                }
                let data = result.data || [];
                if (_single) data = data[0] || null;
                resolve?.({ data, error: null });
                return { data, error: null };
            },
            async insert(items) {
                const arr = Array.isArray(items) ? items : [items];
                const result = await self._fetch(`/${table}`, {
                    method: 'POST',
                    body: JSON.stringify(arr[0]),
                });
                if (result.error) return { data: null, error: result.error };
                const data = Array.isArray(result.data) ? result.data : [result.data];
                return { data, error: null };
            },
            async update(values) {
                // Requires an eq filter for the WHERE clause
                const idFilter = _filters.find(f => f.field === 'id');
                if (!idFilter) return { data: null, error: 'Update requires .eq(\'id\', value)' };
                const result = await self._fetch(`/${table}/${idFilter.value}`, {
                    method: 'PUT',
                    body: JSON.stringify(values),
                });
                if (result.error) return { data: null, error: result.error };
                return { data: result.data, error: null };
            },
            async delete() {
                const idFilter = _filters.find(f => f.field === 'id');
                if (!idFilter) return { data: null, error: 'Delete requires .eq(\'id\', value)' };
                const result = await self._fetch(`/${table}/${idFilter.value}`, { method: 'DELETE' });
                if (result.error) return { data: null, error: result.error };
                return { data: result, error: null };
            },
            maybeSingle() {
                _single = true;
                return this;
            },
            async upsert(items) {
                // Upsert = try insert, on conflict update
                return this.insert(items);
            },
        };
    }
};

// ====================================================================
// Compatibility — aliases for scripts expecting window.supabase
// ====================================================================
window.supabase = window.PG_API;

window.supabaseClient = {
    get supabaseClient() {
        return window.PG_API;
    }
};

// ====================================================================
// Initialize on page load
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('PG API config loaded. Server:', window.PG_CONFIG.apiUrl);
});
