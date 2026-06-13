#!/usr/bin/env bash
# ============================================================
# Sistem Durumu Kontrol Betiği — MMPI Test Sistemi
# Kullanım: bash tests/status.sh
#           bash tests/status.sh --quiet   (sadece özet)
#           bash tests/status.sh --json    (JSON çıktı)
# ============================================================

set -uo pipefail

# ---- Renkler ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ---- Konfigürasyon (dışarı aktarılır) ----
export WEB_URL="https://selma.ozguryilmaz.com.tr"
export API_URL="${API_URL:-https://selma.ozguryilmaz.com.tr/api}"
export PG_DB="mmpi_db"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Container adları (docker ps'den otomatik bul)
export PG_CT="$(docker ps --format '{{.Names}}' | grep -i '^postgres$' | head -1)"
export PGREST_CT="$(docker ps --format '{{.Names}}' | grep -i '^postgrest$' | head -1)"
export WEB_CT="$(docker ps --format '{{.Names}}' | grep -i '^webserver$' | head -1)"

# PostgreSQL superuser (container env'den oku)
export PG_SUPERUSER="$(docker inspect "$PG_CT" 2>/dev/null | python3 -c "
import json,sys
try:
    env = json.load(sys.stdin)[0]['Config']['Env']
    for e in env:
        if e.startswith('POSTGRES_USER='):
            print(e.split('=',1)[1])
except: pass
" 2>/dev/null)"
export PG_SUPERUSER="${PG_SUPERUSER:-postgres}"

QUIET=false
JSON=false
PASS=0
FAIL=0
SKIP=0
TOTAL=0
RESULTS=()

# ---- Argümanlar ----
for arg in "$@"; do
    case "$arg" in
        --quiet) QUIET=true ;;
        --json)  JSON=true ;;
    esac
done

# ---- Yardımcılar ----
log()     { [[ "$QUIET" != true ]] && echo -e "$*"; }
pass()    { PASS=$((PASS+1)); RESULTS+=("pass:$*"); log "  ${GREEN}[PASS]${NC} $*"; }
fail()    { FAIL=$((FAIL+1)); RESULTS+=("fail:$*"); log "  ${RED}[FAIL]${NC} $*"; }
skip()    { SKIP=$((SKIP+1)); RESULTS+=("skip:$*"); log "  ${YELLOW}[SKIP]${NC} $*"; }
bold()    { log "${BOLD}$*${NC}"; }
detail()  { [[ "$QUIET" != true ]] && echo -e "    ${CYAN}$*${NC}"; }

exec_sql() {
    docker exec "$PG_CT" psql -U "$PG_SUPERUSER" -h localhost -d "$PG_DB" -tA "$@"
}

check() {
    TOTAL=$((TOTAL+1))
    local n="$1"; shift
    local label="$1"; shift
    local desc="$1"; shift
    bold " ${CYAN}#$n${NC} ${label}"
    detail "$desc"
}

check_result() {
    local result="$1"; shift
    local label="$1"; shift
    if [[ "$result" == 0 ]]; then
        pass "$label"
    else
        fail "$label"
    fi
}

run() {
    "$@" > /dev/null 2>&1
}

# ================================================================
echo " ${CYAN}[INFO]${NC} PostgreSQL superuser: $PG_SUPERUSER"
echo " ${CYAN}[INFO]${NC} Containerlar: PG=$PG_CT / REST=$PGREST_CT / WEB=$WEB_CT"
echo ""

# ================================================================
# 1 — Web Sunucu (Nginx / Cloudflare)
# ================================================================
check  1 "Web Sunucu (Nginx / Cloudflare)" "Ana sayfaya HTTP HEAD"
run curl -sfI --max-time 10 "$WEB_URL" -o /dev/null
check_result $? "Web Sunucu"

# ================================================================
# 2 — PostgreSQL
# ================================================================
check  2 "PostgreSQL Çalışıyor" "Container içinde SELECT 1"
run exec_sql -c "SELECT 1"
check_result $? "PostgreSQL"

# ================================================================
# 3 — JavaScript Kütüphaneleri
# ================================================================
check  3 "JS Kütüphaneleri" "Proje dizininde gerekli .js dosyaları"
JS_OK=0
for f in \
    assets/js/test-config.js \
    assets/js/mmpi-scoring.js \
    assets/js/pg-config.js \
    assets/js/supabase-config.js; do
    [[ -f "$PROJECT_DIR/$f" ]] || { JS_OK=1; detail "  Eksik: $f"; }
done
check_result $JS_OK "JS Kütüphaneleri"

# ================================================================
# 4 — PostgREST (localhost)
# ================================================================
check  4 "PostgREST (localhost:3000)" "Anonim erişim devre dışı (PGRST302) → sunucu çalışıyor"
RES=$(curl -s localhost:3000/questions?limit=1 -H "Accept: application/json" 2>&1)
echo "$RES" | grep -q "PGRST302"
check_result $? "PostgREST (localhost)"

# PostgREST imzası: PGRST302 + www-authenticate header
# ================================================================
# 5 — PostgREST İmzası
# ================================================================
check  5 "PostgREST İmzası" "Sunucu yanıtında PGRST302 + Bearer header"
HEADERS=$(curl -sI localhost:3000/questions?limit=1 2>&1)
BODY=$(curl -s localhost:3000/questions?limit=1 -H "Accept: application/json" 2>&1)
echo "$BODY" | grep -q "PGRST302" && echo "$HEADERS" | grep -qi "www-authenticate.*Bearer"
check_result $? "PostgREST İmzası"
detail "  code=PGRST302 + www-authenticate: Bearer → PostgREST onaylandı"

# ================================================================
# 6 — PostgREST (public URL)
# ================================================================
check  6 "PostgREST (public API)" "Cloudflare tunnel üzerinden $API_URL"
RES=$(curl -s --max-time 10 "$API_URL/questions?limit=1" -H "Accept: application/json" 2>&1)
echo "$RES" | grep -q "PGRST302"
check_result $? "PostgREST (public)"

# ================================================================
# 7 — PostgreSQL Tabloları
# ================================================================
check  7 "PostgreSQL Tabloları (14)" "Beklenen tablolar public schema'da"
COUNT=$(exec_sql -c "
    SELECT count(*) FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'users','participants','test_results','questions',
        'reports','scoring_keys','t_score_norms','t_score_params',
        'mmpi_interpretations','page_content','kvkk','task_definitions',
        'settings','sessions'
    )" 2>/dev/null)
[[ "$COUNT" -ge 14 ]] 2>/dev/null
check_result $? "PostgreSQL Tabloları"
detail "  Mevcut tablo sayısı: $COUNT"

# ================================================================
# 8 — Soru Sayısı
# ================================================================
check  8 "Soru Sayısı (567)" "questions tablosundaki kayıt sayısı"
COUNT=$(exec_sql -c "SELECT count(*) FROM questions" 2>/dev/null)
[[ "$COUNT" -ge 1 ]] 2>/dev/null
check_result $? "Soru Sayısı"
detail "  questions tablosu: $COUNT kayıt"

# ================================================================
# 9 — Kullanıcılar
# ================================================================
check  9 "Kullanıcılar" "users tablosunda kayıt var"
COUNT=$(exec_sql -c "SELECT count(*) FROM users" 2>/dev/null)
[[ "$COUNT" -ge 1 ]] 2>/dev/null
check_result $? "Kullanıcılar"
detail "  users tablosu: $COUNT kayıt"

# ================================================================
# 10 — Auth /rpc/login
# ================================================================
check 10 "Auth /rpc/login" "Yanlış şifreyle hata dönmeli"
RES=$(curl -s --max-time 10 "$API_URL/rpc/login" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.test","password":"wrong"}' 2>&1)
echo "$RES" | grep -qi "Invalid email or password"
check_result $? "Auth /rpc/login"
detail "  Yanıt: $RES"

# ================================================================
# 11 — PostgreSQL Sürümü
# ================================================================
check 11 "PostgreSQL Sürümü" "PostgreSQL versiyon bilgisi"
VER=$(exec_sql -c "SELECT version()" 2>/dev/null)
echo "$VER" | grep -q PostgreSQL
check_result $? "PostgreSQL Sürümü"
detail "  $VER"

# ================================================================
# 12 — DNS Çözümleme
# ================================================================
check 12 "DNS (selma.ozguryilmaz.com.tr)" "Domain çözümleniyor"
run host "selma.ozguryilmaz.com.tr" || run nslookup "selma.ozguryilmaz.com.tr"
check_result $? "DNS (ana domain)"

# ================================================================
# 13 — Docker Container'lar
# ================================================================
check 13 "Docker Container'lar" "postgres + postgrest + webServer ayakta"
CT_OK=0
for c in "$PG_CT" "$PGREST_CT" "$WEB_CT"; do
    if [[ -z "$c" ]]; then
        detail "  Eksik container (boş ad)"
        CT_OK=1
    elif docker ps --format '{{.Names}}' | grep -qw "$c"; then
        detail "  ✓ $c"
    else
        detail "  ✗ $c (çalışmıyor)"
        CT_OK=1
    fi
done
check_result $CT_OK "Docker Container'lar"

# ================================================================
# 14 — Disk Kullanımı
# ================================================================
check 14 "Disk Kullanımı" "Kök disk %90 altında"
PCT=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
[[ "$PCT" -lt 90 ]]
check_result $? "Disk Kullanımı"
detail "  Kullanım: %$PCT"

# ================================================================
# 15 — postgrest.conf JWT Secret Tutarlılığı
# ================================================================
check 15 "postgrest.conf JWT Secret" "jwt-secret ile db-pre-request aynı"
CFG="$PROJECT_DIR/postgrest.conf"
if [[ -f "$CFG" ]]; then
    SECRET=$(grep "^jwt-secret" "$CFG" | head -1 | cut -d= -f2- | tr -d ' "')
    PRE=$(grep "^db-pre-request" "$CFG" | head -1 | grep -o "'[^']*'" | tr -d "'")
    [[ "$SECRET" = "$PRE" ]]
    check_result $? "JWT Secret"
    detail "  jwt-secret: ${SECRET:0:20}..."
    detail "  db-pre-request: ${PRE:0:20}..."
else
    skip "postgrest.conf bulunamadı ($CFG)"
fi

# ================================================================
# 16 — HTTP -> HTTPS Yönlendirme
# ================================================================
check 16 "HTTP -> HTTPS Yönlendirme" "HTTP 80 -> 443 redirect"
run curl -sI "http://selma.ozguryilmaz.com.tr" 2>&1 | grep -qi "301\|302\|Location.*https"
check_result $? "HTTP Yönlendirme"

# ================================================================
# ÖZET
# ================================================================
echo ""
echo "═══════════════════════════════════════"
echo "  ÖZET"
echo "═══════════════════════════════════════"
echo "  Toplam  : $TOTAL"
echo -e "  ${GREEN}Başarılı${NC} : $PASS"
echo -e "  ${RED}Başarısız${NC}: $FAIL"
echo -e "  ${YELLOW}Atlama${NC}   : $SKIP"
echo "═══════════════════════════════════════"

if [[ "$FAIL" -gt 0 ]]; then
    echo ""
    echo -e "${BOLD}Başarısız testler:${NC}"
    for r in "${RESULTS[@]}"; do
        case "$r" in
            fail:*) echo "  ${RED}✗${NC} ${r#fail:}" ;;
        esac
    done
fi

if [[ "$JSON" == true ]]; then
    echo ""
    echo '{'
    echo "  \"total\": $TOTAL,"
    echo "  \"passed\": $PASS,"
    echo "  \"failed\": $FAIL,"
    echo "  \"skipped\": $SKIP,"
    echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\""
    echo '}'
fi

[[ "$FAIL" -eq 0 ]]
