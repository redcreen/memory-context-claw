# Subproject Status

## Parent Phase / Milestone

`large project / governed execution / memory-governance`

## Goal

把 memory governance 维持成低成本、可读、可比较的常规维护面。

## Current Slice

`governance signals + promotion helper now stable`

## Done

- formal audit / duplicate audit / conflict audit / governance cycle 已建立
- memory-search governance 已有上下文纯度指标
- `eval:smoke-promotion` 已建立为保守升格建议入口

## In Progress

- 保持治理报告继续可读
- 让 promotion helper 只推荐自然 query，不误推 synthetic 专项 case

## Blockers / Open Decisions

- 是否要把部分高频报告继续区分成 `durable` / `generated` 目录，尚未执行

## Exit Condition

- 治理工具继续稳定输出，且不会反客为主变成新的复杂度来源

## Next 3 Actions

1. 保持 `memory-search governance` 质量指标稳定
2. 继续用 `eval:smoke-promotion` 控制 smoke 面扩张
3. 视需要再做一轮报告职责瘦身
