# 阶段一：构建 Hugo 静态网站
FROM klakegg/hugo:latest AS builder

# 设置工作目录
WORKDIR /src

# 复制项目文件
COPY . .

# 构建静态网站
RUN hugo --minify

# 阶段二：使用 Nginx 提供静态文件
FROM nginx:alpine

# 删除默认的 Nginx 静态文件
RUN rm -rf /usr/share/nginx/html/*

# 复制构建产物到 Nginx 的默认服务目录
COPY --from=builder /src/public /usr/share/nginx/html

# 如果需要自定义 Nginx 配置，可以取消以下注释并提供 `nginx.conf`
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 8082

# 启动 Nginx，以守护进程模式关闭
CMD ["nginx", "-g", "daemon off;"]
