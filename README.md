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
- 역할 기반 접근 제어 (USER, AUDITOR, ADMIN, OPERATOR)
- 서비스 라우팅
- API 엔드포인트:
  - POST /auth/register: 회원가입
  - POST /auth/login: 로그인
  - POST /events: 이벤트 생성 (OPERATOR, ADMIN)
  - POST /events/attendance: 출석 이벤트 생성 (OPERATOR, ADMIN)
  - GET /events: 이벤트 목록 조회 (OPERATOR, ADMIN)
  - GET /events/:eventId: 이벤트 상세 조회 (OPERATOR, ADMIN)
  - POST /rewards: 보상 생성 (OPERATOR, ADMIN)
  - GET /rewards/event/:eventId: 이벤트의 보상 목록 조회
  - POST /rewards/request: 보상 요청
  - GET /rewards/status: 보상 요청 내역 조회 (권한별 차등 적용)

### Auth Service (Port: 3001)

- 사용자 인증/인가
- JWT 토큰 관리
- 회원가입/로그인
- 역할 기반 권한 관리

### Event Service (Port: 3002)

- 이벤트 관리
  - 일반 이벤트
  - 출석 이벤트
- 보상 시스템
  - 보상 생성 및 관리
  - 보상 요청 처리
  - 보상 상태 관리
- 출석 체크 시스템

## 권한 체계

- USER: 일반 사용자
  - 자신의 보상 내역만 조회 가능
  - 보상 요청 가능
- AUDITOR: 감사자
  - 모든 사용자의 보상 내역 조회 가능
  - 특정 사용자의 보상 내역 조회 가능
- ADMIN: 관리자
  - 모든 기능 접근 가능
  - 이벤트 및 보상 생성/관리
  - 모든 사용자의 보상 내역 조회
- OPERATOR: 운영자
  - 이벤트 및 보상 생성/관리
  - 모든 사용자의 보상 내역 조회 가능
  - 특정 사용자의 보상 내역 조회 가능

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

각 서비스별 개발 환경 실행:

1. 의존성 설치:

```bash
cd [service-directory]
npm install
```

2. 개발 모드로 실행:

```bash
npm run start:dev
```

## Environment Variables

각 서비스에서 사용하는 환경 변수:

- `MONGODB_URI`: MongoDB 연결 문자열
- `PORT`: 서비스 포트 번호
- 추가 환경 변수는 docker-compose.yml 파일에 정의되어 있음

## Testing

각 서비스의 테스트 실행:

```bash
cd [service-directory]
npm run test
```

## 시스템 구조

- API Gateway (Port: 3000)
- Auth Service (gRPC Port: 50151)
- Event Service (gRPC Port: 50152)
  - Reward Service (Event Service 내부 모듈로 통합)

## 역할 (Roles)

- `ADMIN`: 시스템 관리자
  - 모든 기능에 접근 가능
  - 이벤트 상세 조회
  - 보상 생성
  - 보상 히스토리 조회
- `OPERATOR`: 운영자
  - 이벤트 상세 조회
  - 보상 생성
- `AUDITOR`: 감사자
  - 보상 히스토리 조회
- `USER`: 일반 사용자
  - 보상 요청
  - 자신의 보상 상태 조회

## API Endpoints

### Auth Service

- POST `/auth/login`
  - 로그인
  - Request Body: `{ "userId": string, "password": string }`
  - Response: `{ "access_token": string, "user": { "userId": string } }`

### Event Service

- POST `/events`

  - 이벤트 생성
  - 권한: `ADMIN`, `OPERATOR`
  - Request Body: `{ "title": string, "description": string }`

- GET `/events`

  - 이벤트 목록 조회
  - Query Parameters:
    - page: number
    - limit: number
    - searchKeyword: string

- GET `/events/:eventId`
  - 이벤트 상세 조회 (보상 정보 포함)
  - 권한: `ADMIN`, `OPERATOR`

### Reward Service

- POST `/rewards`

  - 보상 생성
  - 권한: `ADMIN`, `OPERATOR`
  - Request Body:
    ```json
    {
      "eventId": string,
      "title": string,
      "description": string,
      "requiredAttendance": number,
      "rewardType": string,
      "rewardValue": string,
      "isActive": boolean
    }
    ```

- GET `/rewards/status`

  - 보상 상태 조회
  - 권한: 인증된 사용자
  - Query Parameters:
    - eventId?: string (특정 이벤트의 보상 상태만 조회)
    - userId?: string (관리자가 특정 사용자의 보상 상태 조회 시 사용)
  - Response:
    ```json
    {
      "success": boolean,
      "message": string,
      "statuses": [
        {
          "userId": string,
          "eventId": string,
          "rewardId": string,
          "currentAttendance": number,
          "isEligible": boolean,
          "isClaimed": boolean
        }
      ]
    }
    ```

- POST `/rewards/request`

  - 보상 요청
  - 권한: `USER`
  - Request Body: `{ "eventId": string, "rewardId": string }`

- GET `/rewards/history`
  - 보상 히스토리 조회
  - 권한: `ADMIN`, `AUDITOR`

## 에러 처리

- 존재하지 않는 이벤트 ID로 요청 시:
  ```json
  {
    "success": false,
    "message": "존재하지 않는 이벤트입니다."
  }
  ```
- 잘못된 형식의 ID로 요청 시:
  ```json
  {
    "success": false,
    "message": "유효하지 않은 {fieldName} 형식입니다."
  }
  ```
- 권한이 없는 경우:
  ```json
  {
    "statusCode": 403,
    "message": "Forbidden resource"
  }
  ```
