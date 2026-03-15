---
name: filesystem-usage
description: 指导何时及如何调用 read_file、write_file、execute 工具。适用于用户说「读文件」「打开 CSV」「执行脚本」「保存到文件」「运行代码」等文件操作场景。
---

# Filesystem 工具使用指南

## 工具与触发场景

| 工具 | 触发关键词 | 典型用户表述 |
|------|------------|--------------|
| **read_file** | 读、打开、看看、读取 | 「读取这个文件」「打开 CSV」「看看 data.csv 内容」 |
| **write_file** | 保存、写入、生成、写到 | 「保存到文件」「写入结果」「生成 CSV」「写到 notes.txt」 |
| **execute** | 运行、执行 | 「运行这段代码」「执行 Python」「执行命令 python process.py」 |

## 安全约束

- **路径限制**：所有路径均为**相对路径**，相对于会话工作目录 `workdir/{session_id}/`。
- **禁止越权**：path 不允许包含 `..`，不能越出工作目录。
- **session 隔离**：每个会话有独立工作目录，互不干扰。

## 调用规则

1. **静默直接调用**：需要时直接调用工具，禁止先输出「正在读取」「我先执行一下」等过渡句。
2. **read_file**：path 如 `data.csv`、`notes/1.txt`。
3. **write_file**：path + content。
4. **execute**：command 如 `python process.py`，在工作目录内执行。
