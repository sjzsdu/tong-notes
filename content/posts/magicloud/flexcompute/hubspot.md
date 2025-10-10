# Flexcompute HubSpot 项目

## 项目概述

这是 Flexcompute 的 HubSpot CMS 主题和模块开发项目。项目主要包括自定义主题开发和多个功能模块的实现。

> ⚠️ **重要警告**：该项目直接连接生产环境，没有开发/测试环境隔离！

### 基本信息
- **项目名称**: Flexcompute HubSpot 前端
- **主题名称**: growth-custom
- **HubSpot Portal ID**: 43542601
- **环境**: 生产环境（直接连接，无开发环境）

## 项目结构

```
hubspot/
├── hubspot.config.yml          # HubSpot CLI 配置文件
├── pub.sh                      # 部署脚本
├── watch.sh                    # 开发监控脚本
├── @hubspot/                   # HubSpot 官方模块
│   ├── blog_comments.module/
│   ├── blog_content.module/
│   ├── button_interactive.module/
│   ├── form_interactive.module/
│   └── ... (50+ 个模块)
└── themes/growth-custom/       # 自定义主题
    ├── theme.json             # 主题配置
    ├── child.css              # 子主题样式
    ├── child.js               # 子主题脚本
    ├── css/                   # 样式文件
    ├── js/                    # JavaScript 文件
    ├── images/                # 图片资源
    └── templates/             # 模板文件
        ├── blog-index.html
        ├── flexcompute-common.html
        ├── flow360-case-studies.html
        ├── news-post.html
        ├── news.html
        ├── photonforge-case-studies.html
        ├── tidy3d-case-studies.html
        ├── layouts/           # 布局模板
        └── partials/          # 组件模板
```

## 技术栈

- **CMS**: HubSpot CMS Hub
- **主题框架**: 继承自 @hubspot/growth 主题
- **开发工具**: HubSpot CLI
- **版本控制**: Git（当前分支：flexcompute/hubspot）

## 开发环境设置

### 前置条件

1. **Node.js**（推荐 LTS 版本）
2. **HubSpot CLI**
   ```bash
   npm install -g @hubspot/cli
   ```

### 初始化开发环境

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd hubspot
   ```

2. **HubSpot 认证**
   - 项目配置了个人访问密钥认证
   - 配置文件：`hubspot.config.yml`
   - Portal：flexcompute（ID：43542601）

3. **验证连接**
   ```bash
   hs auth info
   ```

## 开发工作流程

> ⚠️ **重要警告**：当前项目没有开发/测试环境，所有更改将直接在生产环境中生效！请谨慎操作。

### 1. 实时监控模式

```bash
# 启动监控模式，自动同步文件更改到生产环境
./watch.sh
```

此命令将：
- 监控 `themes/growth-custom` 目录
- **自动上传文件更改到生产 HubSpot**
- 执行初始上传

**⚠️ 注意**：使用此模式时，每次文件保存都会立即同步到生产环境！

### 2. 手动部署

```bash
# 部署整个主题到生产环境
./pub.sh

# 部署特定文件到生产环境
./pub.sh templates/home.html css/main.css
```

**⚠️ 注意**：手动部署也是直接部署到生产环境！

## 主要功能和模块

### 自定义主题（growth-custom）

**主题特性**：
- 继承自 HubSpot Growth 主题
- 响应式设计，支持移动端（断点：767px）

**模板文件**：
- `blog-index.html` - 博客列表页
- `news.html` / `news-post.html` - 新闻页面
- `flexcompute-common.html` - 通用页面模板
- 产品案例研究页面：
  - `flow360-case-studies.html`
  - `photonforge-case-studies.html`
  - `tidy3d-case-studies.html`

## 重要配置文件

### hubspot.config.yml
HubSpot CLI 的核心配置文件，包含：
- Portal 连接信息
- 认证配置（个人访问密钥）
- 环境设置

### theme.json
主题元数据配置：
- 主题标识和预览设置
- 响应式断点配置
- 作者信息
- 模块可见性设置

## 部署和发布

> ⚠️ **重要提醒**：当前配置没有开发环境，所有操作都直接影响生产环境！

## 注意事项和最佳实践

### ⚠️ 关键开发注意事项

1. **⚠️ 直接连接生产环境**：
   - **没有开发/测试环境**，所有更改都直接在生产环境中生效
   - 使用 `./watch.sh` 时，每次文件保存都会立即同步到线上
   - **建议在非业务高峰时间进行开发**

## 故障排除

### 常见问题

1. **认证失败**
   ```bash
   hs auth info
   ```
   检查认证状态，必要时重新认证

## 相关链接

- [HubSpot CLI 文档](https://developers.hubspot.com/docs/cms/developer-reference/local-development-cms-cli)
- [HubSpot CMS 主题开发指南](https://developers.hubspot.com/docs/cms/building-blocks/themes)
- [HubL 模板语言文档](https://developers.hubspot.com/docs/cms/versions-deprecations/deprecated/modules)
