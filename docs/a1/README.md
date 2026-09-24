# A1 evidence shots

Drawn by the web build at the commit named in each file's commit, with the
world baked into it (`--baked`), by:

    scripts/region-sheet reedfen docs/a1/reedfen-sheet.png --baked
    scripts/room-shot reedfen:9,3 docs/a1/reedfen-x9y3.png --baked
    scripts/room-shot reedfen:10,3 docs/a1/reedfen-x10y3.png --baked
    node scripts/shot.mjs build/web docs/a1/atlas.png --query "atlas&still" --scale 2 --baked

Placeholder art (A1's palette in world/world.sgl). CC BY 4.0, like the
game's other assets.
