---
title: Harkfell 0.1.1
date: 2026-09-26
version: 0.1.1
summary: Footsteps and splashes now sound the moment they happen, and the creature climbs paw over paw.
---

Harkfell 0.1.1 is out! It's a small release, but it fixes the two things I noticed most when I played 0.1 on my phone.

## Sounds on time

In 0.1, footsteps, jumps, splashes and the creatures' calls reached your ears a little after the thing that made them, about a tenth of a second late. That doesn't sound like much, but in a game about listening you can *feel* it: your feet and their sound didn't quite line up.

Now every one of those sounds plays the moment it happens, in the browser and on the desktop. They used to wait in line behind a buffer of audio, and now they're mixed straight into the output as soon as the game asks for them. Everything still sounds the same as before, just on time.

They're also ready from the very first step. The game now prepares them while the title screen waits for you, instead of all at once as the world fades in, so your first jump makes its sound like every other one, and a slower phone no longer crackles while the game gets its sounds ready.

## Climbing

The creature has had a little climbing animation since the beginning, paw over paw up a rough rock face, but a bug meant it never actually played! You'd hold on to the wall and slide up it frozen in place. Now it climbs the way it was drawn to, and it holds still when you stop.

## Also in this release

- The game is a much smaller download, so it starts sooner, especially on a phone.
- The fullscreen button shows its icon in every browser. In some it was an empty box.
- If you run Harkfell on your desktop from the source, it now pauses when you switch to another window, the same way the browser version pauses when you switch tabs, and the window sizes itself correctly on high-resolution displays.

You can play it right now at [harkfell.com/play](/play/). Your save from 0.1 carries over, so you can pick up right where you left off.

Let me know what you hear!
