# Governance System Architecture

[English](governance-system.md) | [中文](governance-system.zh-CN.md)

## Purpose

`Governance System` keeps the product:

- reviewable
- repairable
- replayable
- regression-protected

## What It Owns

- audit surfaces
- repair flows
- replay flows
- diff / comparison views
- regression ownership

## What It Does Not Own

- source ingestion
- candidate extraction
- adapter runtime behavior

## Core Governance Capabilities

1. audit
2. repair
3. replay
4. diff / history
5. regression baselines

## Core Flow

```mermaid
flowchart LR
    A["Registry / exports"] --> B["Audit"]
    B --> C["Findings"]
    C --> D["Repair"]
    D --> E["Replay"]
    E --> F["Regression result"]

    classDef ops fill:#fff4e8,stroke:#d97706,color:#7c2d12,stroke-width:1.6px;
    class A,B,C,D,E,F ops;
```

## Required Properties

Every governance action should be:

- attributable
- reproducible
- diffable
- non-destructive by default

## Dependency Rules

- consumes from `Memory Registry` and `Projection System`
- informs adapters and product operators
- should remain independent from one specific consumer

## Initial Build Boundary

The first implementation wave should support:

1. audit report shape
2. repair record shape
3. replay run shape
4. regression ownership map

## Done Definition

This module is ready for implementation when:

- governance primitives are explicit
- repair boundaries are explicit
- replay inputs and outputs are explicit
- test ownership is explicit
