#!/usr/bin/env bash
set -e

# ====== 配置 ======
REGISTRY="${REGISTRY:?错误: 请设置 REGISTRY 环境变量
示例: REGISTRY=crpi-xxx.cn-shenzhen.personal.cr.aliyuncs.com/wzw9807 ./deploy.sh
或在 .env 文件中配置}"

SERVER_IP="${SERVER_IP:?错误: 请设置 SERVER_IP 环境变量
示例: SERVER_IP=1.2.3.4 ./deploy.sh
或在 .env 文件中配置}"

SERVER_USER="${SERVER_USER:-root}"

echo "========================================"
echo "        ONW 自动部署脚本"
echo "========================================"
echo "镜像仓库: ${REGISTRY}"
echo "服务器:   ${SERVER_USER}@${SERVER_IP}"
echo "========================================"
echo ""

# ====== 1. 本地构建并推送 ======
echo "🏗️  [1/4] 本地构建 Docker 镜像..."

ACR_REGISTRY="${REGISTRY}" docker compose build --no-cache
ACR_REGISTRY="${REGISTRY}" docker compose push

echo "✅ 构建并推送完成"
echo ""

# ====== 2. 上传配置文件到服务器 ======
echo "📦 [2/4] 上传配置文件..."

scp docker-compose.yml nginx.conf "${SERVER_USER}@${SERVER_IP}:/opt/onw/"

echo "  ✓ docker-compose.yml"
echo "  ✓ nginx.conf"
echo ""

# ====== 3. 写入服务器 .env ======
echo "📝 [3/4] 写入服务器环境变量..."

ssh "${SERVER_USER}@${SERVER_IP}" << ENDSSH
cat > /opt/onw/.env << 'EOF'
ACR_REGISTRY=${REGISTRY}
EOF
ENDSSH

echo "  ✓ /opt/onw/.env"
echo ""

# ====== 4. 部署 ======
echo "🚀 [4/4] 部署到服务器..."

ssh "${SERVER_USER}@${SERVER_IP}" << 'ENDSSH'
set -e
cd /opt/onw
echo "  → 拉取最新镜像..."
docker compose pull
echo "  → 重启服务..."
docker compose up -d
echo "  → 清理旧镜像..."
docker image prune -f
ENDSSH

echo ""
echo "========================================"
echo "✅ 部署成功！"
echo "========================================"
echo "访问地址: http://${SERVER_IP}"
echo ""
echo "查看日志:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'cd /opt/onw && docker compose logs -f'"
echo ""
echo "服务状态:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'cd /opt/onw && docker compose ps'"
echo "========================================"
