# Source System Architecture

[English](source-system.md) | [中文](source-system.zh-CN.md)

## Purpose

`Source System` defines how controlled inputs enter `Unified Memory Core`.

It is responsible for making source ingestion:

- explicit
- repeatable
- inspectable
- replayable

## What It Owns

- source registration
- source manifests
- source-type adapters
- normalization
- fingerprinting
- source snapshots for replay

## What It Does Not Own

- reflection logic
- candidate promotion
- stable-memory lifecycle
- tool-specific export logic

Those belong to:

- `Reflection System`
- `Memory Registry`
- `Projection System`

## Supported Source Classes

1. conversations
2. files
3. directories
4. URLs
5. images
6. manual CLI input
7. future structured imports

## Required Properties

Every source must be:

- declared
- typed
- scoped
- timestamped
- fingerprinted
- attributable to one importer path

## Core Flow

```mermaid
flowchart LR
    A["Declared source"] --> B["Source adapter"]
    B --> C["Normalization"]
    C --> D["Fingerprinting"]
    D --> E["Source manifest"]
    E --> F["Source artifact"]
    F --> G["Reflection System"]

    classDef src fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef core fill:#e8f1ff,stroke:#2563eb,color:#0f172a,stroke-width:1.6px;
    class A,B,C,D,E,F,G core;
```

## Main Submodules

### 1. Source registration

Responsible for:

- accepting declared inputs
- assigning source ids
- recording source type and scope

### 2. Source adapters

Responsible for:

- reading raw source content
- extracting structured source payloads
- preserving source metadata

### 3. Normalization

Responsible for:

- converting heterogeneous inputs into one normalized shape
- preserving traceability back to raw origin

### 4. Fingerprinting

Responsible for:

- change detection
- deduplication support
- replay support

## Input Contract

The minimum source registration contract should include:

- `source_id`
- `source_type`
- `declared_by`
- `scope`
- `visibility`
- `created_at`
- `fingerprint`
- `locator`

## Output Contract

The minimum source artifact should include:

- `artifact_id`
- `source_id`
- `normalized_payload`
- `raw_metadata`
- `fingerprint`
- `ingest_run_id`
- `created_at`

## Dependency Rules

- `Source System` must not depend on reflection rules
- it may depend on shared contracts and utilities
- all downstream systems consume source artifacts, not raw inputs

## Initial Build Boundary

The first implementation wave should support:

1. file input
2. directory input
3. conversation input
4. manual CLI input

URL and image adapters can follow after the contract is stable.

## Done Definition

This module is ready for implementation when:

- source manifest schema is documented
- adapter responsibilities are explicit
- replay and fingerprint rules are explicit
- module test surfaces are defined
