# Tong Notes

[![Deploy Hugo](https://github.com/juzhongsun/tong-notes/actions/workflows/deploy.yml/badge.svg)](https://github.com/juzhongsun/tong-notes/actions/workflows/deploy.yml)

## 项目简介

这是一个基于Hugo静态网站生成器的个人笔记和博客网站，用于记录学习和研究新东西的笔记。

网站地址：[https://doc.wnbgj.com/](https://doc.wnbgj.com/)

GitHub仓库：[https://github.com/juzhongsun/tong-notes](https://github.com/juzhongsun/tong-notes)

## 主要特点

- 基于Hugo构建的高性能静态网站
- 使用Stack主题，提供现代化的阅读体验
- 支持多语言内容（主要为简体中文）
- 内置Mermaid图表支持
- 支持数学公式渲染
- 文章目录自动生成
- 响应式设计，适配各种设备

## 内容分类

本站包含以下主要内容分类：

- 技术文档和教程
- 学习笔记和心得
- 各类技术解析文章

主要涵盖的技术领域包括：

- Angular开发
- TypeScript编程
- Hugo静态网站构建
- 金融相关技术
- Tidy3D相关内容
- 更多其他技术领域...

## 本地开发

### 环境要求

- Hugo Extended v0.146.3+
- Git

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/juzhongsun/tong-notes.git
cd tong-notes
git submodule update --init --recursive
```

2. 本地运行
```
hugo server -D
```
3. 构建静态文件
```
hugo --minify
```
## 部署方式
本项目支持多种部署方式：

1. GitHub Pages ：通过GitHub Actions自动部署到GitHub Pages
2. Docker部署 ：使用项目中的Dockerfile构建容器镜像
## 技术栈
- 静态网站生成器 ：Hugo
- 主题 ：Stack和PaperMod
- 部署 ：GitHub Actions, Docker
- 图表支持 ：Mermaid.js
- 数学公式 ：KaTeX/MathJax
## 许可证
本项目内容采用 CC BY-NC-ND 许可协议。

## 贡献
欢迎通过Issue或Pull Request提供建议和改进。