---
name: studyplan-usage
description: 指导何时及如何调用 save_plan、read_plan、delete_plan 工具。适用于用户说「保存计划」「读取计划」「删除计划」「采纳」「确定」等计划级操作场景。
---

# StudyPlan 工具使用指南

## 工具与触发场景

| 工具 | 触发关键词 | 典型用户表述 |
|------|------------|--------------|
| **save_plan** | 保存、采纳、确定、就这个 | 「确定」「就这个」「好，保存」「采纳这个计划」 |
| **read_plan** | 读取、看看、检查、已有 | 「读取 Go 学习计划」「看看之前的计划」「检查已保存的计划」 |
| **delete_plan** | 删除、删掉、不要 | 「删掉这个计划」「删除 xxx 计划」「不要这个计划了」 |

## 调用规则

1. **制定新计划前必读**：用户要求创建/制定新计划时，**第一个动作**是静默调用 read_plan（不传 plan_title）列出已有计划，再决定如何继续。禁止先输出「我先检查一下」再调用。
2. **修改计划前必读**：用户要求修改/更新已有计划时，先 read_plan(plan_title) 读取内容，再根据用户需求调整。
3. **save_plan 参数**：plan_title（如「Go语言学习计划」）、content（完整 Markdown 计划内容）。
4. **修改 vs 更新**：「修改」= 调整现有内容；「更新」「延伸」= 在现有基础上追加。

## 数据形态

- 计划为 Markdown 文档，存于 `study_plans/{session}/{title}/{timestamp}/Study_Plan.md`
- 支持多版本（按 timestamp 区分）
