# Unified Memory Core Release Boundary

[English](#english) | [中文](#中文)

## English

## Purpose

This note defines what is released as product core, what stays adapter-specific, and what is intentionally deferred.

## Current Release Unit

Current release unit:

- one repo
- one package
- product core and adapters shipped together

## Product Release Boundary

The product boundary includes:

- contracts
- source / registry / reflection / projection / governance
- standalone runtime
- standalone command surfaces
- independent execution review

## Adapter Release Boundary

Adapter boundary includes:

- OpenClaw runtime integration
- Codex runtime integration
- adapter-specific compatibility tests

## Deferred Beyond This Boundary

- runtime API service
- multi-host network service
- advanced self-learning policy adaptation
- host-side invasive changes

## Split Rule

A repo split is allowed only when:

- portable contract paths remain stable
- standalone commands continue to work without adapter coupling
- adapters can consume exports without redefining product-core behavior

## 中文

## 目的

这份说明用来明确：哪些内容属于产品 core 发布边界，哪些保留为 adapter 专属边界，哪些明确延后。

## 当前发布单元

当前发布单元是：

- 单仓
- 单 package
- product core 与 adapters 一起发布

## Product Release Boundary

产品边界包含：

- contracts
- source / registry / reflection / projection / governance
- standalone runtime
- standalone command surfaces
- independent execution review

## Adapter Release Boundary

adapter 边界包含：

- OpenClaw runtime integration
- Codex runtime integration
- adapter-specific compatibility tests

## 明确不在本边界内

- runtime API service
- 多主机网络服务
- 高阶 self-learning policy adaptation
- 宿主侧侵入式修改

## Split Rule

只有在以下条件满足时才允许拆分仓库：

- portable contract 路径保持稳定
- standalone commands 继续能在不依赖 adapter coupling 的情况下运行
- adapters 继续通过 exports 消费能力，而不是重定义 product core 行为
