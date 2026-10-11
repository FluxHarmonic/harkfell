# The Harkfell world bible

The prose half of the bible. The data half is `world.sgl` (regions, palette, creatures, the start), and each region's rooms are laid out with one intent each in `regions/<region>.map`, written and ruled before any room in it exists. Every room author reads this file first. Rulings that bind future rooms are copied into **Standing rules** below with their D-number, the day they are made.

This is A1's mini bible: one region, Reedfen, with a placeholder palette. The other regions arrive as their content rows are written (harkfell-design section 8, "A content row").

## Standing rules

These are the six rules proposed in the design (section 8). None is ruled yet; each becomes a numbered ruling when David rules on it.

1. A room has one intent, written in its file and in its region's map, word for word (the gates check that they match).
2. About a third of rooms are breaths: nothing to do but look and listen. The quiet needs empty rooms.
3. No more than three creature kinds in a room.
4. Two fixed moments are never in adjacent rooms.
5. Every hazard is visible before it can touch you.
6. A new traversal idea is introduced in a room where failing costs nothing.

**Grid characters mean physics roles, not looks** (David agreed, 2026-09-24; D-number to come). The alphabet stays small and shared by every region, and each region draws a character its own way:
- `|` is back-layer scenery the body walks through: Reedfen draws reeds, Glasswood will draw birch trunks, the Pipes hanging stone.
- `#`, `%`, `=`, `~`, `x`, `^` and `+` work the same way: the region's tiles decide how each looks.
- Anything that behaves differently (falling icicles, moths, a stone that opens) goes in the room's `things:` with a position, as the ring-stone does, not in a new character.
- A region adds a character only for something with physics of its own: expect one or two per region at most.

**Drop-through** (down and jump on a `=`) is wanted, but waits for the first room that needs a descent through ledges (David, 2026-09-24).

And the rules the gates enforce, so nobody has to remember them:

- **Every standable cell is reachable from the world's start, and the start is reachable from it.** The reach checker proves both with the game's own physics (`scripts/room-check`). A cell you mean to leave out of reach (a ledge seen and never stood on) is declared in the room's `unreached:` list, and the checker then insists it really is unreached.
- **Exits are open edges and must match their neighbour's edge cell for cell.** An edge with no room beyond it is closed, except the top: **a top edge with no room above is open sky** (D28, David, 2026-09-24: "Definitely open sky"). Nothing leaves through it: above the world there is no room, and the body meets the map's edge there. Keep the sky out of a jump's reach anyway (a held jump is 3.25 tiles), so nobody bumps the top of the picture.
- **The region map's joins are the seams.** Two neighbouring rooms are joined in the map (`-` or `|`) exactly when their shared edge has an open cell.
- **Every ring-stone (`o`) is in the room's `things:`** as `(ring-stone at: (C R) overtone: N)`.
- **Every harmonic is reachable, and reachable without itself.** The reach checker searches every set of harmonics a player can carry (A3): a harmonic must be reached with some set, and from where it lies the start must be reachable carrying what you then hold. A cell reached only carrying a harmonic is marked with its digit in the report (gated), and that is fine; a cell reached with no set is red.
- **A harmonic lies on a place to stand** (`(harmonic at: (C R) overtone: N)`, open with rock or a ledge under it), is one its region `gives:`, and lies in one place in the world.
- **Creatures come from the region's roster**, and a room's bed levels name the region's bed channels.

## Authoring notes (what the checker taught while writing Reedfen's first six)

- The envelope, in tiles: a held jump rises 3.25 tiles; a gap of 2 is easy from standing, 3 needs a run and a take-off at the lip, 4 never. A ledge of 3 is reached with a held jump, 4 never.
- **A ceiling over a take-off tile kills a standing jump.** A tile directly above a standing cell leaves 2 px of headroom, so a jump from rest there rises 2 px. A running jump pressed at the lip still clears it: on the take-off tick the body moves out from under a one-tile ceiling before it rises (the checker's `--path` shows it). To close a gap with a ceiling, the ceiling must cover the lip and the gap's first column too.
- A jump needs about 4.2 tiles of headroom (3.25 up plus the body). Under two rows of sky, a jump is cut at once.
- Rough rock (`%`) is held and climbed; smooth rock (`#`) is not. A single smooth wall cannot be climbed by kicking off it. Two smooth walls two tiles apart make a chimney, climbed by kicking between them. Four tiles apart they do not.
- A rough column reaching the floor blocks a walk along that floor; stop it a few rows up and the body jumps to grab it.
- Water deeper than a jump can clear has to be swum; the body leaps out when its head is above the surface, about two tiles.
- **Place a ring-stone as a door, never as a platform.** Put rock directly above it, and a standing place within 4 tiles of it on each side it is approached from. The checker treats a stone keyed to a harmonic you carry as open for the whole search; in play it opens only after you stand or pass within 4 tiles for about a second and a half. A stone you could stand on, or reach only mid-jump, would make the two disagree (A3's review; the Old Stone's door has rock above it).
- A ceiling made of rock hanging down from the top must hang from the top (each rock cell with rock above it), or its underside's tops become standable ledges that the checker will ask you to make reachable.

## Reedfen

**Where.** Low, wide and wet: the fen below the Hollow's rim, where the land gives way to reeds, still pools and brackish channels. The sky is most of the screen. Under the reed beds are hollows among the roots, reached by falling and left by climbing.

**Sound (A2).** Wind across open water, the water itself, the reeds' high band with a slow tremolo, and the drone. Bed channels: `wind`, `water`, `reeds`, `drone`. Rooms set their levels; open rooms are windy, the under-fen is almost still and full of water sound. The mode is Dorian. Fixed moments: `first-open-water` (the Reed Bridge), `frog-choir`, `drowned-bell`; wandering: `reeds-a`, `reeds-b`, `rain-on-reeds`.

**Light.** Pale and cool, low-saturation greens and greys, one warm accent (`ember`): the brackish water, a rusty brown that reads as not to be touched. The palette in `world.sgl` is a placeholder until A4.

**Life.** Reedlings (flocks), bellfrogs (hop, a bell-croak), lantern moths (follow), fen voles (burrow), pike (swim), and the heron-shape (a giant, rare, far off). A3 brings reedlings, bellfrogs and lantern moths to life: reedlings perch on reed tips and lift off when you walk into them, bellfrogs croak and hop away, moths drawn to H2 come to you when you carry it (`drawn: 2`). Voles, pike and the heron are placed but not yet drawn. Carrying H2, reedlings sing back a phrase on D and bellfrogs croak in D.

**Harm.** Brackish water (`x`): touch it and you are back where you entered the room.

**Gives.** H2, found at the region's far end: the Far Mound (x17y3), where A4 moved it from A3's Drowned Channel (for David's ruling, topics/harkfell-a4-region-maps). The Old Stone's ring-stone (x10y3), keyed to H2, is the door to Behind the Stone (x11y3). Behind that door, down at local (14,8) grants the glide on contact (D49); the Cattails' drifting down is atmosphere.

### The first block (A1)

Six rooms at x 8 to 10, y 3 to 4: the surface row runs east from the rim where the Hollow will join; the under-fen row is reached by the hole in the Fen Edge and left by the rough shaft beside it, or by the climb from the Climb Back into the Old Stone. See `regions/reedfen.map` for the intents.

### The far fen (A4)

Fifteen rooms east of the first block, to twenty-two. The surface cannot pass the Old Stone's wall (it hangs from the sky, and Behind the Stone opens only to H2), so the way east goes under it: down the Old Stone's hole, over the Climb Back's shelf, through Under the Stone, and up the Root Stair into the sky behind the wall. The far fen runs east from there: the Frog Choir's pool, the Stepping Stones over brackish water, the Cattails, and the Heron's Water, too wide to cross above; its water goes down into a swim east, which comes up in the Mound's Roots, and they climb to the Far Mound at the world's east edge. Under the surface a second way runs east through the roots, with a loop down to the Drowned Bell. Home is either way.

Three rows: the surface (y 3) is sky and reeds, the under-fen (y 4) is roots and still water, the drowned rooms (y 5) are the old people's steps and the bell they sank. The bounds are x 8 to 17, y 3 to 5.

## Glasswood

**Where.** West of the Hollow and lower, at negative x (bounds x -6 to 0, y 3 to 6): a birch wood caught by an ice storm, every twig sleeved in clear ice. You come down into it through an old amber stone door at Scree End, keyed to H2 (D41). The region's bible and its 22-room map live in the notes (topics/harkfell-glasswood-bible, topics/harkfell-glasswood-map), ruled by David on 2026-09-26 (D41 to D46).

**Written so far (phase 1).** The negative-coordinates probe: The Scree (x0y3), through the door from Scree End, and First Sight (x-1y3), the first room west of x 0. Both are drafts to be redrawn with the rest of the region; their south and west edges stay closed until their neighbours exist. The palette, tiles and bed are the Hollow's placeholders until the look and sound tracks land.

**What the region's rooms may use** (the systems built for it, topics/harkfell-glasswood-systems):
- **Falling ice**, `(icicle at: (C R))` in `things:`: it shivers and rings when you come within four tiles of its column below it, and lands when a runner who kept going would be under it. Hang it from `#` or `%`, over open floor of `#` or `%` with at least one cell to fall, and with a standing place beside its foot: the content gate checks all three.
- **Drop-through**: down and jump on `=` drops through it (the Branch Stair's birch branches).
- **The snow owl** (`snow-owl`, perches and watches you, lifts off if you rush it; carrying H3 it calls a falling fifth) and **the snow vole** (`snow-vole`, comes up when you stand still).
- **`light:`** below 1 for the dark caves, where moths drawn to H3 (`drawn: 3`) light the way.
- **`moment:` as a list**, for the start room's second homecoming (`hollow-fifth`).
- A shut stone whose note you carry calls you from up to three rooms away (D45): no room field; every stone does it.

## The Pipes (0.3)

The approved bible and map are `topics/harkfell-pipes-bible` and
`topics/harkfell-pipes-map` (David approved all six decisions on 2026-10-10).
The 24-room elbow occupies x1..3/y4..5 and x1..6/y6..8. The empty slots
inside its bounds remain sealed reservations; no Underhum or Wrongwater
room is part of this row.

Old Cut's amber door seals the entire shaft. H2 alone reaches every main
Pipes room and returns home: H3 changes moth light rather than terrain.
Every room has H3 moths. The Chalk Door's blue stone opens the optional
Cave Mouth return; its green cave door keeps its own H3 condition.

Static uses fixed `x` cells only in Crackle Step and Broken Choir. Each
lip is at most two tiles, has safe standing banks and four clear rows of
jump headroom. Crackle Step also has an independent dry passage below.
Never place static at a seam, under an entrance drop, beside a door or
pickup, or on a mural's viewing path. The visual tell and positional dry
crackle remain available without H3 and while a moment plays.

New room things:

- `(stone-snail at: (C R))`: a harmless walker confined to its dry floor
  and room. Its local scrape becomes a short H4 shell answer after H4.
- `(mural at: (C R) image: bearers|sealed-bowl|empty-hands|violet-well)`:
  authored images on the wall, with no interaction or required timer.
- `(upward-drip at: (C R))`: an upward-water hint with local H7 hum,
  separate from the harmonic finding targets.
- `(standing-stone at: (C R))`: a local carried-chord source when at least
  two harmonics are carried. It answers at most once every twelve seconds.
- `(stone-passage at: (C R) cells: ((C R) ...))`: an internal reveal linked
  to the ring-stone at that cell. Only interior rock cells may open. Play,
  save restoration and reach use the same geometry.

The bowl keeps its amber (16,8), green (21,8) and blue (23,8) identities.
Blue reveals the enclosed rough stair to rose (21,6); the stair's roof
prevents reaching it from above while green is shut. The pocket beyond
rose stays sealed in 0.3. The new `hollow-octave` moment follows the first
two homecomings. The aurora triggers once per save at home with H2/H3/H4,
in either H3/H4 order. Older version-1 saves without the new `aurora` field
restore with that flag false.

`(harkfell cues)` supplies actual edge openings and fixed static cells for
marks and local sources independently of moth arrival. LOOK owns drawing;
SOUND owns cue/tune assets and their playback. The bed groups are
`(wind water pipes drone)`, with a `pipes` level in every room. The pipe
breaths never sustain D4, leaving that note to H4.

## Cloudstair (0.4)

The approved bible and map are `topics/harkfell-cloudstair-bible` and
`topics/harkfell-cloudstair-map` (David's rulings of 2026-10-11, timed
gusts included). The 22 rooms occupy x7..12/y-2..1; the slots (11,1) and
(12,1) are empty and every edge toward them is shut. The only border is A
(7,1) south over Updraft Edge (7,2), through the launch throat, columns
8-10, behind the Hollow's blue stone. Cloudstair needs H4 and the cattail
down; it adds no H2 or H3 gate.

Vertical routes are earned. Every pair of rooms not joined by the map is
shut by rock, so the only ways up are the lifts (D-H, J-P, K-Q steady `^`;
F-L and M-S pulsed with the gust) and the only ways down are those and the
one-way drops A->B, E->A, G->C, U->O. Each drop lands at least seven tiles
under its opening, which a jump and a wall kick cannot reach. The map's
optional G-M glide and single kick is omitted: with the measured glide a
four-tile glide loses as much height as the jump gains.

The gust: one shared 480-tick clock, calm 0-239, warning 240-299, gust
300-479 ((engine air)). Authored as `(air-field at: (C R) size: (W H)
kind: pulsed-lift|east-gust)` over `^` cells or gap air. The timed lifts
copy SYSTEMS's measured lift fixture: wait on the bank one cell west of
the column, rise 144 px, land on the sill east of it, the field's top 96 px
above the sill. Required lift departures use the first 90 gust ticks,
300-389; a 120-tick calm return departs at 0-180 and finishes before the
gust applies. The gaps (I; P's two) follow David's playtest (2026-10-11):
the challenge is timing the gust, not the footwork. Each is three tiles,
its east bank a tile higher than its west, `x` two rows under the lower
bank, the eastward field over the gap air only. So eastward the gust is
what carries you (a standing take-off window of 15 ticks at the approved
0.8 drift; 5 in calm), and westward, the return, drops easily in calm
(15). Required take-off gates demand at least 15 ticks eastward in gust
and 8 westward in calm, without coyote time:
test/test-cloudstair-takeoff.sgl checks them and rejects a coyote-only
control; tools/cloudstair-takeoff.sgl measures them.
P's middle rest is six tiles, a real run-up. Waits and catches lie outside
every field. `x` appears only in I and P.

New room things:

- `(seed at: (C R) count: N)`: small tufted seeds. Near a `^` they ride it
  (resting low in calm, stirring through the warning, streaming up in the
  gust); on a standable cell they rest, and lift away from a moving body;
  in open air they circle, and part as the body comes near. Drawn from
  time and phase ((harkfell cloudstair look) `cloudstair-seeds`), never a
  platform, never harmful.
- `(down at: (C R))`, the gift behind the first amber H2 door (Behind
  the Stone, Reedfen 11,3, local 14,8): touched after H2 it gives the
  down; drawn until it is yours. An already-earned save keeps the down;
  an unearned save must make that contact. Cattails down is atmosphere.

The look ((harkfell cloudstair look)): every Cloudstair room is outdoors
(its closed top is the shelf above, the sky behind). The cliffs are
painted from global pixels; tops grow dry grass; the backdrop's cloud sea
sinks lower in the higher rooms; a cloud's shadow crosses the stone about
every 40 s. The bed groups are `(wind water air drone)`, with an `air`
level in every room; the bed, moments and wandering pieces are SOUND's.

## Rulings

None yet. They arrive with D-numbers from `topics/harkfell-phase-plan` in the notes.
