# Harkfell 0.4 release checklist and notes

Prepared 2026-10-14 for David's review, following Leader 07:38 and 07:42.
This is preparation. Master, push, tag and deploy remain at the HARD STOP
until David gives the ship instruction on a green gate.

## Snapshot

- Engine package: `9ef1079720275413549ce470679cc9b7cb7f6aa1`.
- Local integration merge: `25a20a8bc43d21af1af8a9b0b81bafc3fe273080`, no conflicts.
- Entrance case/control: `2e9bd555459fa51f61c67ed7d24edb968ab2571c`.
- Hollow pocket exclusion removed: `b76d41929305f945092e91a98ebf097517ed29da`.
- Begin/place fixture isolation: `673b0d64f2938aaa9c664d75f9d3fb358081ab7f`;
  previously validated 744/744 on the isolated 2fe snapshot.
- Candidate gate SHA: the preparation commit recorded in the task Session Log.
  Any later tracked change produces a new gate SHA; run the receipt suite at
  that final SHA. Do not substitute an earlier suite receipt.
- Version: `0.4.0`; Sigil remains pinned to `0.22.10`, with the existing lock.

## Exact reach claim for the release notes

every reached (cell, carry, down) in Cloudstair has a proven timed return for the (2 4)+down entry; outside rooms checked spatially for players without down or H5

The Cloudstair return proof selects one actual retained landing per reached
cell/carry/down. It does not cover every position or phase within a cell.
The outside check seals Cloudstair and excludes states that require its route,
H5 or down. Hollow x7y2's steady air-field room is diagnostic, not a spatial
acceptance verdict. The Hollow rose pocket has its separate timed proof.
Whole-world timed progression is not a 0.4 gate.

Landing cap **N: pending the complete exp-35 final landing count L**.
Set `N = 1000 * ceil(1.25 * L / 1000)` and record both L and N in the
final release notes/receipt in the task Session Log and the durable
`build/restart-cloudstair-20261012/release-receipt.json` before the ship.
These evidence updates do not change the settled source SHA. This is a resource cap. Reaching it
FAILs; a timeout or per-search bound stop is inconclusive and cannot PASS.
The existing 13,104 target-loop count is not the final drain count.

## Required evidence before David's final go

- [ ] Engine build and gate-flag equivalence, exp-38: 9ef1079's flags match
  c730ba0's knobs on the bounded comparison. A bounded comparison alone is
  not a complete regional PASS.
- [ ] Exp-35, (2 4)+down c1: complete target loop, entry phases, coverage and
  cell-return drain; no unreached cells, traps, cap hit or incomplete search.
- [ ] Record the complete final L, compute N by the rule above, and confirm
  that the cap does not affect the accepted complete result.
- [ ] Glue plant, exp-34: nonzero exit and named
  `RED region-trap ... cell (63 . 41) ... exhausted #t`.
- [ ] Outside check and pit plant rerun by the perf worker on the settled
  final SHA: PASS for the approved scope and explicit air-room diagnostic.
  The temporary no-H5 view adds only Hollow (20,6), with its reason and timed
  bowl receipt named on the verdict. No exclusion is added with H5. The old
  exp-36 world receipt does not carry over to this changed world.
- [ ] Pit plant: nonzero exit naming `reedfen:10,4` and trap floors
  `(19,9) (20,9) (21,9) (22,9)`.
- [x] Hollow timed positive: home (15,8) to pocket (20,6), then a return
  starting from that exact arrival body/carry/down/phase.
- [x] Hollow negative: (2 4 5)+down blocked by green; opening only green
  produces a real-body bypass. No bound hit can count as the negative PASS.
- [x] Authored x4y3 stale exclusion and 0.3 text removed; all seams unchanged.
- [x] Focused entrance file: 7/7 on b76d419, including (2 3)+down and the
  opened-blue control. Final-snapshot suite still required.
- [ ] Full suite on the final gate SHA, with fetched JSON and verified hash;
  all sixteen no-down carry sets reach no Cloudstair room.
- [ ] Parse/map/seam: 104 rooms, no problems on the final world.
- [ ] Existing content, movement, save, audio, look and sky gates green.
- [ ] 122,880-case matrix receipt: 8 legs * 32 profiles * 480 ticks;
  no timing-window failures, stranded landings or required-return failures.
- [ ] Web build at the final gate SHA; staged tree and verify-site receipt
  agree with that SHA and its manifest. Keep the accepted existing browser
  startup follow-up separate from a new release regression.
- [ ] David reviews the public post and this precise claim, then gives the
  final ship instruction on the green evidence.

Expected package verdicts (fill in the measured N):

```text
PASS Cloudstair regional replay: 0 failures (final full-world progression NOT established) [profiles: (2 4)+down] [landing cap <N>] [cell returns: one retained landing per reached (cell, carry, down) proven to return]
PASS room-check outside Cloudstair [without down, without Cloudstair's harmonics (H5), Cloudstair sealed] [excluded: hollow:4,3 (20,6), H5-only, timed bowl gate af83a32]: 82 rooms, parse seams map reach green [diagnostic only, not counted: hollow:7,2, 1 problems]
```

All reach legs use:

```sh
export SIGIL_GC_HEAP_GROW_FACTOR=1.3
export SIGIL_YOUNG_THRESHOLD=524288
export SIGIL_YOUNG_THRESHOLD_MAX=524288
```

One leg per 16 GB runner. The gate command is:

```sh
harkfell --room-check --cloudstair-region --carry 2,4 --cell-returns --landing-cap "$N" --workers 3
```

## After the ship

The (2 3 4)+down c1 leg confirms after the ship, about 01:00. If it names a
trap, it becomes 0.4.1. Phase/position traps beyond the cell-return claim and
whole-world timed progression remain follow-up work for 0.5.

## Public notes and David's deploy command

Public post: [news/harkfell-0-4.md](../news/harkfell-0-4.md). It tells returning
players to earn the down Behind the Stone, rather than at the old Cattails
location. Their already earned down and existing save progress remain.

After the final HEAD is built remotely and the tree is staged and verified:

```sh
bash scripts/publish-0-4 "$GATE_SHA" "$STAGED_TREE"
```

That defaults to the existing publisher's dry run. Only after the green
checklist and David's final go does David run:

```sh
bash scripts/publish-0-4 "$GATE_SHA" "$STAGED_TREE" --publish
```

The script delegates to the existing manifest/HEAD-checked preview, live
verification and production publisher. It does not merge, push or tag.
If a master merge changes HEAD, rebuild/stage/verify at that new HEAD and
record its gate receipt before publishing. Native archives, if included,
follow the existing tag-dependent release-archives procedure after the STOP.
