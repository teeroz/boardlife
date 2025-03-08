# syntax=docker/dockerfile:1.4
FROM node:22-alpine AS base

# 의존성 설치 레이어
FROM base AS deps
WORKDIR /app

# package.json 및 lock 파일만 복사하여 의존성 캐싱 개선
COPY package.json package-lock.json* .npmrc ./

# npm ci를 사용하여 더 빠르고 안정적인 설치
RUN --mount=type=cache,target=/root/.npm \
  npm ci --omit=dev --no-audit --prefer-offline

# 소스 코드 빌드 레이어
FROM base AS builder
WORKDIR /app

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules

# 소스 코드 복사
COPY . .

# 텔레메트리 비활성화
ENV NEXT_TELEMETRY_DISABLED 1

# 빌드 캐싱 활용
RUN --mount=type=cache,target=/root/.npm \
  npm run build

# 런타임 이미지
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3001

# 시스템 사용자 생성 (명령 결합으로 레이어 감소)
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

# 필요한 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"] 