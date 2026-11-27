---
published: true
layout: project
title: Dungeon Runner
role: "Game designer, game programmer" 
engine: SDL3
languages: C++
github_url: https://github.com/Gibraltar-ops/DungeonRunner
project_type: "School project (Yrgo)"   
team:
  Programmers: "Me, [Gustav Engelbrektsson](https://github.com/Klomne)"
duration: "6 weeks, autumn 2026"
platform: "PC (Windows)"
itch_url: https://gibraltarops.itch.io/dungeon-runner
media: /images/dungeonrunner_gameplay.webp
media_alt: ""                                       # TODO describe the clip, e.g. "Player pushing crates onto goal tiles"
---

## About the Project

Dungeon Runner is a top-down 2D Sokoban runner. Every time you take a step, the enemies take one or more steps too, so you have to puzzle your moves together to make it through the level. One wrong move and the monsters get you. We built it from scratch in C++ and SDL3, all the boilerplate included. Getting the enemies' movement logic in and writing an A* algorithm that actually worked was the big challenge, but it's also what I'm most happy with.

## What I did

- Designed and programmed the enemies:
  - one that follows an A* path and takes a step toward you every time you move
  - a faster one that takes two steps for every one of yours
  - one that moves in straight lines all the way, like a rook in chess, and gets you if you walk into its line of sight, so you have to block it to get past
  - a giant one that takes up four tiles and still finds its way to you with A*
- Wrote the A* pathfinding, including the version for the big 2x2 enemy.
- Designed the levels and the step-based movement.

<!-- TODO: sections to fill in, then remove the comment markers around them.
     (HTML comments are hidden on the page but visible in the page source.)

## Technical focus: Title

Problem, what you did, and the result.

## Code

A short description of what the snippet does and why it is interesting.

```cpp
// 10-30 lines of your own code, the most interesting part
```

## What I learned

One or two sentences: what you would do differently next time.
-->
