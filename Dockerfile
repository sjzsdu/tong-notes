# 阶段一：构建 Hugo 静态网站
FROM node:alpine AS builder

# 安装必要的工具
RUN apk add --no-cache wget ca-certificates

# 安装 Hugo
RUN wget -O - https://github.com/gohugoio/hugo/releases/download/v0.146.3/hugo_extended_0.146.3_Linux-64bit.tar.gz | tar -xz -C /usr/local/bin hugo

# 设置工作目录
WORKDIR /app

# 复制项目文件（包括主题文件）
COPY . .

# 构建静态网站
RUN hugo --minify --buildDrafts

# 阶段二：使用 Nginx 提供静态文件
FROM nginx:alpine

# 删除默认的 Nginx 静态文件
RUN rm -rf /usr/share/nginx/html/*

# 复制构建产物到 Nginx 的默认服务目录
COPY --from=builder /app/public /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 8082

# 启动 Nginx，以守护进程模式关闭
CMD ["nginx", "-g", "daemon off;"]
