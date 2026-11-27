---
layout: project
title: Ping
role: Mobile / Gameplay Programmer
engine: Unity
languages: C#
team: "Solo"
platform: "Mobile, PC"
project_type: "School project"
duration: "8 weeks, spring 2025"
github_url: https://github.com/Gibraltar-ops/Crypt
itch_url: https://gibraltarops.itch.io/ping
media: /images/ping_gameplay.webp
media_alt: Ping echo-location horror gameplay
highlight:
  text: Tuning the echo wave radius and falloff to find the sweet spot between tension and readability.
  image: /images/ping_highlight.webp
  alt: Echo wave attenuation test
---

## About the Project

Ping is a first-person horror game for mobile where you make your way through a dungeon while being hunted by a monster you can't see. When you tap on a surface, a sphere expands from that spot and lights up the area, leaving some residue behind so you can find your way through the sometimes pitch-black maze. That's also the only way to see the monster, but if you ping too much it figures out where you are, and then you're in trouble. I made the game solo as a school project, using free assets. The hardest part was getting the sonar to work properly.

## What I did

- Built the sonar: a raycast finds where you tapped in the 3D world, and a shader draws the sphere growing out from that point. The longer you hold, the stronger the ping.
- Made the monster AI that patrols, investigates and chases you, and gets more suspicious every time you ping.
- Added a second enemy at the end that only moves when you're not looking at it, like the weeping angels from Doctor Who. Having both them and the invisible monster around at the same time made it really uncomfortable to play.
- Set up the touch controls: standard FPS controls with two touch circles, the left one for moving and the right one for turning the camera.
- Built it for mobile from the start using Unity's mobile settings, and later made a PC version you can play on itch.

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
