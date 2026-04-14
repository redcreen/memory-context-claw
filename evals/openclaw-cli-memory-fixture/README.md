# OpenClaw CLI Memory Benchmark Fixture

This fixture mirrors the `umceval` memory set used by the OpenClaw CLI benchmark.

It exists for three reasons:

1. keep the benchmark facts reviewable in-repo
2. make the benchmark matrix readable without digging through session logs
3. document which facts are meant to exercise bootstrap, ordinary retrieval, temporal override, and abstention

The current benchmark still runs against the live `umceval` OpenClaw agent because that is the path the product actually uses.  
These files are the durable mirror of the indexed content that benchmark cases target.

Files:

- `MEMORY.md`: stable identity, preferences, and rules
- `notes/personal-profile.md`: ordinary retrieval facts that should not rely only on bootstrap
- `notes/project-lantern.md`: project knowledge retrieval
- `memory/2026-04-10.md`: older state
- `memory/2026-04-12.md`: current superseding state
