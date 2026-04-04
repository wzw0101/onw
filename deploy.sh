#!/usr/bin/env bash
set -e

# ====== 配置 ======
# 镜像仓库地址（必填）
# 格式：crpi-xxx.cn-shenzhen.personal.cr.aliyuncs.com/wzw9807
# 或：registry.cn-shenzhen.aliyuncs.com/wzw9807
REGISTRY="${REGISTRY:?错误: 请设置 REGISTRY 环境变量
示例: REGISTRY=crpi-xxx.cn-shenzhen.personal.cr.aliyuncs.com/wzw9807 ./deploy.sh
或在 .env 文件中配置}"

# 服务器 IP 地址（必填）
SERVER_IP="${SERVER_IP:?错误: 请设置 SERVER_IP 环境变量
示例: SERVER_IP=1.2.3.4 ./deploy.sh
或在 .env 文件中配置}"

# 服务器用户名（可选，默认 root）
SERVER_USER="${SERVER_USER:-root}"

# 镜像标签（可选，默认时间戳）
TAG="${TAG:-$(date +%Y%m%d%H%M)}"

# 镜像名称
BACKEND_IMAGE="${REGISTRY}/onw-backend"
FRONTEND_IMAGE="${REGISTRY}/onw-frontend"

echo "========================================"
echo "        ONW 自动部署脚本"
echo "========================================"
echo "镜像仓库: ${REGISTRY}"
echo "服务器:   ${SERVER_USER}@${SERVER_IP}"
echo "标签:     ${TAG}"
echo "========================================"
echo ""

# ====== 1. 本地构建 ======
echo "🏗️  [1/4] 本地构建 Docker 镜像..."

SERVER_IP="${SERVER_IP}" \
NEXT_PUBLIC_API_URL="${SERVER_IP}:80" \
docker compose build --no-cache

echo "✅ 构建完成"
echo ""

# ====== 2. Tag + Push ======
echo "🏷️  [2/4] 打标签并推送到镜像仓库..."

# 后端镜像
docker tag onw-backend:latest "${BACKEND_IMAGE}:${TAG}"
docker tag onw-backend:latest "${BACKEND_IMAGE}:latest"
echo "  → ${BACKEND_IMAGE}:${TAG}"

# 前端镜像
docker tag onw-frontend:latest "${FRONTEND_IMAGE}:${TAG}"
docker tag onw-frontend:latest "${FRONTEND_IMAGE}:latest"
echo "  → ${FRONTEND_IMAGE}:${TAG}"

echo ""
echo "📤 推送镜像..."

docker push "${BACKEND_IMAGE}:${TAG}"
docker push "${BACKEND_IMAGE}:latest"
docker push "${FRONTEND_IMAGE}:${TAG}"
docker push "${FRONTEND_IMAGE}:latest"

echo "✅ 推送完成"
echo ""

# ====== 3. 生成服务器配置 ======
echo "📝 [3/4] 生成服务器配置文件..."

cat > docker-compose.remote.yml << 'YAML'
version: '3.8'

services:
  backend:
    image: __BACKEND_IMAGE__:__TAG__
    restart: unless-stopped
    environment:
      - JAVA_OPTS=-Xmx512m -Xms256m
    entrypoint: ["sh", "-c", "java $$JAVA_OPTS -jar app.jar"]

  frontend:
    image: __FRONTEND_IMAGE__:__TAG__
    restart: unless-stopped
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - frontend
      - backend
YAML

# 替换占位符
sed -i.bak "s|__BACKEND_IMAGE__:__TAG__|${BACKEND_IMAGE}:latest|g" docker-compose.remote.yml
sed -i.bak "s|__FRONTEND_IMAGE__:__TAG__|${FRONTEND_IMAGE}:latest|g" docker-compose.remote.yml
rm -f docker-compose.remote.yml.bak

echo "  ✓ docker-compose.remote.yml"
echo ""

# ====== 4. 部署到服务器 ======
echo "🚀 [4/4] 部署到服务器..."

# 上传配置文件
echo "  上传配置文件..."
scp docker-compose.remote.yml nginx.conf "${SERVER_USER}@${SERVER_IP}:/opt/onw/"

# 在服务器上执行部署
echo "  执行远程部署命令..."
ssh "${SERVER_USER}@${SERVER_IP}" << 'ENDSSH'
set -e

cd /opt/onw

echo "  → 拉取最新镜像..."
docker compose -f docker-compose.remote.yml pull

echo "  → 停止旧服务..."
docker compose -f docker-compose.remote.yml down

echo "  → 启动新服务..."
docker compose -f docker-compose.remote.yml up -d

echo "  → 清理未使用的镜像..."
docker image prune -f
ENDSSH

# 清理本地临时文件
rm -f docker-compose.remote.yml

echo ""
echo "========================================"
echo "✅ 部署成功！"
echo "========================================"
echo "访问地址: http://${SERVER_IP}"
echo ""
echo "查看日志:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'cd /opt/onw && docker compose -f docker-compose.remote.yml logs -f'"
echo ""
echo "服务状态:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'cd /opt/onw && docker compose -f docker-compose.remote.yml ps'"
echo "========================================"
