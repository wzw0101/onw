# ONW 部署指南 (Monorepo 版本)

## 架构

```
onw/
├── backend/      → Spring Boot (Java 21, STOMP WebSocket, port 8080)
├── frontend/     → Next.js (standalone mode, port 3000)
├── nginx.conf      → 反向代理 (port 80)，WebSocket 在 /stomp/
├── docker-compose.yml          → 本地开发
└── deploy.sh       → 一键部署
```

## 服务器信息

- **IP:** 47.106.68.83
- **用户:** root
- **SSH:** 已配置公钥免密登录
- **系统:** Debian 12, Docker 29.3.0, Compose v5.1.1
- **部署目录:** `/opt/onw/`
- **服务:** backend + frontend + nginx，全部容器化

## 本地开发

```bash
# 启动所有服务
docker compose up

# 只启动 backend
cd backend && docker compose up

# 只启动 frontend
cd frontend && docker compose up
```

## 部署命令

```bash
# 构建并部署到服务器
./deploy.sh

# 或指定 registry 和服务器
REGISTRY="your-registry" SERVER_IP="your-ip" ./deploy.sh
```

## 注意事项

### nginx 镜像

nginx 镜像直接用 Docker Hub 的 `nginx:alpine`，服务器已配置阿里云镜像加速器，可正常拉取。

### Monorepo 结构

合并后，`backend/` 和 `frontend/` 各自保留独立的历史 commit。
