FROM node:22-alpine AS builder
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL=localhost:80
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# 注入 standalone 输出模式（不改源码）
RUN sed -i 's/const nextConfig: NextConfig = {/const nextConfig: NextConfig = { output: "standalone",/' next.config.ts
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
