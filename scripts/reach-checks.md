Run the shipped 0.5 reach scope from the repository root, inside the native
runtime environment, after building the release executable:

```
scripts/dev node scripts/reach-checks.mjs build/reach-parallel --jobs 4
scripts/dev node scripts/reach-checks.mjs build/reach-serial --serial
node scripts/reach-checks.mjs --compare build/reach-serial build/reach-parallel
```

Run expensive checks on build hosts. `--jobs` bounds independent checks; each
target profile additionally starts its existing three search workers. Budget
memory for each simultaneous regional search and reserve cores for other work.
`--serial` uses the original unfiltered timing matrix, followed by outside and
the two target profiles. Parallel timing slices use the same isolated rooms,
all 32 carry/down profiles and all 480 phases. No search assertion changes.

The combined PASS is specifically the 0.5 scope: 256 authored timing rows, the
107-room outside view without down/H5 and with its named exclusions, and both
525-cell/480-entry-phase profiles. Full Cloudstair cell returns remain deferred.
Target checkers must retain their raw exit 2 and incomplete marker; their
qualified target-only assertion is the same one used by the existing gate.

To distribute work, pass disjoint comma-separated check IDs with `--only`:
`targets-2-4`, `targets-2-3-4`, `outside`, and `timing-NAME`, where NAME is one of
`F-L`, `M-S`, `I-east`, `I-west`, `P-west-gap-east`, `P-west-gap-west`,
`P-east-gap-east`, `P-east-gap-west`. Each host uses the same source tree and
pinned toolchain. Fetch each complete evidence directory, then run:

```
node scripts/reach-checks.mjs --collect build/shard-a build/shard-b
```

A shard reports `complete=false` and cannot independently qualify the release.
Collection requires all eleven checks exactly once, matching source manifests,
valid raw log hashes and re-evaluated assertions. Failed, timed out, missing,
duplicate or corrupt results fail the gate. Evidence directories must be new.
Receipts record source and executable hashes, arguments, raw exits and wall
seconds. SIGINT/SIGTERM stop only the process groups this runner launched.

Comparison checks every timing row and the complete outside/target logs,
including search counters and the checker's scope labels. Only measured
outside elapsed seconds and RSS numbers are normalized. Physics-independent
scheduler, corruption and negative-result controls run with:

```
node --test scripts/test-reach-checks.mjs
```
