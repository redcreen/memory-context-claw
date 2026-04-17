# OpenClaw CLI Memory Benchmark Fixture

This fixture is the source-of-truth workspace used by the hermetic OpenClaw CLI benchmark.

It exists for four reasons:

1. keep the benchmark facts reviewable in-repo
2. make the benchmark matrix readable without digging through session logs
3. document which facts are meant to exercise bootstrap, ordinary retrieval, temporal override, and abstention
4. provide a stable workspace snapshot that can be copied into isolated host temp states or Docker containers

The hermetic benchmark no longer seeds from `~/.openclaw`.
Instead, the runner copies this fixture into a fresh OpenClaw state, indexes it there, and then clones a clean state per case.

That same fixture is also the intended input for the Docker-based OpenClaw eval harness.

Files:

- `MEMORY.md`: stable identity, preferences, and rules
- `notes/personal-profile.md`: ordinary retrieval facts that should not rely only on bootstrap
- `notes/project-lantern.md`: project knowledge retrieval
- `memory/2026-04-10.md`: older state
- `memory/2026-04-12.md`: current superseding state
