---
layout: project
title: Card Caboose
role: Network & Gameplay Programmer
engine: Unreal Engine 5.7
languages: C++
project_type: "Degree project (Yrgo)"
team: "2 programmers: me and [Gustav Engelbrektsson](https://itch.io/profile/klomne). 2 artists: [Abbe Elf](https://www.artstation.com/abbeelf) and [Felicia Iversen](https://www.artstation.com/feliciaiversen)"
duration: "8 weeks, autumn 2026"
platform: "PC (Steam, coming later)"
blog_url: /blog/stupidly-stable-network-replication/
media: /images/cardcaboose_gameplay.webp
media_alt: Hand muppets playing cards around a table in a train cabin
---

## About the Project

Card Caboose is a 2–4 player multiplayer card game where you sit around a table in a train cabin as hand muppets and talk to each other over voice chat while you play. I was in charge of the network code, and instead of picking one network model I took the best parts from a few of them and put together my own hybrid. The hardest part was getting the turn manager to stay in sync over the network, and putting out all the fires that came with it.

## What I did

- Wrote the network layer in C++, running on a listen server over Steam.
- Built the turn manager that decides which player is allowed to do what.
- Set up the basic card rules and the system around them.
- Made the base for the card controls and the shop between rounds.
- Replicated the muppets' head movement and hooked up the voice chat to their morph targets, so the muppet talks when the player talks.
- Worked with our artist Abbe Elf to get the code working on his meshes and control rigs, including the IK that made the characters look twisted and blocky.
- Set up the code structure for the main menu and settings.
