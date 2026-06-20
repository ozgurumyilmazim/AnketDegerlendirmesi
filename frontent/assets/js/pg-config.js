// ====================================================================
// PostgreSQL API CONFIGURATION (via PostgREST)
// Replaces PG_API and the Express API layer
// ====================================================================

window.PG_CONFIG = {
    // Dev: PostgREST at postgrest:3000 (internal Docker hostname)
    // Prod: PostgREST at selma.ozguryilmaz.com.tr/api (public)
    apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://postgrest:3000'
        : 'https://selma.ozguryilmaz.com.tr/api',
    tables: {
        testResults: 'test_results',
        participants: 'participants',
        questions: 'questions',
        reports: 'reports'
    }
};

// ====================================================================
// AuthService — JWT-based auth via PostgREST /rpc/login
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

    _decodeJWT(token) {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch (_) {
            return null;
        }
    },

    async signIn(email, password) {
        try {
            const res = await fetch(window.PG_CONFIG.apiUrl + '/rpc/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Login failed');
            const token = body;
            this.setToken(token);
            const claims = this._decodeJWT(token);
            const user = {
                id: claims.user_id,
                email: claims.email,
                name: claims.name,
                role: claims.role_name,
                user_metadata: { name: claims.name, full_name: claims.name }
            };
            return { data: { user, session: { access_token: token } } };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async signOut() {
        this.setToken(null);
    },

    async getSession() {
        if (!this._token) return { data: { session: null } };
        const claims = this._decodeJWT(this._token);
        if (!claims || claims.exp * 1000 < Date.now()) {
            this.setToken(null);
            return { data: { session: null } };
        }
        return {
            data: {
                session: {
                    user: {
                        id: claims.user_id,
                        email: claims.email,
                        name: claims.name,
                        role: claims.role_name
                    }
                }
            }
        };
    },

    async getUser() {
        const { data: { session } } = await this.getSession();
        return { data: { user: session?.user || null } };
    },

    async getUserRole() {
        const { data: { session } } = await this.getSession();
        return session?.user?.role || null;
    },

    async isAdmin() {
        const role = await this.getUserRole();
        return role === 'admin';
    },

    onAuthStateChange(callback) {
        const { data: { session } } = this._decodeJWT(this._token)
            ? { data: { session: true } }
            : { data: { session: null } };
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        return { data: { subscription: { unsubscribe: () => {} } } };
    }
};

// ====================================================================
// PG_API — generic CRUD via PostgREST (mimics PG_API.from())
// ====================================================================
window.PG_API = {
    _getHeaders(profile) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept-Profile': profile || 'public',
            'Content-Profile': profile || 'public',
        };
        const token = localStorage.getItem('mmpi_token');
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return headers;
    },

    async _fetch(path, options = {}) {
        try {
            const res = await fetch(window.PG_CONFIG.apiUrl + path, {
                ...options,
                headers: { ...this._getHeaders(), ...options.headers },
            });
            // PostgREST returns 204 No Content for some operations
            if (res.status === 204) return { data: null, error: null };
            const text = await res.text();
            if (!res.ok) return { data: null, error: text || 'Request failed' };
            try {
                return { data: JSON.parse(text), error: null };
            } catch (_) {
                return { data: null, error: 'Invalid JSON response' };
            }
        } catch (err) {
            return { data: null, error: err.message };
        }
    },

    async get(path) {
        return this._fetch(path);
    },

    async post(path, body) {
        return this._fetch(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    async put(path, body) {
        return this._fetch(path, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    async del(path) {
        return this._fetch(path, { method: 'DELETE' });
    },

    // Chainable query builder matching PG_API API
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
            _filters.forEach(f => {
                if (f.type === 'in') {
                    params.set(f.field, 'in.(' + f.value.join(',') + ')');
                } else {
                    params.set(f.field, 'eq.' + f.value);
                }
            });
            if (_orderBy) params.set('order', _orderBy + '.' + (_orderDir === 'asc' ? 'asc' : 'desc'));
            if (_limit) params.set('limit', _limit);
            const qs = params.toString();
            return qs ? '?' + qs : '';
        };

        return {
            select(columns) {
                if (columns) _select = columns;
                return this;
            },
            eq(field, value) {
                _filters.push({ field, value, type: 'eq' });
                return this;
            },
            in(field, values) {
                const arr = Array.isArray(values) ? values : [values];
                _filters.push({ field, value: arr.filter(v => v != null), type: 'in' });
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
            maybeSingle() {
                _single = true;
                return this;
            },
            async then(resolve, reject) {
                const result = await self._fetch('/' + table + _buildQuery());
                if (result.error) {
                    reject?.({ message: result.error });
                    return resolve?.({ data: null, error: result.error });
                }
                let data = result.data || [];
                if (!Array.isArray(data)) data = [data];
                if (_single) data = data[0] || null;
                resolve?.({ data, error: null });
                return { data, error: null };
            },
            async insert(items) {
                const arr = Array.isArray(items) ? items : [items];
                const result = await self._fetch('/' + table, {
                    method: 'POST',
                    body: JSON.stringify(arr[0]),
                });
                if (result.error) return { data: null, error: result.error };
                const data = Array.isArray(result.data) ? result.data : [result.data];
                return { data, error: null };
            },
            async update(values) {
                const qs = _buildQuery();
                if (!qs) return { data: null, error: 'Update requires .eq() filter' };
                const result = await self._fetch('/' + table + qs, {
                    method: 'PATCH',
                    body: JSON.stringify(values),
                });
                if (result.error) return { data: null, error: result.error };
                return { data: result.data, error: null };
            },
            async delete() {
                const qs = _buildQuery();
                if (!qs) return { data: null, error: 'Delete requires .eq() filter' };
                const result = await self._fetch('/' + table + qs, { method: 'DELETE' });
                if (result.error) return { data: null, error: result.error };
                return { data: result.data || null, error: null };
            },
            async upsert(items) {
                const arr = Array.isArray(items) ? items : [items];
                const result = await self._fetch('/' + table + '?on_conflict=id', {
                    method: 'POST',
                    body: JSON.stringify(arr[0]),
                    headers: { 'Prefer': 'resolution=merge-duplicates' },
                });
                if (result.error) return { data: null, error: result.error };
                return { data: result.data, error: null };
            },
        };
    },

    // RPC call — POST /rpc/function_name with params
    async rpc(name, params = {}) {
        return this._fetch('/rpc/' + name, {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('PG API (PostgREST) config loaded. Server:', window.PG_CONFIG.apiUrl);
});
