#!/bin/bash

# BuildKit 활성화
export DOCKER_BUILDKIT=1

echo "🚀 Docker 빌드 시작 (BuildKit 활성화)..."

# 병렬 빌드 활성화
docker-compose -p boardlife build --parallel

# 컨테이너 시작
echo "🔄 컨테이너 시작 중..."
docker-compose -p boardlife up -d

echo "✅ 빌드 및 배포 완료!"
echo "📋 컨테이너 상태:"
docker-compose -p boardlife ps 