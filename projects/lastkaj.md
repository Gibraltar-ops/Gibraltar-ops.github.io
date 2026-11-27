---
layout: project
title: Lastkaj 0
role: Creative Lead/Gameplay Programmer/Designer/ SFX/VFX / UX/UI
engine: Unreal Engine 5
languages: C++ / Visual Scripting
project_type: "School project (Yrgo)" 
team:
  Programmers: "Me, [Otto Wendt](https://gphallon.itch.io), [Ludvig Orvegård](https://github.com/Orvegaard)"
  Artists: "[Abbe Elf](https://www.artstation.com/abbeelf), [Felicia Iversen](https://www.artstation.com/feliciaiversen), [Tinn Golubović](https://www.artstation.com/tinngolubovic), [Vincent Wennerström](https://www.artstation.com/vincentwennerstrom)"
duration: "8 weeks, spring 2025"
platform: "PC (Windows)"
itch_url: https://yrgo.itch.io/lastkaj-0
media: /images/lastkaj_gameplay.webp
media_alt: Lastkaj 0 gameplay preview
highlight:
  text: Juicing up VFX and animations.
  image: /images/lastkaj_highlight.webp
  alt: Weapon mechanic testing
---

## About the Project

Lastkaj 0 is a first-person puzzle game set in the veins of Portal. You play a dock worker in the port of Gothenburg, going into contaminated containers where you bend gravity on yourself and on other objects to retrieve what you came for. I was the creative lead, which meant I held the vision and had the final say on design, even though we worked agile and a lot of decisions were made fast by each of us to keep the project moving. What I'm happiest with is how well the gravity shift actually works.

## What I did

- Built the gravity shift in C++, including flipping the controls so the game plays the same no matter which way is down.
- Made footsteps that follow the animations, plus sound effects and volumes in MetaSounds that change based on what you're doing and where you are.
- Hooked up the artists' VFX in the game.
- Worked on the UI with a focus on readability, so you find the right thing fast without getting frustrated.
- Tried to build a cable that pulls you back out of the containers. It ended up too buggy to work properly and was cut (more below).

## Technical focus 1: The Procedural Cable System

Although it ultimately didn't make the final vertical slice release, I spent significant development time architecting a functional procedural cable/tether system which was supposed to physically pull the player out of the levels instead of teleporting them. While the mechanics of it was fun and intuitive, it had to be cut from the final build due to time constraints.

<!-- Här vill jag ha in en gif på kabeln -->

## Technical focus 2: Interactive background in the main menu

I collaborated with the teams graphical artists to create a moving background the main menu instead of a static picture. Here, I coded a water shader creating procedural waves in Unreals visual scripting language Blueprints. The results were very satisfying!

<!-- Här vill jag ha in en gif på vattnet-->

<!-- TODO: sections to fill in, then remove the comment markers around them.
     (HTML comments are hidden on the page but visible in the page source.)

## Code

A short description of what the snippet does and why it is interesting.

```cpp
// 10-30 lines of your own code, the most interesting part
```

## What I learned

One or two sentences: what you would do differently next time.
-->
