---
title: "Stupidly stable network replication in Unreal Engine 5.7"
description: "This deep-dive will examine how Card Caboose’s C++ network architecture was designed, implemented and stress tested to survive serious network degradation."
project: Card Caboose
permalink: /blog/stupidly-stable-network-replication/
---

* Table of contents
{:toc}

## Introduction

When developing multiplayer-focused game, network architecture is rarely a one-size-fits-all problem. Shooters and real-time strategy games demand a continuous state synchronization, client-side predictions and a very aggressive interpolation to hide any potential latency. Turn-based games, on the other hand, operates on discrete state-transitions. A player chooses an action, the rules on the server resolves the outcome, and the game advances to the next turn. 

On paper, this makes turn-based networking sound trivial. In practice, introducing hidden information, player social presence and unstable client connections often turns a simple tabletop ruleset into a complicated and fragile system problem. 

Card Caboose, implemented in Unreal Engine 5.7 with the C++ module, is a 2-4 player first-person multiplayer card game developed as a student team project. The players sit around a virtual table in a train cabin as hand muppets and complete over multiple rounds using a golf-style scoring system, where the lowest score wins, separated by a interlude shop featuring drafting and live auctions. So rather than relying on a dedicated backend structure, the game runs on a listen server topology over Steam. This means one player's computer acts simultaneously as an authoritative server and a local client at the same time. Players host and join sessions using a four-character room code and moves between the lobby and the game level via seamless travel; Unreal Engines mechanism for transitioning between levels without disconnecting active network clients. 

<!-- TODO media: Här sätter jag in en gif på en översikt av spelet med flera muppar i bakgrunden och så att man kan även se korthanden samt center pile -->

Designing the network layer for the project required solving two competing demands at the same time. 

* First, the core card game demands strict server authority and information hiding. Every player must observe the same exact same public board state, turn order, and score totals. At the same time private hands, face-down table cards, and deck order must never leak across the network to prevent other clients to read your cards through the memory.  
* Secondly, since the game is meant to be played as a social game with talking across the table, clients will continuously transmit cosmetic proxy data, such as head rotations, pupil tracking, morph targets to simulate when the muppet speaks across Unreals VOIP audio and so on.

Should the continuous social traffik block or delay critical command due to high latency or packet loss, the match would break down. 

This deep-dive will examine how Card Caboose’s C++ network architecture was designed, implemented and stress tested to survive serious network degradation. Rather than simply documenting how it was built, this article will challenge its initial premise: testing whether an event-driven architecture actually works in Unreal Engine 5, exposing workarounds to control cross-actor replication, and weighing its strengths and weaknesses against other alternative multiplayer models. 

## Research Question

To evaluate if an event-driven multiplayer architecture in Unreal Engine 5 can withstand unstable connections without sacrificing responsiveness or anti-cheat guarantees, this project investigates the following primary research question:

*How do you write robust network code for a turn-based game that stays correct under severe network connections such as high latency, packet loss, jitter and disconnects?*

This is a question we need to answer objectively rather than relying on subjective feel. I designed the network layer of Card Caboose around four measurable goals:

1. Public State Integrity: Every connected machine must always converge on the exact same public game state. They all need to display identical face-up cards on the table, the same center pile, the same active plate, and matching score totalts. Even when packetes are delayed, reordered or dropped completely.   
2. Traffic Priority: Continuous cosmetic proxy traffic such as head rotation and voice amplitude for lip syncing, must never starve or block commands critical to the gameplay loop.  
3. Racecondition Resilience: Client-side UI and card animations must never break or desync due to race conditions in RepNotify, Unreals callback mechanism triggered when a replicated variable updates on a client.   
4. Disconnect Recovery: If a client loses connection mid-match, the game must absorb the disconnect without crashing or softlocking the turnloop, allowing the player to rejoin and reclaim their exact state they had within a properly defiance grace period. 

## Scope and Explicit Boundaries

Because Card Caboose runs on a peer-hosted listen server over steam rather than a dedicated cloud infrastructure, two architectural features were intentionally excluded from the scope of the implementation and left as future work:

1. HostMigration: In a listen server setup, the host machine is both the server and an active player. Should the host disconnect or crash, the session will end for all connected clients. Implementing full host migration, meaning choosing a new host and reconstructing the server on a different machine mid-match, falls outside of the scope of this study due to time constraints.   
2. Engine-Level Actor Prioritization and Dormancy: Unreal Engine provides built-in actor bandwidth scheduling through NetPriority, NetUpdateFrequency and network dormancy. This project intentionally tests how far transport-level separation (i.e Reliable vs Unreliable channels) and custom RPC rate-limiting can carry a 4-player game without turning engine-level actor dormancy or priority weights. 

## Research

Designing resilient network layers requires understanding the transport guarantees of the engine. You also need to recognize where these guarantees stop. Unreal Engine 5 ships with a replication framework built originally around fast-paced action games. Adapting it to a turnbased card game handling hidden information and continuous social presence requires finding out how both Unreals networking primates work as well as how alternative multiplayer architectures could solve similar problems. 

### Unreal Engine 5 Network Primitives

At the core of Unreals multiplayer model is server authority. This means that the server holds the absolute truth of the game world. Clients send input requests and then render the replicated outcome. In Card Caboos, this runs on a listen server, where one player’s game instance acts simultaneously as both the authoritative server and a local client. While convenient for peer-to-peer sessions without cloud hosting costs, a listen server introduces an asymmetric quirk: the host executes game logic locally in memory and never triggers RepNotify callbacks, whereas remote clients will have to rely on network replication to trigger those exact same callbacks. 

To sync state and trigger actions across machines, Unreal relies on two primary mechanisms: 

* Remote Procedure Calls (RPCs): Functions invoked on one machine and executed on another. Server RPCs travel from a owning client to the server, here used for player intent such as playing a card or an item, and client RPCs travel from the server to a specific owning client, such as rejecting an invalid move. NetMulticast RPCs broadcast from the server to all connected clients. RPCs are marked either Reliable or Unreliable. Reliable RPCs are guaranteed to arrive and execute in strict FIFO order per actor channel. However, if a packet is dropped, queueing RPCs on that actor must wait for retransmission. This is kinda like standing in line to get served at the bank. On the other hand, Unreliable RPCs are fire-and-forget. Dropped packets are never resent across the network, and the system ties together those packages that actually arrives, making them useful for continuous visual updates.   
* Property Replication and RepNotify: Variables marked with Replicated or Replicated are automatically synced from the server to clients. Unlike Reliable RPCs, property replication is eventually consistent. If a variable changes three times during a burst of packet loss, intermediate values may be skipped and only the latest value is guaranteed to converge. Replication can also be filtered per connection using various conditions. 

Critically, Unreal provides no cross-actor guarantee for ordering during property replication. If the server changes the game state as well as the player state in the exact same fram, those updates may arrive on a client in separate packets and in arbitrary order. 

## Evaluating Alternative Multiplayer Architecture

Before committing to a custom hybrid model in Unreal C++, four established multiplayer architectures were evaluated against our games constraints: 

<!-- TODO media: Jämföresel table mellan tick-base snapshot sync, deterministic lockstep, pure event sourcing, websocket back och vårt spels hybrid -->

1. Tick-Based Snapshot Syncronization: Unreals default architecture for shooters and action games. The server replicates actor transforms and states at a fixed tick rate while clients interpolate between snapshots. This is naturally self-healing against packet loss, however continuous ticking wastes bandwidth during idle turn deliberation. Also, raw state snapshots tells a client what the board looks like right now, not how it got there. This makes card-flight animations impossible without an accompanying event history.   
2. Deterministic Lockstep: Mostly used in RTS games, where every client runs a identical simulation and exchanges only player input. The bandwidth usage is minimale, however lockstep requires bit-exact determinism across platforms and stalls every player whenever the slowest connection lags. Above all, lockstep is fundamentally incompatible with hidden-information card games: every client must hold the complete deck and opponent hand in local memory to simulate the game, making memory-reading cheats trivial.   
3. Pure Event Sourcing: Every state mutation is transmitted as an ordered stream of Reliable events, where clients reconstruct the game state by replaying the log from start to finish. This guarantees exact animation order and effortless backtracks, it is very susceptible to packet loss. If a single event is corrupted or dropped out of sequence, every subsequent state transition breaks. This would require late-joining and reconnecting clients to replay the entire match history or request a full state snapshot, making it potentially data heavy.   
4. Dedicated HTTP/WebSocket Backend: Industry standard for pure 2D/3D card game like Hearthstone or Marvel Snap. Here, the game lives in a cloud database and trunks are resolved via stateless web requests. This makes reconnects trivial and allows matches to survive even if all players disconnect simultaneously. However, decoupling game logic into a web backend would sacrifice Unreals 3D spatial replication, VOIP routing, and low latency streaming. This is something we would not want to cut out of our game. 

Comparing these models revealed that a pure RPC-driven architecture would suffer from the same fragility as pure event source, while pure tick-based replication would lack the discrete event context needed for card animation. So instead, Card Caboose tests a three-class hybrid architecture. 

Class 1 \- Gameplay Intent: Sparse, reliable server RPCs carrying minimal identifiers rather than the games raw state. 

Class 2 \- Authoritative State: Eventually consists of property replication, acting as the single source of truth, paired with a 16-entry sequenced ring buffer strictly for driving animations forward. 

Class 3 \- Cosmetic Proxy Traffic: Frequency capped quantized Unreliable RPCs for social presence, allowing cosmetic updates to drop freely without ever blocking gameplay commands. 

<!-- TODO media: Arkitektturdiagram för att beskriva de tre olika nätverksklasserna. -->

## The Process

To keep network authority clean and allow the team to construct UI, card visuals and 3D interactions without touching replication plumbing, the games C++ architecture was structured around a strict separation of responsibilities. The structure can be compared with referee with a rulebook. Reading from the rulebook, the referee is the only one allowed to change anything. The only thing the clients see is the scoreboard. 

The Rulebook comprises of the CardRulesLibrary. It is a stateless blueprint function library containing pure validation functions. Because the exact same C++ functions run on both the owning client and the server, rule logic is never duplicated. Passive card effects are strictly prohibited from holding internal states or randomness. This makes it so that the client and server always evaluate identical inputs identically. 

The Referee in this case is the CardTurnManager. It is as server-only Actor Component attached to the games standard gamemode. It does not run on tick, all transitions are driven by engine timers. When a card or item is triggered, the turn manager delegates execution to the effect queue, a server-side FIFO queue capped at 200 effects per resolution chain to prevent infinite loops. 

The Scoreboard is the gamestate and playerstate. They’re replicated actors visible to clients. The game state holds shared match data such as phase, turn order, pile count, countdown deadline and ring buffers. The player state stores per-player dedicated zone, gold, scores, items, seating index and flags used for reconnectin. 

The RPC Gateway exposes the gameplay-related RPCs for both the server and the targeted client RPCs. 

<!-- TODO media: Här kan jag lägga in ett diagram för spelets C++ server only klasser, ägandeklienter, och sådana som är recplicerade över alla -->

## Anti-Cheat with Replication Filtering

In a multiplayer card game where you need to prevent memory-reading cheats at the replication layer, the private data actually never leaves the server. The players hand is replicated using COND\_OwnerOnly, meaning remote clients only receive information about the amount of cards in a players hand, and their card backs are rendered via a display component. 

Cards in the deck and the facedown table cards, are not replicated at all. Clients receive only integer counters, and it is up to the server to keep that hidden information still hidden. When a player draw a card from the deck or the trash pile, it is delivered stripped from identity data, transmittiong only the card count so that opponents cannot inspect drawn cards. At the same time, clients never send card structs or indices in the Server\_PlayCards function, they transmit only TArray\<int32\> unique instance IDs, forcing the server to look up the actually card instances itself. 

## Action lifecycle

When a player drags a card onto the center pile, the drag component runs a local state machine consisting of Idle-\>Dragging-\>Committed \| Returning-\>Idle. If the rules library approves of the move, the card enter Committed and Server\_PlayCards is invoked as the final call. This is required because a listen-server host executes the RPC synchronously in the same call stack. 

None of the server RPCs use Unreals WithValidation keyword, which automatically kicks clients upon validation failure. Under 200ms latency, honest clients acting on slightly stale states may legitimately submit a move that became invalid milliseconds earlier. Instead, the Turn Manager responds with a soft Client\_ActionRejected RPC, smoothly returning the committed card to the players hand backed by a 3-second clientside timeout fallback. Similarly, turn timers replicate only the server time and countdown, while the server grants a timeout grace buffer behind the visual deadline. This makes last-second plays to survive any potential network jitter. 

In the inter-round shop, live auctions prevent doublecharging during simultaneous bids by requiring clients to pass the ExpectedBid while deducting active bids via the amount of reserved gold. 

Because the game and player state replicate on independent actor channels, clients frequently receive updates out of order during packetloss and jitter. During development this caused cards to pop into a players hand before the flight animation had started, and animations to trigger before the center pile array updated. Instead of fighting the transport layer to enforce ordering across actors, the client was redesigned around independent receivers: 

* PostRepNotifies. Inside the gamestate, when the card moves it does not immediately broadcast its animation. It set a boolean called bCardMovesDirty to true. Unreal invokes PostRepNotifies after all properties on the actor have updated in that network bunch. This makes sure that the center pile state is consistent before entries and the broadcasted moves are dispatched to a move queue. Once the queue finished animating the local display pile it snaps the visuals to the authoritative replicated pile.   
* Listenserver parity. Because a listen-server host never trigger OnRep callbacks, every server state mutation ends with a NotifyStateChanged which calls a forced netupdate for remote clients while manually updating the game state and a new cardmove delegates locally on the host. 

```cpp
// ACardGameState.cpp — Batching RepNotifies and maintaining listen-server parity
void ACardGameState::OnRep_CardMoves()
{
    bCardMovesDirty = true;
}

void ACardGameState::PostRepNotifies()
{
    Super::PostRepNotifies();

    if (bCardMovesDirty)
    {
        bCardMovesDirty = false;
        BroadcastNewCardMoves(); // Dispatches only entries where Seq > LastBroadcastCardMoveSeq
    }
}

void ACardGameState::NotifyStateChanged()
{
    ForceNetUpdate();

    // Listen-server host never receives OnRep callbacks; broadcast locally
    if (GetNetMode() == NM_ListenServer)
    {
        OnGameStateUpdated.Broadcast();
        BroadcastNewCardMoves();
    }
}
```

## Proxy Traffic and VOIP Travel Crashes

Social presence runs across three Unreliable proxy components with the SkipOwner condition. Hand IK, head rotation and morph target replication. Because Unreliable packets never trigger retransmissions, continuous proxy traffic cannot cause lineblocking on RPCs that need to be Reliable.

This carried with it some difficulties. Testing packaged builds over Steam uncovered an audio-thread crash during seamless travel. The root cause was because of two things: Unreals VOIP listener components lack an owning actor and outlive the EndPlay function during the level teardown, and the listen server host always arrived in the match level first. When it did so, it activated voice channels when the remote clients were still inside the transition map, causing the program to crash. This was solved through suppressing voice activation until all client controllers reported to the listen server that their client had completely loaded into the world. 

## Results

To evaluate the state convergence and bandwidth consumptiong objectively without altering gameplay or replication behaviour, I implemented a passive instrumentation subsystem. This was built specifically for this study. Through console activation each game process, both on the host and connected clients, writes a separate CSV log recording and logging the State rows as well as the NETSTAT rows. The State rows sampled every frame whenever the public state hash changed, logging the gamephase, active player ID, turn number and the center pile card count. The NETSTAT is instead sampled once per second per connection, recording ping, incoming/outgoing bandwidth and dropped packet counts.

Using this I set up six test profiles defined by Unreals Network Emulation console variables to simulate different connection issues during gameplay: PktLag, PKTLagVariance, PktLoss, PktOrder, and PktDup. 

Profile A: No emulation, the local baseline. Here I wanted to validate hash parity, propagation, delay, and idle/active bandwidth.

Profile B: PktLag. This profile measure state convergence and turn delay under high latency. 

Profile C: PktLag \+ PktLagVariance \+ PktLoss. This profile measure the amount of reliable retransmissions, crossactor ordering and hand arrivals.

Profile D: extreme lag, PktLoss and PktOrder. This profile wants to pinpoint the breaking point of where the game is in a state of nonfunctioning due to network issues. 

Profile E: Disconnecting and rejoining. This profile covers if the code is able to reclaim the players UniqueNetID and restore the player to the gameloop without stalling other players.

Profile F: Basically, Profile C settings with all proxy components disabled. This profile is aimed at measuring the bandwidth share of social proxy traffic and its potential impact on gameplay latency. 

## Reflection

The initial thesis behind this game was that a turn-based game could avoid Unreals tick-based replication overhead by relying on an event-driven RPC model. Looking at the finished C++ architecture, this turned out to be only half true. Wile incoming player intent is strictly driven by RPCs, outgoing state syncronization relies on standard Unreal property replication on the gamestate and the player state, which is fundamentally eventually consistent state syncronization. 

A pure RPC or event-sourced model would have been far too fragile to packet loss. Is a single state mutating event were to be dropped or arrived out of order, the client states would diverge permanently. Also, pure property replication lacked the discrete historical context required to animate sequentially. What made the game resilient was the threeclass hybrid. Reliable RPCs for intent, replicated properties as the single source of truth, and a ring buffer for driving visual presentation. 

Combining the replication with animation events brought a significant tax. Because Unreal provides no cross-actor delivery ordering between the game state and the player state, a large portion of the client codebase exists only to absorb out-of-order updates. 

Had the game been built as a traditional 2D card game backed by an WebSocket server, the entire board state could have been serialized as a single JSON payload per turn, elminiating a lot of the workarounds I had to take to achieve this network code. Yet as the game is a first person 3D tabletop game requiring realtime spatial VOIP, eye tracking and hand IK, staying inside the Unreal Replication ecosystem made this complex hybrid a worthwhile tradeoff. 

## Known flaws and limitations

Running on a player-hosted listen server means the host constantly operates at 0ms. This gives them a slight timing advantage during last-second plays. And if the host disconnects or crashes, this kills the entire session. 

We never tuned NetPriority and NetUpdateFrequency, and had to rely exclusively on the Reliable/Unreliable channel separation. While this was sufficient for four plays, scaling this model up would require a lot of extra work. 

## This I wish I had time for

Since we want to move Card Caboose to a commercial release, I would have liked to have time to transition to dedicated server. Because the rule validation system and turn authority are already decoupled from rendering, migrating from a listen server to dedicated servers would eliminate the host latency advantage and disconnection challenges. However this is at the moment not possible. 

If we were to retain peer-hosted sessions, it would be beneficial for the project if we could implement host migration. However this would mean I would have to serialize both the game state as well as all all individual playerstate inventories including their hidden decks into a backup snapshot, which at the moment is a bit too time-consuming.  

## In Conclusion

Ultimately, writing robust network code for a turnbased multiplayer game in Unreal Engine 5 is not about eliminating stat replication in favor of pure events. It is about separating truth from separation. By treating Reliable RPCs strictly as player intent, keeping authoritative game state inside filtered replicated properties such as OwnerOnly, isolating social proxy data on Unreliable channels and building independent receivers on the client, the end result turned our game into a predictable tabletop experience. With extra complexity from cross-actor syncronization workarounds and the tradeoffs from using a listen-server, this three-class hybrid architecture provides a solid resistant foundation that stays responsive under high latency and provides scaleable systems for potential future dedicated server support.

All in all, the dream scenario of creating a 100% stable networking system is nearly unachievable. In the end, the player running the listen server will always have a slight advantage vs. clients connecting to it remotely. But through workarounds and hybrid setups you can set up network code in a way that still might be favorable to most of the players. Using the system implemented here allows for the stability of games running coop without a hitch. If you however, would like to implement this in a competitive environment such as Fortnite or Counterstrike, everybody but the player running the host machine are going to have a baaaad time. 
