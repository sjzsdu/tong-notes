# 构建与贡献建议

## 构建类型矩阵
| 目标 | 平台 | 入口 | 产物 | 关键依赖 |
|------|------|------|------|----------|
| 静态库 `uvf` | native | CMake | libuvf.a | VTK Core/DataModel/... |
| CLI `uvf_cli` | native | main.cpp | 命令行工具 | 上述 + 解析模块 |
| Wasm `uvf_wasm` | web | C API 导出 | uvf.js / uvf.wasm | Emscripten + VTK wasm build |

## 推荐目录划分（演进）
```
src/
  core/ (reader, classifier, writer)
  api/  (uvf_c_api.cpp/h)
  wasm/ (bindings, shim)
  util/ (id_utils, error, logging)
```

## 构建脚本增强
| 需求 | 现状 | 改进 |
|------|------|------|
| Wasm 依赖检查 | 简单脚本 | 检查 emcc 版本/VTE 构建 cache | 
| CCache/编译缓存 | 未使用 | 添加 `CMAKE_CXX_COMPILER_LAUNCHER=ccache` |
| 构建配置文档 | 零散 | 添加 `docs/development/build_native.md` / `build_wasm.md` |
| 多配置 | 手动 Release | 支持 RelWithDebInfo, ASan (`-fsanitize=address`) |

## 代码质量工具建议
| 工具 | 用途 | 集成建议 |
|------|------|----------|
| clang-format | 统一风格 | pre-commit hook & CI 检查 |
| clang-tidy | 静态分析 | PR 构建启用 (关键检查) |
| cppcheck | 附加静态检查 | 可选 nightly |
| include-what-you-use | 头文件瘦身 | 迭代启用，减少编译时间 |

## 依赖管理
- VTK 版本固定：增加 `VTK_MIN_VERSION` 常量并在 CMake `find_package` 后验证。
- JSON 库：当前引用 `third_party/nlohmann_json`，建议通过 `FetchContent` 或 `CPM.cmake` 固定版本。

## 贡献流程建议
```mermaid
flowchart LR
  Fork --> Branch[feature/<topic>] --> PR[Open PR]
  PR --> CI[CI 构建+测试]
  CI --> Review[Code Review]
  Review --> Merge[Squash & Merge]
```

### PR 模板要点 (建议)
- 背景 & 问题
- 变更内容 (清单)
- 测试覆盖 (新增/修改)
- 性能/回归风险评估
- 相关 Issue 链接

## 版本与发布
| 项目层 | 建议 | 说明 |
|--------|------|------|
| 语义化版本 | MAJOR.MINOR.PATCH | C API 变更 -> MINOR/MAJOR |
| Tag 发布 | 自动打包 wasm/native | GitHub Actions 构建 Release Assets |
| CHANGELOG | Keep a Changelog | 自动脚本生成草稿 |

## CI 流程草案
```mermaid
graph TD
  A[push/PR] --> B[Build Native (Linux/macOS)]
  A --> C[Build Wasm]
  B --> D[Run Tests]
  C --> E[Wasm Smoke Test]
  D --> F[Coverage Report]
  F --> G[Status]
  E --> G
```

## 安全与合规
| 方面 | 风险 | 建议 |
|------|------|------|
| 第三方依赖 | 未跟踪版本 | SBOM (CycloneDX) 自动生成 |
| 文件输入 | 大文件/畸形文件 | 限制点数/三角数阈值 + 超时/取消机制 |
| 内存 | 未检测 OOM | Wasm 模式监控内存增长并暴露阈值配置 |

## 性能优化路线
1. 预分配索引容器容量（估算 cell 数 * 3）。
2. 可选 SIMD（通过编译器 flags 或 Eigen）进行 AABB 算法 & 数组复制。
3. 目录模式多线程解析：文件级并行 + 合并 manifest。
4. 标量字段 lazy 写入：根据用户指定 subset。

---
*更新日期：2025-10-10*
