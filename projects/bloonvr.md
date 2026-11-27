---
published: true
layout: project
title: BLOONVR
role: "Gameplay Programmer / Technical Artist"        
engine: "Unity"                                          
languages: HLSL, C#                                   
project_type: "School project (Yrgo)"            # School project / Game jam / Solo project / Released
team: "4 programmers: me, [Niklas Fischer](https://github.com/sweFisch), [Otto Wendt](https://github.com/Hallon14) and [Ludvig Orvegård](https://github.com/Orvegaard)"
duration: "4 weeks, spring 2026"
platform: "VR (Meta Quest 3)"
github_url: https://github.com/Gibraltar-ops/VRProject2026
media: /images/bloonvr_gameplay.webp
media_alt: ""                                       # TODO describe the clip
---

## About the Project

BLOONVR is a VR game where you try to get as high up as possible with your balloon. You have to juggle blowing up new balloons while using a pistol and a seagull bazooka to shoot down your opponents' balloons, and the seagulls that try to pop yours. It was a school project that we kept internal, so it's not on itch. My focus was the clouds and the sense of height, which were both the hardest part and what I'm most happy with.

## What I did

- Wrote a cloud shader in HLSL that paints a shaded cloud that moves and changes shape, and gets less transparent the further up into it you get.
- Wrote custom HLSL to curve the horizon so the world feels like a globe, instead of a square edge below you. Together with distance fog, it made the horizon believable.
- Made the illusion of height: the player never moves from the origin. Instead the ground moves down and scales down the higher you get, while the cloud base moves closer and scales up.
- Kept movement close to the player to a minimum to avoid motion sickness.
- Did the sound, with wind that changes when you're falling, balloon pops, guns, seagulls and music.
- Added haptics when you're in free fall.

<!-- TODO: sections to fill in, then remove the comment markers around them.
     (HTML comments are hidden on the page but visible in the page source.)

## Technical focus: Clouds in HLSL

Problem, what you did, and the result. A before/after image works well here.

![Same view with and without the cloud shader](/images/bloonvr_clouds_before_after.webp)

## Technical focus: Sense of height

How you made the height feel real in VR (and how you avoided motion sickness, if relevant).

## Code

```hlsl
// 20-40 lines: the core of the cloud shader
```

## What I learned

One or two sentences: what you would do differently next time.
-->
