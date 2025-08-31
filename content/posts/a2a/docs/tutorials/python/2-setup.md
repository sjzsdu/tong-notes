---
title: "2. 设置您的环境"
date: 2025-08-30T23:04:28+08:00
draft: false
description: "2. 设置您的环境"
tags: 
  - "文档"
categories:
  - "技术"
---

# 2. 设置您的环境

## 先决条件

- Python 3.10或更高版本。
- 访问终端或命令提示符。
- Git，用于克隆仓库。
- 推荐使用代码编辑器（例如，Visual Studio Code）。

## 克隆仓库

如果您还没有，请克隆A2A示例仓库：

```bash
git clone https://github.com/a2aproject/a2a-samples.git -b main --depth 1
cd a2a-samples
```

## Python环境和SDK安装

我们建议为Python项目使用虚拟环境。A2A Python SDK使用`uv`进行依赖管理，但您也可以使用`pip`和`venv`。

1. **创建并激活虚拟环境：**

    使用`venv`（标准库）：

    === "Mac/Linux"

        ```sh
        python -m venv .venv
        source .venv/bin/activate
        ```

    === "Windows"

        ```powershell
        python -m venv .venv
        .venv\Scripts\activate
        ```

2. **安装所需的Python依赖项以及A2A SDK及其依赖项：**

    ```bash
    pip install -r samples/python/requirements.txt
    ```

## 验证安装

安装后，您应该能够在Python解释器中导入`a2a`包：

```bash
python -c "import a2a; print('A2A SDK导入成功')"
```

如果此命令运行无错误并打印成功消息，则您的环境设置正确。