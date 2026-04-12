# Reflection System Architecture

[English](reflection-system.md) | [中文](reflection-system.zh-CN.md)

## Purpose

`Reflection System` transforms normalized source artifacts into governed learning and memory candidates.

It is the layer that answers:

`what should this system consider worth learning, observing, or promoting?`

## What It Owns

- event labeling
- pattern extraction
- candidate builders
- evidence scoring
- reflection run outputs

## What It Does Not Own

- raw source ingestion
- stable artifact persistence
- export projection
- final governance approval

## Reflection Principles

1. structured, not free-form
2. evidence-based, not imaginative
3. reviewable, not hidden
4. degradable, not permanent by default

## Core Flow

```mermaid
flowchart LR
    A["Source artifacts"] --> B["Event labeling"]
    B --> C["Pattern extraction"]
    C --> D["Candidate builders"]
    D --> E["Evidence scoring"]
    E --> F["Candidate artifacts"]
    F --> G["Memory Registry"]

    classDef core fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A,B,C,D,E,F,G core;
```

## Main Candidate Types

- `stable_fact_candidate`
- `stable_preference_candidate`
- `stable_rule_candidate`
- `habit_signal_candidate`
- `behavior_pattern_candidate`
- `observation_candidate`
- `open_question_candidate`

## Reflection Questions

The system should answer fixed questions such as:

- what was explicitly reinforced?
- what repeated today?
- what was verified again?
- what stayed uncertain?
- what added noise?
- what deserves promotion review?

## Input Contract

Consumes:

- normalized source artifacts
- source scope and visibility metadata
- optional prior registry state for comparison

## Output Contract

Produces:

- candidate artifacts
- scoring metadata
- evidence references
- reflection run summary

## Dependency Rules

- depends on `Source System`
- writes to `Memory Registry`
- should not depend on adapter-specific behavior

## Initial Build Boundary

The first implementation wave should support:

1. event labeling contract
2. basic candidate builders
3. evidence scoring inputs
4. reflection run report shape

## Done Definition

This module is ready for implementation when:

- candidate taxonomy is frozen
- evidence inputs are documented
- reflection questions are explicit
- outputs are testable and replayable
