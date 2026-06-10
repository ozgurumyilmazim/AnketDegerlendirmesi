const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = auth.generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({
      user: safeUser,
      session: { access_token: token, user: safeUser },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', auth.authenticate, async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/session', auth.authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ==================== PARTICIPANTS ====================

app.get('/api/participants', auth.authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM participants ORDER BY created_at DESC'
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/participants/tc/:tcno', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM participants WHERE tc_no = $1',
      [req.params.tcno]
    );
    res.json({ data: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/participants', async (req, res) => {
  try {
    const { first_name, last_name, tc_no, gender, age, institution_code, institution_name, profession, education, marital_status } = req.body;
    const { rows } = await db.query(
      `INSERT INTO participants (first_name, last_name, tc_no, gender, age, institution_code, institution_name, profession, education, marital_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [first_name, last_name, tc_no, gender, age, institution_code, institution_name, profession, education, marital_status]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/participants/:id', async (req, res) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(req.body)) {
      if (['first_name','last_name','tc_no','gender','age','institution_code','institution_name','profession','education','marital_status'].includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }
    values.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE participants SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== TEST RESULTS ====================

app.get('/api/test-results', auth.authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM test_results ORDER BY created_at DESC'
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test-results/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM test_results WHERE id = $1', [req.params.id]);
    res.json({ data: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/test-results', async (req, res) => {
  try {
    const { participant_id, participant_info, test_answers, start_time, end_time, dont_know_count, completed_questions, total_questions, test_type, test_version, status } = req.body;
    const { rows } = await db.query(
      `INSERT INTO test_results (participant_id, participant_info, test_answers, start_time, end_time, dont_know_count, completed_questions, total_questions, test_type, test_version, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [participant_id, JSON.stringify(participant_info || {}), JSON.stringify(test_answers || {}), start_time, end_time, dont_know_count, completed_questions, total_questions, test_type, test_version, status]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/test-results/:id', async (req, res) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(req.body)) {
      if (['participant_info','test_answers','end_time','dont_know_count','completed_questions','status'].includes(key)) {
        const val = (key === 'participant_info' || key === 'test_answers') ? JSON.stringify(value) : value;
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
    }
    if (fields.length === 0) return res.json({ data: null });
    values.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE test_results SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== QUESTIONS ====================

app.get('/api/questions', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM questions ORDER BY question_number'
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== REPORTS ====================

app.get('/api/reports', auth.authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM reports ORDER BY created_at DESC'
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', auth.authenticate, async (req, res) => {
  try {
    const { test_result_id, participant_id, report_content, report_type, generated_by } = req.body;
    const { rows } = await db.query(
      `INSERT INTO reports (test_result_id, participant_id, report_content, report_type, generated_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [test_result_id, participant_id, JSON.stringify(report_content || {}), report_type, generated_by]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reports/:id', auth.authenticate, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
    res.json({ deleted: rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== SCORING KEYS ====================

app.get('/api/scoring-keys', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM scoring_keys ORDER BY scale_name, question_number');
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== T-SCORE NORMS ====================

app.get('/api/t-score-norms', async (req, res) => {
  try {
    const { scale_name, gender } = req.query;
    let query = 'SELECT * FROM t_score_norms WHERE 1=1';
    const params = [];
    if (scale_name) { params.push(scale_name); query += ` AND scale_name = $${params.length}`; }
    if (gender) { params.push(gender); query += ` AND gender = $${params.length}`; }
    query += ' ORDER BY scale_name, gender, raw_score';
    const { rows } = await db.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== T-SCORE PARAMS ====================

app.get('/api/t-score-params', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM t_score_params');
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== MMPI INTERPRETATIONS ====================

app.get('/api/interpretations', async (req, res) => {
  try {
    const { scale_name, gender } = req.query;
    let query = 'SELECT * FROM mmpi_interpretations WHERE 1=1';
    const params = [];
    if (scale_name) { params.push(scale_name); query += ` AND scale_name = $${params.length}`; }
    if (gender) { params.push(gender); query += ` AND (gender = $${params.length} OR gender IS NULL)`; }
    else { query += ' AND gender IS NULL'; }
    query += ' ORDER BY scale_name, min_t_score';
    const { rows } = await db.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== KVKK ====================

app.get('/api/kvkk', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM kvkk ORDER BY id');
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/kvkk/:id', auth.authenticate, async (req, res) => {
  try {
    const { kvkk_title, kvkk_text, kvkk_required } = req.body;
    const { rows } = await db.query(
      `UPDATE kvkk SET kvkk_title = $1, kvkk_text = $2, kvkk_required = $3 WHERE id = $4 RETURNING *`,
      [kvkk_title, kvkk_text, kvkk_required, req.params.id]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== PAGE CONTENT ====================

app.get('/api/page-content/:key', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM page_content WHERE page_key = $1', [req.params.key]);
    res.json({ data: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/page-content/:key', auth.authenticate, async (req, res) => {
  try {
    const { page_title, page_subtitle, page_body } = req.body;
    const { rows } = await db.query(
      `UPDATE page_content SET page_title = $1, page_subtitle = $2, page_body = $3 WHERE page_key = $4 RETURNING *`,
      [page_title, page_subtitle, page_body, req.params.key]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== TASK DEFINITIONS ====================

app.get('/api/task-definitions', auth.authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM task_definitions ORDER BY created_at DESC');
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/task-definitions', auth.authenticate, async (req, res) => {
  try {
    const { title, description, category, assigned_to, status, due_date } = req.body;
    const { rows } = await db.query(
      `INSERT INTO task_definitions (title, description, category, assigned_to, status, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, category, assigned_to, status || 'pending', due_date, req.user.email]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/task-definitions/:id', auth.authenticate, async (req, res) => {
  try {
    const { title, description, category, assigned_to, status, due_date } = req.body;
    const { rows } = await db.query(
      `UPDATE task_definitions SET title = COALESCE($1, title), description = COALESCE($2, description),
       category = COALESCE($3, category), assigned_to = COALESCE($4, assigned_to),
       status = COALESCE($5, status), due_date = COALESCE($6, due_date)
       WHERE id = $7 RETURNING *`,
      [title, description, category, assigned_to, status, due_date, req.params.id]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/task-definitions/:id', auth.authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM task_definitions WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== USERS (ADMIN) ====================

app.get('/api/users', auth.authenticate, auth.requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, role, name, is_active, last_login, created_at FROM users ORDER BY created_at'
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== ANALYTICS ====================

app.get('/api/analytics/stats', auth.authenticate, async (req, res) => {
  try {
    const [participants, tests, reports] = await Promise.all([
      db.query('SELECT COUNT(*)::int as count FROM participants'),
      db.query('SELECT COUNT(*)::int as count FROM test_results'),
      db.query('SELECT COUNT(*)::int as count FROM reports'),
    ]);

    const { rows: recentTests } = await db.query(
      `SELECT tr.*, p.first_name, p.last_name
       FROM test_results tr
       LEFT JOIN participants p ON tr.participant_id = p.id
       ORDER BY tr.created_at DESC LIMIT 10`
    );

    res.json({
      participants: participants.rows[0].count,
      tests: tests.rows[0].count,
      reports: reports.rows[0].count,
      recentTests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== SETTINGS ====================

app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json({ data: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== SEARCH / JOINED QUERIES ====================

app.get('/api/test-results/with-participants', auth.authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT tr.*, p.first_name, p.last_name, p.tc_no, p.gender, p.age
       FROM test_results tr
       LEFT JOIN participants p ON tr.participant_id = p.id
       ORDER BY tr.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ==================== START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MMPI API server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
