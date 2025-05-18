# NestJS Microservices Project

NestJS와 MongoDB 기반의 마이크로서비스 프로젝트입니다.

> 이 프로젝트는 [nestjs-msa-boilerplate](https://github.com/ruccess/nestjs-msa-boilerplate)를 기반으로 개발되었습니다.

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

### Auth Service (gRPC Port: 50151)

- 사용자 인증/인가
- JWT 토큰 관리
- 회원가입/로그인
- 역할 기반 권한 관리

### Event Service (gRPC Port: 50152)

- 이벤트 관리
  - 일반 이벤트
  - 출석 이벤트
- 보상 시스템 (Event Service 내부 모듈로 통합)
  - 보상 생성 및 관리
  - 보상 요청 처리
  - 보상 상태 관리
- 출석 체크 시스템

## 권한 체계

- USER: 일반 사용자
  - 보상 요청
  - 자신의 보상 내역만 조회 가능
- AUDITOR: 감사자
  - 모든 사용자의 보상 내역 조회 가능
  - 특정 사용자의 보상 내역 조회 가능
- ADMIN: 관리자
  - 모든 기능 접근 가능
  - 이벤트 및 보상 생성/관리
  - 모든 사용자의 보상 내역 조회
- OPERATOR: 운영자
  - 이벤트 및 보상 생성/관리
  - 이벤트 상세 조회
  - 모든 사용자의 보상 내역 조회 가능

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
    "message": "Forbidden resource",
    "error": "해당 작업을 수행할 권한이 없습니다. 필요한 권한: [requiredRole]"
  }
  ```

## API Documentation (Swagger)

API Gateway에서는 Swagger를 통해 API 문서를 제공합니다.

### Swagger UI 접속

- URL: http://localhost:3000/api
- Bearer 토큰 인증이 필요한 API의 경우, 우측 상단의 'Authorize' 버튼을 클릭하여 토큰을 입력해야 합니다.

### API 그룹

1. Auth

   - POST /auth/register: 회원가입
   - POST /auth/login: 로그인

2. Events

   - POST /events: 이벤트 생성 (OPERATOR, ADMIN)
   - GET /events: 이벤트 목록 조회 (OPERATOR, ADMIN)
   - GET /events/:eventId: 이벤트 상세 조회 (OPERATOR, ADMIN)
   - POST /events/attendance: 출석 이벤트 생성 (OPERATOR, ADMIN)

3. Rewards
   - POST /rewards: 보상 생성 (OPERATOR, ADMIN)
   - POST /rewards/request: 보상 요청 (USER)
   - GET /rewards/history: 보상 히스토리 조회 (AUDITOR, ADMIN)
   - GET /rewards/status: 보상 상태 조회

### 인증

1. Bearer 토큰 설정 방법:

   - Swagger UI 우측 상단의 'Authorize' 버튼 클릭
   - 발급받은 JWT 토큰을 'Bearer [token]' 형식으로 입력
   - 'Authorize' 버튼 클릭하여 저장

2. 토큰 발급:
   - /auth/login API를 통해 로그인하여 토큰 발급
   - 응답으로 받은 access_token을 Bearer 토큰으로 사용

### Request/Response 예시

각 API의 Request Body와 Response 형식은 Swagger UI에서 확인할 수 있습니다:

1. Request Body 예시:

   - 스키마 정의 확인
   - 필수 필드 구분 (required)
   - 각 필드의 타입과 설명
   - 예시 값 제공

2. Response 예시:
   - 성공/실패 응답 코드
   - 응답 데이터 구조
   - 에러 메시지 형식

### 권한 (Roles)

API 접근 권한은 다음과 같이 구분됩니다:

- USER: 일반 사용자 권한
- OPERATOR: 운영자 권한
- ADMIN: 관리자 권한
- AUDITOR: 감사자 권한

각 API의 필요 권한은 Swagger UI에서 API 설명에 명시되어 있습니다.

## 추가 기능

### 이벤트 수정

어드민 권한을 가진 유저라면 이벤트정보를 수정할수있게 PUT 요청 기능 생성

### 보상 수정

어드민 권한을 가진 유저라면 보상정보를 수정할수있게 PUT 요청 기능 생성
