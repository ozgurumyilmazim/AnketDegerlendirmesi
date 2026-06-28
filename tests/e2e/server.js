import http from 'http';
import { spawn } from 'child_process';
import { existsSync, copyFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3099;
const FRONTEND_DIR = join(__dirname, '..', '..', 'frontend');
const REPORTS_DIR = join(__dirname, 'reports');

let testRunning = false;
let testOutput = [];

function runTest() {
  if (testRunning) return false;
  testRunning = true;
  testOutput = [];
  const proc = spawn('node', ['node_modules/@playwright/test/cli.js', 'test', '--project=chromium'], {
    cwd: __dirname, shell: true, stdio: ['pipe', 'pipe', 'pipe']
  });
  proc.stdout.on('data', d => { testOutput.push(d.toString()); });
  proc.stderr.on('data', d => { testOutput.push(d.toString()); });
  proc.on('close', code => {
    testRunning = false;
    const src = join(REPORTS_DIR, 'index.html');
    const dst = join(FRONTEND_DIR, 'test-reports', 'index.html');
    if (existsSync(src)) {
      const dd = dirname(dst);
      if (!existsSync(dd)) mkdirSync(dd, { recursive: true });
      copyFileSync(src, dst);
    }
    testOutput.push(`\n--- Test bitti. Çıkış: ${code} ---\n`);
  });
  return true;
}

const html = (msg, running) => `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"><title>E2E Test Runner</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>body{padding-top:2rem}pre{max-height:70vh}</style></head><body>
<div class="container"><h1 class="mb-3">E2E Test Runner</h1>
<div class="d-flex gap-3 mb-3">
  <button class="btn btn-primary btn-lg" id="runBtn" onclick="fetch('/run',{method:'POST'}).then(r=>r.json()).then(r=>{if(r.error)alert(r.error);else{running=true;poll();}})">▶ Testi Başlat</button>
  <a class="btn btn-outline-success btn-lg" href="/test-reports/" target="_blank">📊 Rapor</a>
</div>
<div id="status" class="alert alert-info">${msg}</div>
<pre id="output" class="bg-dark text-light p-3 rounded" style="font-size:13px;">${testOutput.join('')}</pre>
</div>
<script>
let running=${running};
function poll(){setInterval(async()=>{const r=await fetch('/status').then(r=>r.json());document.getElementById('output').textContent=r.output;if(!r.running&&running){running=false;document.getElementById('status').className='alert alert-success';document.getElementById('status').textContent='Test tamamlandı!';document.getElementById('runBtn').disabled=false;}else if(r.running){document.getElementById('status').className='alert alert-warning';document.getElementById('status').textContent='Test çalışıyor...';document.getElementById('runBtn').disabled=true;running=true;}},1000);}
${testRunning ? 'running=true;setTimeout(poll,500);' : ''}
document.getElementById('runBtn').disabled=${testRunning};
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/run' && req.method === 'POST') {
    const ok = runTest();
    res.writeHead(ok ? 200 : 409, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(ok ? { status: 'started' } : { error: 'Test zaten çalışıyor' }));
    return;
  }
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ running: testRunning, output: testOutput.join('') }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html(testRunning ? 'Test çalışıyor...' : 'Hazır', testRunning));
});

server.listen(PORT, () => {
  console.log(`Test Runner: http://0.0.0.0:${PORT}`);
});
