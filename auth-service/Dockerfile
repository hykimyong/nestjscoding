FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# proto 파일을 dist 폴더로 복사
RUN mkdir -p dist/proto && cp src/proto/*.proto dist/proto/

EXPOSE 50151

CMD ["npm", "run", "start:prod"] 