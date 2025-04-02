FROM --platform=linux/amd64 node:lts AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build 

# 정적 파일 서빙용 이미지 (http-server 사용)
FROM --platform=linux/amd64 node:lts

WORKDIR /app

RUN npm install -g http-server

COPY --from=build /app/dist .

EXPOSE 80

CMD ["http-server", ".", "-p", "80"]