---
name: skill-authoring
description: 指导如何从零撰写或改写符合 Agent/Cursor 约定的 SKILL.md（含 YAML 头、触发描述、步骤与示例）。适用于用户要求「新建技能」「生成 Agent Skill」「写一个 SKILL.md」「给项目加技能」等场景；输出可直接落盘到 skills 目录供 skill 工具加载。
---

# Agent Skill 撰写指南（生成 SKILL.md）

## 何时使用本技能

用户希望**新增**或**重写**一个可被智能体加载的技能时：先根据需求确定技能目录名与用途，再按下方结构产出完整 `SKILL.md` 正文（含 frontmatter），必要时说明保存路径与如何在对话中通过 `skill` 工具加载。

## 目录与文件约定

- 每个技能一个子目录，目录名使用 **kebab-case**（小写、连字符），例如 `pdf-form-filler`。
- 目录内**至少**包含 `SKILL.md`；可选 `reference.md`、`examples.md` 或 `scripts/`。
- 在本仓库中，运行时技能根目录一般为 `backend/skills/`，新技能路径为：  
  `backend/skills/<技能目录名>/SKILL.md`

## SKILL.md 必备结构

1. **YAML frontmatter**（文件最开头，用 `---` 包裹）  
   - `name`：与目录名一致，仅小写字母、数字、连字符，长度 ≤ 64。  
   - `description`：必填，≤1024 字符。用**第三人称**写清「做什么 + 何时触发」，并包含用户可能说的关键词，便于检索与路由。

2. **正文（Markdown）**  
   - 一级标题：技能可读名称。  
   - 分节建议：`## 适用场景` `## 操作步骤` `## 约束与禁止` `## 示例`（按需）。  
   - 指令要**可执行**：步骤编号、条件分支、输出格式（如表格、模板）写清楚。  
   - 避免空泛；避免与通用常识重复的长篇背景。

## description 撰写要点

- **第三人称**：例如「整理 Git 提交信息并生成符合 Conventional Commits 的说明」，不要写「我可以帮你…」。  
- **同时包含 WHAT 与 WHEN**：能力描述 + 触发词（如「用户提到 PR、commit、changelog」）。  
- 若技能仅在本项目有效，可在 description 末尾一句点明（可选）。

## 生成新技能时的流程

1. **澄清或推断**：技能名称、主要任务、目标用户、是否仅本项目、是否需要示例或脚本。  
2. **定目录名**：`name` 与文件夹名一致。  
3. **写完整 SKILL.md**：frontmatter + 正文，一次性给出可直接保存的文件内容。  
4. **交付说明**：告知保存路径为 `backend/skills/<name>/SKILL.md`；保存后需重启或确保 `skills.baseDir` 指向该目录，智能体即可通过 `skill` 工具按名称加载。

## 输出格式（给用户的回复）

- 优先用**单个 Markdown 代码块**给出完整 `SKILL.md`，便于复制保存。  
- 若用户需要「同时生成 reference/example」，可另附第二个代码块或说明可选文件内容。  
- 不要省略 frontmatter；不要省略对 `name` 与目录名一致性的提醒。

## 反例（应避免）

- 仅有 slogan、无步骤；description 过短且无语境触发词。  
- frontmatter 与正文标题不一致；`name` 含空格或下划线（不符合常见约定）。  
- 把本技能用于「执行被生成技能的具体业务」——本技能只负责**撰写技能文件**，不负责执行生成后的领域任务（除非用户另有明确要求）。
