# Boardlife 도커 배포 가이드 (기존 Nginx 활용)

이 문서는 Boardlife 애플리케이션을 Docker를 사용하여 `boardlife.teeroz.net` 도메인에 배포하는 방법을 설명합니다. 이 가이드는 서버에 이미 실행 중인 Nginx를 활용하는 방법을 설명합니다.

## 사전 요구사항

- Docker와 Docker Compose가 설치된 서버
- 서버에 이미 실행 중인 Nginx
- boardlife.teeroz.net을 가리키는 도메인
- SSL 인증서 (Let's Encrypt 사용 권장)
- 'infra-local' Docker 네트워크 (기존 Nginx가 사용 중인 네트워크)

## 배포 단계

### 1. 프로젝트 클론

```bash
git clone https://github.com/teeroz/boardlife.git
cd boardlife
```

### 2. Nginx 설정 파일 추가

기존 Nginx에 설정 파일을 추가합니다:

```bash
# 필요한 경우 sudo 권한으로 진행
sudo cp boardlife.conf /path/to/nginx/conf.d/
sudo nginx -t  # 설정 문법 검사
sudo systemctl reload nginx  # 또는 적절한 Nginx 재시작 명령어
```

### 3. 도커 이미지 빌드 및 컨테이너 실행

```bash
docker-compose up -d --build
```

이 명령은 Boardlife Next.js 애플리케이션(boardlife-nextjs)을 빌드하고 백그라운드에서 실행합니다.

### 4. Docker 네트워크 연결 확인

만약 새로 생성된 컨테이너가 'infra-local' 네트워크에 자동으로 연결되지 않은 경우:

```bash
docker network connect infra-local boardlife_boardlife-nextjs_1
```

### 5. 서비스 확인

브라우저에서 `https://boardlife.teeroz.net`에 접속하여 서비스가 제대로 동작하는지 확인합니다.

## 유지 관리

### 로그 확인

```bash
# Next.js 애플리케이션 로그 확인
docker-compose logs -f boardlife-nextjs
```

### 서비스 재시작

```bash
# Next.js 애플리케이션 재시작
docker-compose restart boardlife-nextjs
```

### 컨테이너 중지

```bash
docker-compose down
```

### 업데이트 배포

```bash
git pull
docker-compose up -d --build
```

## 환경 변수 설정

기본 환경 변수는 docker-compose.yml 파일에 설정되어 있습니다. 필요한 경우 다음과 같이 docker-compose.yml 파일에서 수정할 수 있습니다:

```yaml
services:
  boardlife-nextjs:
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://boardlife.teeroz.net
      - NEXT_TELEMETRY_DISABLED=1
```

## 문제 해결

### Docker 네트워크 확인

```bash
# 사용 가능한 네트워크 목록 확인
docker network ls

# 컨테이너 네트워크 연결 확인
docker network inspect infra-local
```

### 컨테이너 상태 확인

```bash
docker ps
docker logs boardlife_boardlife-nextjs_1
```

### 네트워크 연결 문제 해결

```bash
# 필요한 경우 네트워크에 수동으로 연결
docker network connect infra-local boardlife_boardlife-nextjs_1
```
