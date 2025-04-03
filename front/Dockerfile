FROM --platform=linux/amd64 node:lts AS build

WORKDIR /app

# 의존성 파일만 먼저 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# 프로덕션 이미지
FROM --platform=linux/amd64 nginx:alpine

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 파일을 Nginx로 복사
COPY --from=build /app/dist /usr/share/nginx/html
 
# 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]