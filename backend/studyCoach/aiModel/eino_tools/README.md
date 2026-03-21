# eino_tools

CoachChat 使用的工具集，分为三类：**plantask**、**studyplan**、**filesystem**。三者职责不同，互不重复。

## 工具对比

| 工具集 | 职责 | 数据形态 | 存储路径 | 典型场景 |
|--------|------|----------|----------|----------|
| **plantask** | 任务级管理（番茄钟、待办项） | 结构化 JSON | 默认 `Files/plantask/`（`plantask.baseDir`） | 「加一个番茄钟」「把第三步标成完成」「列出今天的任务」 |
| **studyplan** | 计划级文档（完整学习计划） | Markdown | `study_plans/{session}/...` 位于 `Files/study_plans/`（`studyplan.localDir`） | 「保存这个计划」「读取 Go 学习计划」「删掉这个计划」 |
| **filesystem** | 通用文件操作 | 任意文件 | `Files/study_plans/workdir/{session}/` | 「读一下 data.csv」「执行这个脚本」「写个笔记」 |

## plantask

- **工具**：`task_create`、`task_get`、`task_update`、`task_list`
- **粒度**：单个任务（番茄钟、待办项）
- **数据**：JSON，包含 id、title、status、duration 等
- **用途**：在已有计划上做任务级增删改查，如「在计划里加一个番茄钟」「把第三步标成完成」

## studyplan

- **工具**：`save_plan`、`read_plan`、`delete_plan`
- **粒度**：整份学习计划（Markdown 文档）
- **数据**：Markdown 文本，支持多版本（按 timestamp 区分）
- **用途**：保存/读取/删除完整计划，如「保存这个计划」「读取 Go 学习计划」「删掉这个计划」

## filesystem

- **工具**：`read_file`、`write_file`、`execute`
- **粒度**：任意文件
- **数据**：无固定格式（CSV、脚本、笔记等）
- **用途**：计划修改路径中的通用文件操作，如读取 CSV、执行脚本、写入笔记
- **安全**：工作目录按 session 隔离，路径限制在 `workdir/{session}/` 内，防止越权

## 使用路径

- **TaskStudyLambda**（制定新计划 / 技术问题）：plantask + studyplan
- **PlanModifyLambda**（修改 / 增加 / 删除计划）：plantask + studyplan + filesystem

## 配套 Skills

| Skill | 调用方式 | 说明 |
|-------|----------|------|
| plantask-usage | `skill(skill="plantask-usage")` | task_create / task_get / task_update / task_list 的触发场景与用法 |
| studyplan-usage | `skill(skill="studyplan-usage")` | save_plan / read_plan / delete_plan 的触发场景与用法 |
| filesystem-usage | `skill(skill="filesystem-usage")` | read_file / write_file / execute 的触发场景与安全约束 |
| **emotion-companion** | **自动加载** | 情感陪伴分支（EmotionAndCompanionShip）专用，心流伴侣与心理能量补给站 |

emotion-companion 在情感分支启动时自动注入，无需通过 skill 工具调用；其余三个由 ReAct/PlanModify 路径的 agent 按需加载。
