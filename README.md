# NestJS Microservices Project

NestJS와 MongoDB 기반의 마이크로서비스 프로젝트입니다.

## Prerequisites

- Docker Desktop ([다운로드](https://www.docker.com/products/docker-desktop))
- Node.js 18 이상 ([다운로드](https://nodejs.org/))

## 프로젝트 실행 방법

1. Docker Desktop 실행
   - Docker Desktop이 실행 중인지 확인하세요

2. 프로젝트 실행
```bash
docker-compose up -d --build
```

## 접속 정보

- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Event Service: http://localhost:3002
- MongoDB: mongodb://localhost:27017 (root/example)

## 프로젝트 구조

### API Gateway (Port: 3000)
- JWT 기반 인증
- 역할 기반 접근 제어
- 서비스 라우팅

### Auth Service (Port: 3001)
- 사용자 인증/인가
- JWT 토큰 관리
- 회원가입/로그인

### Event Service (Port: 3002)
- 이벤트 관리
- 알림 처리

## 자주 쓰는 명령어

```bash
# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

## 문제 해결

MongoDB 재시작 문제 발생시:
```bash
docker-compose down
docker volume rm maple_mongodb_data
docker-compose up -d
```

## Docker Commands

유용한 Docker 명령어들:

```bash
# 모든 서비스의 상태 확인
docker-compose ps

# 특정 서비스의 로그 확인 (예: mongodb)
docker-compose logs mongodb

# 모든 서비스의 실시간 로그 확인
docker-compose logs -f

# 모든 서비스 중지
docker-compose down

# 특정 서비스만 재시작
docker-compose restart [service-name]
```

## 문제 해결

### MongoDB 연결 문제
MongoDB가 재시작을 반복하는 경우:
```bash
# 모든 서비스 중지
docker-compose down

# MongoDB 볼륨 삭제
docker volume rm [project-name]_mongodb_data

# 서비스 재시작
docker-compose up -d
```

### 포트 충돌
이미 사용 중인 포트가 있다면 docker-compose.yml 파일에서 포트 매핑을 수정하세요.

## Service Details

### API Gateway
- Main entry point for the application
- Handles routing to appropriate microservices
- Manages API documentation

### Authentication Service
- Handles user authentication and authorization
- Manages JWT tokens
- User registration and login

### Event Service
- Manages events and notifications
- Handles event creation and distribution
- Event logging and tracking

## Development

To run services individually for development:

1. Install dependencies in each service directory:
```bash
cd [service-directory]
npm install
```

2. Start the service in development mode:
```bash
npm run start:dev
```

## Environment Variables

Each service uses the following environment variables:

- `MONGODB_URI`: MongoDB connection string
- `PORT`: Service port number
- Additional service-specific variables are defined in the docker-compose.yml file

## Testing

To run tests for each service:

```bash
cd [service-directory]
npm run test
```

## 문제 해결

아, PowerShell에서는 rd 명령어가 다르게 동작하네요. PowerShell 문법으로 수정해서 다시 실행해보겠습니다:

```bash
Remove-Item -Recurse -Force api-gateway/node_modules
Remove-Item -Recurse -Force auth-service/node_modules
Remove-Item -Recurse -Force event-service/node_modules
```

또는 각각 따로 실행할 수도 있습니다:

```bash
rm -r api-gateway/node_modules
rm -r auth-service/node_modules
rm -r event-service/node_modules
```

이렇게 node_modules를 삭제한 후에 README 순서대로 진행해볼까요? 
``` 