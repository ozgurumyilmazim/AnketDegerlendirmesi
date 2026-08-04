import http from 'http';
import { spawn, execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.SETUP_PORT || 3098;
const DB_DIR = __dirname;
const PROJECT_DIR = join(__dirname, '..');

// DB Container & Credential Defaults
const DB_CONTAINER = process.env.DB_CONTAINER || 'selma_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_NAME = process.env.DB_NAME || 'mydatabase';
const DB_URI = process.env.PGRST_DB_URI; // from docker-compose env

let isExecuting = false;
let executionLogs = [];

/**
 * Execute psql command via docker exec (or fallback to local psql)
 */
function runPsqlCommand(sqlOrFilePath, isFile = false) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    let useDocker = false;
    try {
      const inspect = execSync(`docker inspect -f "{{.State.Running}}" ${DB_CONTAINER}`, { stdio: 'pipe' }).toString().trim();
      if (inspect === 'true') {
        useDocker = true;
      }
    } catch (e) {
      useDocker = false;
    }

    let proc;
    // If a DB connection URI is provided, always use the local psql client (no Docker exec)
    if (DB_URI) {
      if (isFile) {
        proc = spawn('psql', ['-d', DB_URI], { shell: true });
      } else {
        proc = spawn('psql', ['-d', DB_URI, '-c', sqlOrFilePath], { shell: true });
      }
    } else if (useDocker) {
      // Existing Docker exec path using explicit credentials
      if (isFile) {
        proc = spawn('docker', ['exec', '-i', DB_CONTAINER, 'psql', '-U', DB_USER, '-d', DB_NAME], { shell: true });
      } else {
        proc = spawn('docker', ['exec', DB_CONTAINER, 'psql', '-U', DB_USER, '-d', DB_NAME, '-c', sqlOrFilePath], { shell: true });
      }
    } else {
      // Local fallback with explicit credentials
      if (isFile) {
        proc = spawn('psql', ['-U', DB_USER, '-d', DB_NAME, '-f', sqlOrFilePath], { shell: true });
      } else {
        proc = spawn('psql', ['-U', DB_USER, '-d', DB_NAME, '-c', sqlOrFilePath], { shell: true });
      }
    }

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    if (isFile && useDocker) {
      try {
        const fileContent = readFileSync(sqlOrFilePath, 'utf8');
        proc.stdin.write(fileContent);
        proc.stdin.end();
      } catch (err) {
        return resolve({
          success: false,
          code: 1,
          stdout: '',
          stderr: `File read error: ${err.message}`,
          durationMs: Date.now() - startTime
        });
      }
    }

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        code,
        stdout,
        stderr,
        durationMs: Date.now() - startTime
      });
    });

    proc.on('error', (err) => {
      resolve({
        success: false,
        code: 1,
        stdout: '',
        stderr: err.message,
        durationMs: Date.now() - startTime
      });
    });
  });
}

/**
 * Get ordered list of SQL scripts in database/ directory (01_*.sql to 09_*.sql)
 */
function getDatabaseScripts() {
  if (!existsSync(DB_DIR)) return [];
  const files = readdirSync(DB_DIR);
  return files
    .filter(f => f.endsWith('.sql') && /^\d{2}_/.test(f))
    .sort((a, b) => a.localeCompare(b))
    .map(f => ({
      fileName: f,
      filePath: join(DB_DIR, f)
    }));
}

/**
 * Check mandatory pgcrypto extension
 */
async function checkPgCrypto() {
  const res = await runPsqlCommand("SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';");
  const installed = res.stdout.includes('pgcrypto');
  return {
    installed,
    rawOutput: res.stdout,
    error: res.stderr
  };
}

/**
 * Check if initial setup was already completed
 */
async function checkInitStatus() {
  const res = await runPsqlCommand("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_init';");
  const hasInitTable = res.stdout.includes('1');
  if (!hasInitTable) {
    const tablesRes = await runPsqlCommand("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';");
    const match = tablesRes.stdout.match(/\b(\d+)\b/);
    const count = match ? parseInt(match[1], 10) : 0;
    return {
      initialized: count >= 5,
      initializedAt: null,
      tableCount: count
    };
  }

  const detailRes = await runPsqlCommand("SELECT initialized_at, status FROM system_init ORDER BY id DESC LIMIT 1;");
  return {
    initialized: true,
    initializedAt: detailRes.stdout.trim(),
    tableCount: 14
  };
}

/**
 * Execute root database scripts in sequential order
 */
async function executeScripts() {
  if (isExecuting) return { error: 'Initialization is already in progress' };
  isExecuting = true;
  executionLogs = [];

  const scripts = getDatabaseScripts();
  let overallSuccess = true;
  const results = [];

  for (const script of scripts) {
    const logItem = {
      fileName: script.fileName,
      status: 'running',
      stdout: '',
      stderr: '',
      durationMs: 0
    };
    executionLogs.push(logItem);

    const res = await runPsqlCommand(script.filePath, true);
    logItem.stdout = res.stdout;
    logItem.stderr = res.stderr;
    logItem.durationMs = res.durationMs;
    logItem.status = res.success ? 'success' : 'failed';

    results.push(logItem);

    if (!res.success) {
      overallSuccess = false;
      break;
    }
  }

  if (overallSuccess) {
    await runPsqlCommand(`
      CREATE TABLE IF NOT EXISTS system_init (
        id SERIAL PRIMARY KEY,
        initialized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'completed'
      );
      INSERT INTO system_init (status) VALUES ('completed');
    `);
  }

  isExecuting = false;
  return {
    success: overallSuccess,
    results
  };
}

/**
 * Reset system / drop all public schema tables
 */
async function resetDatabase() {
  if (isExecuting) return { error: 'Execution in progress' };
  
  const sql = `
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO public;
    GRANT ALL ON SCHEMA public TO ${DB_USER};
  `;

  const res = await runPsqlCommand(sql);
  return {
    success: res.success,
    stdout: res.stdout,
    stderr: res.stderr,
    durationMs: res.durationMs
  };
}

// HTTP API Server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.replace('/setup-api', '');

  // Status check endpoint
  if (url === '/status' || url === '/') {
    const scripts = getDatabaseScripts();
    const pgCrypto = await checkPgCrypto();
    const initStatus = await checkInitStatus();

    const jsLibs = [
      'assets/js/test-config.js',
      'assets/js/mmpi-scoring.js',
      'assets/js/pg-config.js'
    ].map(rel => ({
      file: rel,
      exists: existsSync(join(PROJECT_DIR, 'frontend', rel))
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      isExecuting,
      scripts: scripts.map(s => s.fileName),
      pgCrypto,
      initStatus,
      jsLibs
    }));
    return;
  }

  // Execute scripts endpoint
  if (url === '/execute' && req.method === 'POST') {
    const result = await executeScripts();
    res.writeHead(result.error ? 400 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // Reset database / drop tables endpoint
  if (url === '/reset' && req.method === 'POST') {
    const result = await resetDatabase();
    res.writeHead(result.error ? 400 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Database Setup Runner listening on http://0.0.0.0:${PORT}`);
});
