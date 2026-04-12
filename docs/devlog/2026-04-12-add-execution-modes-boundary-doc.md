# Add Execution Modes Boundary Doc

## Why

The repository already documented standalone mode, independent execution, and the OpenClaw adapter separately, but there was still one repeated confusion:

`if the core can run independently, who owns memory search after independence?`

That question could not be answered cleanly by pointing at only one existing document.

## What Changed

- added a dedicated architecture document for execution modes and memory-search responsibility boundaries
- included three mode diagrams:
  - current embedded / OpenClaw mode
  - today's standalone core mode
  - later service mode
- added a responsibility matrix that separates host, consumer / adapter, and core ownership

## Outcome

There is now one architecture page that explains:

- what independence means today
- what it does not mean yet
- why query-time memory search is still a consumer responsibility
