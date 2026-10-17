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
Outside uses eight geometry workers by default; `--outside-workers 0..10`
controls that count independently of `--jobs`. Its parent applies answers in
the original order. Pure anchor answers can be reused across carries only
when tracked tiles and the complete physics context still match; original
search counters and assertions remain intact. Worker count is recorded and
bound into outside cache keys and strict collection. Serial mode always uses
zero outside workers and never reuses a verdict cache.
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

Verdict caching adds a fresh whole-world parse/map/seam preflight to every run.
The native checker emits each analysis scope from the same room selectors it
uses for physics. Cached physics is keyed by those rooms' bytes, every authored
pickup/down supplier across regions, global layout and metadata, checker and
toolchain sources, executable hash, complete profile, arguments and environment.
An unrelated room edit can reuse unaffected physics after the global preflight
passes. A new/removed/moved room changes the topology and invalidates every key.

Immediately after a successful native release build, bind it to its inputs:

```
node scripts/reach-checks.mjs --record-build
scripts/dev node scripts/reach-checks.mjs build/reach-cold --cache build/reach-verdict-cache
scripts/dev node scripts/reach-checks.mjs build/reach-warm --cache build/reach-verdict-cache
node scripts/reach-checks.mjs --compare build/reach-cold build/reach-warm
```

Changing native source requires rebuilding and recording the new build.
Cache files store their complete input descriptor and raw evidence; corrupt or
failed entries cannot supply a hit. New run receipts retain the original verdict
and its provenance while binding it to the current validated world. Collection
recomputes cache keys and revalidates the fresh preflight as well as every result.
Cache writes are atomic and occur only after unchanged inputs are confirmed.
Keep cache directories beside the validation evidence; they can be shared by
hosts using the exact same executable and inputs. Serial reference mode always
executes its checks without a cache.

Run cache invalidation/negative controls on a build host with
`node --test scripts/test-reach-cache.mjs`. For the real-world cold/warm gate and
native room, cross-region ability, checker and parse controls, use a clean,
isolated checkout with a freshly attested release build:

```
scripts/dev node scripts/gate-reach-cache.mjs build/cache-validation --sabotage
```

The native controls restore all edited source and the original executable. They
prove a blocked lift and a rebuilt checker with an impossible gust go red after
cache misses, moving Reedfen's down forces a fresh Cloudstair check, a stale
checker build is refused, and malformed content cannot hide behind a cache hit.
