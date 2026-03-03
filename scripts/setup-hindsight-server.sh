#!/bin/bash
# =============================================================================
# ATUM Shared Memory — Hindsight Server Setup
# Run this script on an Oracle Cloud ARM A1 (Ubuntu 22.04+) instance via SSH.
#
# Prerequisites:
#   - Oracle Cloud ARM A1 instance (Always Free Tier)
#   - Ubuntu 22.04+ (aarch64)
#   - SSH access with sudo
#   - Groq API key (free: https://console.groq.com)
#   - A domain pointing to this VM's public IP (or use IP directly)
#
# Usage:
#   chmod +x setup-hindsight-server.sh
#   ./setup-hindsight-server.sh
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
fail()  { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

# =============================================================================
# 1. COLLECT CONFIGURATION
# =============================================================================
echo ""
echo "==========================================="
echo "  ATUM Hindsight Memory Server Setup"
echo "==========================================="
echo ""

# Groq API key
read -rp "Groq API key (gsk_...): " GROQ_API_KEY
[ -z "$GROQ_API_KEY" ] && fail "Groq API key is required"

# Generate secure auth token for Hindsight
HINDSIGHT_AUTH_TOKEN=$(openssl rand -hex 32)
info "Generated Hindsight auth token: $HINDSIGHT_AUTH_TOKEN"
echo ""
echo "  SAVE THIS TOKEN — you'll need it for Claude Code config:"
echo "  $HINDSIGHT_AUTH_TOKEN"
echo ""
read -rp "Press Enter to continue..."

# =============================================================================
# 2. INSTALL DOCKER
# =============================================================================
info "Installing Docker..."

if command -v docker &>/dev/null; then
    ok "Docker already installed: $(docker --version)"
else
    sudo apt-get update -qq
    sudo apt-get install -y -qq ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker "$USER"
    ok "Docker installed"
fi

# =============================================================================
# 3. CREATE DATA DIRECTORY
# =============================================================================
info "Creating data directory..."
sudo mkdir -p /opt/hindsight/data
sudo chown "$USER:$USER" /opt/hindsight/data
ok "Data directory: /opt/hindsight/data"

# =============================================================================
# 4. WRITE DOCKER COMPOSE FILE
# =============================================================================
info "Writing docker-compose.yml..."

cat > /opt/hindsight/docker-compose.yml << 'COMPOSE'
services:
  hindsight:
    image: ghcr.io/vectorize-io/hindsight:latest-slim
    container_name: hindsight-api
    restart: unless-stopped
    ports:
      - "8888:8888"
      - "9999:9999"
    environment:
      # LLM — Groq (free tier)
      - HINDSIGHT_API_LLM_PROVIDER=groq
      - HINDSIGHT_API_LLM_API_KEY=${GROQ_API_KEY}
      # Embeddings — OpenAI compatible via Groq (or use local in full image)
      - HINDSIGHT_API_EMBEDDINGS_PROVIDER=openai
      - HINDSIGHT_API_EMBEDDINGS_OPENAI_API_KEY=${GROQ_API_KEY}
      - HINDSIGHT_API_EMBEDDINGS_OPENAI_BASE_URL=https://api.groq.com/openai/v1
      - HINDSIGHT_API_EMBEDDINGS_OPENAI_MODEL=llama-3.3-70b-versatile
      # Server
      - HINDSIGHT_API_HOST=0.0.0.0
      - HINDSIGHT_API_PORT=8888
      - HINDSIGHT_API_LOG_LEVEL=info
      # Authentication
      - HINDSIGHT_API_TENANT_EXTENSION=hindsight_api.extensions.builtin.tenant:ApiKeyTenantExtension
      - HINDSIGHT_API_TENANT_API_KEY=${HINDSIGHT_AUTH_TOKEN}
      # MCP
      - HINDSIGHT_API_MCP_ENABLED=true
      # Retain config
      - HINDSIGHT_API_RETAIN_EXTRACTION_MODE=concise
      - HINDSIGHT_API_RETAIN_EXTRACT_CAUSAL_LINKS=true
      # Reranker — FlashRank (local, no API needed)
      - HINDSIGHT_API_RERANKER_PROVIDER=flashrank
    volumes:
      - /opt/hindsight/data:/home/hindsight/.pg0
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8888/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
COMPOSE

ok "docker-compose.yml written"

# =============================================================================
# 5. WRITE .env FILE
# =============================================================================
cat > /opt/hindsight/.env << ENV
GROQ_API_KEY=${GROQ_API_KEY}
HINDSIGHT_AUTH_TOKEN=${HINDSIGHT_AUTH_TOKEN}
ENV

chmod 600 /opt/hindsight/.env
ok ".env file written (permissions 600)"

# =============================================================================
# 6. INSTALL CADDY (REVERSE PROXY + AUTO HTTPS)
# =============================================================================
info "Installing Caddy for automatic HTTPS..."

if command -v caddy &>/dev/null; then
    ok "Caddy already installed"
else
    sudo apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt-get update -qq
    sudo apt-get install -y -qq caddy
    ok "Caddy installed"
fi

# =============================================================================
# 7. CONFIGURE CADDY
# =============================================================================
info "Configuring Caddy..."

# Ask for domain or IP
echo ""
echo "  How will you access this server?"
echo "    1) Custom domain (e.g., memory.atum.tech)"
echo "    2) IP address only (no HTTPS — for testing)"
echo ""
read -rp "  Choice [1-2]: " access_choice

case "$access_choice" in
    1)
        read -rp "  Domain name: " DOMAIN
        cat > /opt/hindsight/Caddyfile << CADDY
${DOMAIN} {
    reverse_proxy localhost:8888
}
CADDY
        ;;
    2)
        PUBLIC_IP=$(curl -s ifconfig.me)
        DOMAIN="$PUBLIC_IP"
        cat > /opt/hindsight/Caddyfile << CADDY
:443 {
    reverse_proxy localhost:8888
    tls internal
}

:80 {
    reverse_proxy localhost:8888
}
CADDY
        ;;
    *)
        fail "Invalid choice"
        ;;
esac

sudo cp /opt/hindsight/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
ok "Caddy configured for: $DOMAIN"

# =============================================================================
# 8. CONFIGURE FIREWALL
# =============================================================================
info "Configuring firewall..."

# Oracle Cloud uses iptables by default on Ubuntu
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 8888 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 9999 -j ACCEPT 2>/dev/null || true

# Persist iptables rules
sudo sh -c 'iptables-save > /etc/iptables/rules.v4' 2>/dev/null || true
ok "Firewall ports opened: 80, 443, 8888, 9999"

echo ""
echo "  IMPORTANT: You must also open ports 80 and 443 in Oracle Cloud"
echo "  Console > Networking > Virtual Cloud Networks > Security Lists"
echo ""

# =============================================================================
# 9. START HINDSIGHT
# =============================================================================
info "Starting Hindsight..."

cd /opt/hindsight
sudo docker compose up -d

info "Waiting for Hindsight to start (can take 30-60s for first boot)..."
sleep 15

for i in {1..12}; do
    if curl -sf http://localhost:8888/health > /dev/null 2>&1; then
        ok "Hindsight is running!"
        break
    fi
    if [ "$i" -eq 12 ]; then
        fail "Hindsight failed to start. Check: sudo docker compose logs"
    fi
    info "Waiting... ($i/12)"
    sleep 10
done

# =============================================================================
# 10. CREATE BANKS
# =============================================================================
info "Creating memory banks..."

API="http://localhost:8888"
AUTH="Authorization: Bearer $HINDSIGHT_AUTH_TOKEN"

for bank_id in atum arnaud pablo wahid; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$API/v1/default/banks" \
        -H "$AUTH" \
        -H "Content-Type: application/json" \
        -d "{\"id\": \"$bank_id\", \"name\": \"$bank_id\"}")

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "409" ]; then
        ok "Bank '$bank_id' created"
    else
        info "Bank '$bank_id' response: $HTTP_CODE (may already exist)"
    fi
done

# Configure shared bank mission
curl -s -X PATCH "$API/v1/default/banks/atum/config" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{
        "retain_mission": "Extraire les faits sur ATUM SAS: decisions strategiques, interactions clients, metriques financieres, avancement projets, evenements de gouvernance. Toujours capturer qui, quoi, quand, pourquoi. Langue: francais.",
        "retain_extraction_mode": "concise"
    }' > /dev/null 2>&1

ok "Shared bank 'atum' configured with mission"

# =============================================================================
# 11. CREATE DIRECTIVES
# =============================================================================
info "Creating directives..."

curl -s -X POST "$API/v1/default/banks/atum/directives" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"content": "Les donnees ATUM SAS sont strictement confidentielles. Ne jamais recommander le partage externe de donnees internes."}' > /dev/null 2>&1

curl -s -X POST "$API/v1/default/banks/atum/directives" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"content": "Pour toute donnee personnelle, noter la base legale RGPD (Art. 6). Signaler les depassements de duree de retention selon le registre des traitements."}' > /dev/null 2>&1

curl -s -X POST "$API/v1/default/banks/atum/directives" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"content": "Toujours attribuer les decisions a leur auteur (Arnaud=President/CTO, Pablo=DG/CFO, Wahid=CCO). Referencer les regles de quorum et majorite pour les decisions collectives."}' > /dev/null 2>&1

ok "3 directives created on 'atum' bank"

# =============================================================================
# 12. ENABLE AUTO-START
# =============================================================================
info "Enabling auto-start on boot..."

# Docker containers restart automatically (restart: unless-stopped)
sudo systemctl enable docker
sudo systemctl enable caddy

ok "Docker + Caddy enabled at boot"

# =============================================================================
# DONE
# =============================================================================
echo ""
echo "==========================================="
echo "  ATUM Hindsight Memory Server — READY"
echo "==========================================="
echo ""
echo "  API:          http://localhost:8888"
echo "  Control UI:   http://localhost:9999"
if [ "$access_choice" = "1" ]; then
    echo "  Public URL:   https://$DOMAIN"
    echo "  MCP endpoint: https://$DOMAIN/mcp/atum/"
else
    echo "  Public URL:   http://$DOMAIN:8888"
    echo "  MCP endpoint: http://$DOMAIN:8888/mcp/atum/"
fi
echo ""
echo "  Auth token:   $HINDSIGHT_AUTH_TOKEN"
echo "  Banks:        atum, arnaud, pablo, wahid"
echo ""
echo "  Next steps:"
echo "    1. Open ports 80 + 443 in Oracle Cloud Security List"
echo "    2. Run seed-hindsight.py from your local machine"
echo "    3. Add MCP servers to Claude Code config"
echo ""
echo "  Save this info somewhere safe!"
echo ""
