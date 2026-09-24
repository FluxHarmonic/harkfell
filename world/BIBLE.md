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

And the rules the gates enforce, so nobody has to remember them:

- **Every standable cell is reachable from the world's start, and the start is reachable from it.** The reach checker proves both with the game's own physics (`scripts/room-check`). A cell you mean to leave out of reach (a ledge seen and never stood on) is declared in the room's `unreached:` list, and the checker then insists it really is unreached.
- **Exits are open edges and must match their neighbour's edge cell for cell.** An edge with no room beyond it is closed, except the top: **a top edge with no room above is open sky** (David, 2026-09-24: "Definitely open sky"; its D-number comes with the phase plan). Nothing leaves through it: above the world there is no room, and the body meets the map's edge there. Keep the sky out of a jump's reach anyway (a held jump is 3.25 tiles), so nobody bumps the top of the picture.
- **The region map's joins are the seams.** Two neighbouring rooms are joined in the map (`-` or `|`) exactly when their shared edge has an open cell.
- **Every ring-stone (`o`) is in the room's `things:`** as `(ring-stone at: (C R) overtone: N)`.
- **Creatures come from the region's roster**, and a room's bed levels name the region's bed channels.

## Authoring notes (what the checker taught while writing Reedfen's first six)

- The envelope, in tiles: a held jump rises 3.25 tiles; a gap of 2 is easy from standing, 3 needs a run and a take-off at the lip, 4 never. A ledge of 3 is reached with a held jump, 4 never.
- **A ceiling over a take-off tile kills the jump.** A tile directly above a standing cell leaves 2 px of headroom: no jump from there at all. Keep the last tile before a gap open above.
- A jump needs about 4.2 tiles of headroom (3.25 up plus the body). Under two rows of sky, a jump is cut at once.
- Rough rock (`%`) is held and climbed; smooth rock (`#`) is not. A single smooth wall cannot be climbed by kicking off it. Two smooth walls two tiles apart make a chimney, climbed by kicking between them. Four tiles apart they do not.
- A rough column reaching the floor blocks a walk along that floor; stop it a few rows up and the body jumps to grab it.
- Water deeper than a jump can clear has to be swum; the body leaps out when its head is above the surface, about two tiles.
- A ceiling made of rock hanging down from the top must hang from the top (each rock cell with rock above it), or its underside's tops become standable ledges that the checker will ask you to make reachable.

## Reedfen

**Where.** Low, wide and wet: the fen below the Hollow's rim, where the land gives way to reeds, still pools and brackish channels. The sky is most of the screen. Under the reed beds are hollows among the roots, reached by falling and left by climbing.

**Sound (A2).** Wind across open water, the water itself, the reeds' high band with a slow tremolo, and the drone. Bed channels: `wind`, `water`, `reeds`, `drone`. Rooms set their levels; open rooms are windy, the under-fen is almost still and full of water sound. The mode is Dorian. Fixed moments: `first-open-water` (the Reed Bridge), `frog-choir`, `drowned-bell`; wandering: `reeds-a`, `reeds-b`, `rain-on-reeds`.

**Light.** Pale and cool, low-saturation greens and greys, one warm accent (`ember`): the brackish water, a rusty brown that reads as not to be touched. The palette in `world.sgl` is a placeholder until A4.

**Life.** Reedlings (flocks), bellfrogs (hop, a bell-croak), fen voles (burrow), pike (swim), and the heron-shape (a giant, rare, far off). None moves until A3; rooms name them so placement can be reviewed.

**Harm.** Brackish water (`x`): touch it and you are back where you entered the room.

**Gives.** H2, found at the region's far end, and the cattail down (the glide) after it.

### The first block (A1)

Six rooms at x 8 to 10, y 3 to 4: the surface row runs east from the rim where the Hollow will join; the under-fen row is reached by the hole in the Fen Edge and left by the rough shaft beside it, or by the climb from the Climb Back into the Old Stone. See `regions/reedfen.map` for the intents.

## Rulings

None yet. They arrive with D-numbers from `topics/harkfell-phase-plan` in the notes.
