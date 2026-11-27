---
layout: project
title: Tyrant
role: Gameplay Programmer
engine: Unity
languages: C#
project_type: "School project (Yrgo)"
team: "3 programmers: me, [Gustav Engelbrektsson](https://github.com/Klomne) and [Ludvig Orvegård](https://github.com/Orvegaard). 4 artists: [Vincent Meriot](https://vincentmeriot.itch.io), [Felicia Iversen](https://www.artstation.com/feliciaiversen), [Linnéa Löfstrand](https://honeybun-0.itch.io) and [Isabella Johansson](https://bellabooskii.itch.io). Music and sound: Rebecka Kron and Danielle Larsson"
duration: "8 weeks, autumn 2024"
platform: "PC (Windows)"
github_url: https://github.com/Gibraltar-ops/Tyrant-Project
itch_url: https://yrgo.itch.io/tyrant
media: /images/tyrant_gameplay.webp
media_alt: Tyrant tentacle physics gameplay
highlight:
  text: Trying which line renderer logic works best with our intended vision
  image: /images/tyrant_line_test.webp
  alt: Testing line renderer logic
---

## About the Project

Tyrant is a 2D apocalyptic clicker where you play an alien creature floating above the level. When you click on the humans that show up, the creature reaches out with a massive tentacle and eats them. The more people you eat, the more you can upgrade with more tentacles, more HP and new abilities, until enemies show up and try to shoot you down. I was mainly a gameplay programmer on the project. The hardest part was the tentacle IK, since Unity's own IK system comes with a lot of challenges, and I think it was on the fourth try that I finally got it working.

## What I did

- Wrote the `TyrantController`, which is basically the player script for the creature.
- Wrote the `EatManager`, which keeps track of where the tentacles should carry the humans.
- Built the tentacles with joints and IK: an invisible skeleton that moves from one point to another, and a very pimped line renderer on top that follows an invisible IK target to give the illusion of a slithering tentacle.
- Implemented sound and coded in the effects.

<!-- TODO: sections to fill in, then remove the comment markers around them.
     (HTML comments are hidden on the page but visible in the page source.)

## Code

A short description of what the snippet does and why it is interesting.

```csharp
// 10-30 lines of your own code, the most interesting part
```

## What I learned

One or two sentences: what you would do differently next time.
-->
