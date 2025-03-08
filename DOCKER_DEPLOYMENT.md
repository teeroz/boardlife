# Boardlife 도커 배포 가이드

이 문서는 Boardlife 애플리케이션을 Docker를 사용하여 `boardlife.teeroz.net` 도메인에 배포하는 방법을 설명합니다.

## 사전 요구사항

- Docker와 Docker Compose가 설치된 서버
- boardlife.teeroz.net을 가리키는 도메인
- SSL 인증서 (Let's Encrypt 사용 권장)

## 배포 단계

### 1. 프로젝트 클론

```bash
git clone https://github.com/teeroz/boardlife.git
cd boardlife
```

### 2. SSL 인증서 설정

Nginx에서 HTTPS를 사용하기 위해 SSL 인증서가 필요합니다. Let's Encrypt를 사용하여 무료 인증서를 발급받을 수 있습니다.

#### Let's Encrypt 인증서 발급 (권장)

서버에 Certbot을 설치하고 인증서를 발급받습니다:

```bash
sudo apt-get update
sudo apt-get install certbot
sudo certbot certonly --standalone -d boardlife.teeroz.net
```

발급받은 인증서를 Nginx 설정에서 사용할 수 있도록 복사합니다:

```bash
mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/boardlife.teeroz.net/fullchain.pem nginx/certs/boardlife.teeroz.net.crt
sudo cp /etc/letsencrypt/live/boardlife.teeroz.net/privkey.pem nginx/certs/boardlife.teeroz.net.key
sudo chown -R $USER:$USER nginx/certs
```

#### 자체 서명 인증서 생성 (테스트용)

테스트 환경에서는 자체 서명 인증서를 사용할 수 있습니다:

```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/certs/boardlife.teeroz.net.key -out nginx/certs/boardlife.teeroz.net.crt
```

### 3. 도커 이미지 빌드 및 컨테이너 실행

```bash
docker-compose up -d --build
```

이 명령은 Boardlife 애플리케이션과 Nginx 서버를 빌드하고 백그라운드에서 실행합니다.

### 4. 서비스 확인

브라우저에서 `https://boardlife.teeroz.net`에 접속하여 서비스가 제대로 동작하는지 확인합니다.

## 유지 관리

### 로그 확인

```bash
docker-compose logs -f
```

### 서비스 재시작

```bash
docker-compose restart
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
  boardlife:
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://boardlife.teeroz.net
      - NEXT_TELEMETRY_DISABLED=1
```

## 문제 해결

### Nginx 설정 테스트

```bash
docker-compose exec nginx nginx -t
```

### 인증서 갱신

Let's Encrypt 인증서는 90일마다 갱신해야 합니다:

```bash
sudo certbot renew
```

갱신 후 인증서 파일을 복사하고 Nginx를 재시작합니다:

```bash
sudo cp /etc/letsencrypt/live/boardlife.teeroz.net/fullchain.pem nginx/certs/boardlife.teeroz.net.crt
sudo cp /etc/letsencrypt/live/boardlife.teeroz.net/privkey.pem nginx/certs/boardlife.teeroz.net.key
docker-compose restart nginx
```
