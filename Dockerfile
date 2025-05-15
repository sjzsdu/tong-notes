# 阶段一：构建 Hugo 静态网站
FROM klakegg/hugo:0.111.3-ext AS builder

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
