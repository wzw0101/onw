# ONW (One Night Werewolf)

狼人杀游戏 - monorepo

## 目录结构

```
onw/
├── backend/      (原 onw-backend)
├── frontend/     (原 onw-frontend)
├── deploy.sh
├── docker-compose.yml
└── .gitignore
```

## 子项目

- **backend** — Spring Boot (Java 21, STOMP WebSocket, port 8080)
- **frontend** — Next.js (standalone mode, port 3000)

## 部署

见 [DEPLOY.md](./DEPLOY.md)

## 开发

```bash
# 启动所有服务
docker compose up

# 只启动 backend
cd backend && docker compose up

# 只启动 frontend
cd frontend && docker compose up
```
