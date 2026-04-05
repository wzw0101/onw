# ONW 部署指南 (Monorepo 版本)

## 架构

```
onw/
├── backend/      → Spring Boot (Java 21, STOMP WebSocket, port 8080)
├── frontend/     → Next.js (standalone mode, port 3000)
├── nginx.conf      → 反向代理 (port 80)，WebSocket 在 /stomp/
├── docker-compose.yml   → 本地开发 + 服务器部署（通过 ACR_REGISTRY 区分）
└── deploy.sh       → 本地一键部署
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

### 部署方式

1. **GitHub Actions（推荐）：** push 到 main 分支自动构建、推送镜像、部署
2. **手动部署：** 运行 `./deploy.sh`

### 环境变量

服务器 `/opt/onw/.env` 中配置：
```env
ACR_REGISTRY=crpi-xxx.cn-shenzhen.personal.cr.aliyuncs.com/wzw9807
```

`docker-compose.yml` 通过 `${ACR_REGISTRY}` 区分本地和服务器镜像地址。

### nginx 镜像

nginx 镜像通过 ACR 拉取，避免服务器无法访问 Docker Hub 的问题。

### Monorepo 结构

合并后，`backend/` 和 `frontend/` 各自保留独立的历史 commit。
