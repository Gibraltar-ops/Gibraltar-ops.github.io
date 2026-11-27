---
title: "Stupidly stable network replication in Unreal Engine 5.7"
description: "This deep-dive examines how Card Caboose's C++ network architecture was designed, implemented, and stress-tested to survive serious network degradation."
project: Card Caboose
permalink: /blog/stupidly-stable-network-replication/
---

* Table of contents
{:toc}

## Introduction

When developing multiplayer-focused games, network architecture is rarely a one-size-fits-all problem. Shooters and real-time strategy games demand continuous state synchronization, client-side prediction, and aggressive interpolation to hide latency. Turn-based games, on the other hand, operate on discrete state transitions: a player chooses an action, the rules on the server resolve the outcome, and the game advances to the next turn.

On paper, this makes turn-based networking sound trivial. In practice, introducing hidden information, player social presence, and unstable client connections often turns a simple tabletop ruleset into a complicated and fragile systems problem.

*Card Caboose*, implemented in Unreal Engine 5.7 with a custom C++ module, is a 2–4 player first-person multiplayer card game developed as a student team project. Players sit around a virtual table in a train cabin as hand muppets and compete over multiple rounds using a golf-style scoring system, where the lowest score wins, separated by an interlude shop featuring drafting and live auctions. Rather than relying on dedicated backend infrastructure, the game runs on a listen-server topology over Steam. This means one player's computer acts simultaneously as the authoritative server and a local client. Players host and join sessions using a four-character room code and move between the lobby and the game level via seamless travel—Unreal Engine's mechanism for transitioning between levels without disconnecting active network clients.

<!-- FIGURE 1: Gameplay GIF showing the first-person tabletop view with hand muppets in the background, the player's card hand, and the center pile -->

Designing the network layer for the project required solving two competing demands at the same time:

- **Strict server authority and information hiding:** Every player must observe the exact same public board state, turn order, and score totals. At the same time, private hands, face-down table cards, and deck order must never leak across the network, preventing clients from reading opponents' cards through local memory.
- **Continuous social presence:** Because the game is designed around table talk, clients continuously transmit cosmetic proxy data—such as head rotations, gaze tracking, and morph targets that animate when a muppet speaks over Unreal's VOIP audio. Should this continuous social traffic block or delay gameplay-critical commands due to high latency or packet loss, the match would break down.

This deep-dive examines how *Card Caboose*'s C++ network architecture was designed, implemented, and stress-tested to survive serious network degradation. Rather than simply documenting how it was built, this article challenges its initial premise: testing whether an event-driven architecture actually works in Unreal Engine 5, exposing the workarounds required to control cross-actor replication, and weighing its strengths and weaknesses against alternative multiplayer models.

## Research Question

To evaluate whether an event-driven multiplayer architecture in Unreal Engine 5 can withstand unstable connections without sacrificing responsiveness or anti-cheat guarantees, this project investigates the following primary research question:

**How do you write robust network code for a turn-based game that stays correct under severe network conditions such as high latency, packet loss, jitter, and disconnects?**

To answer this question objectively rather than relying on subjective feel, I designed the network layer of *Card Caboose* around four measurable goals:

1. **Public State Integrity:** Every connected machine must always converge on the exact same public game state—displaying identical face-up cards on the table, the same center pile, the same active player, and matching score totals—even when packets are delayed, reordered, or dropped completely.
2. **Traffic Priority:** Continuous cosmetic proxy traffic, such as head rotation and voice amplitude for lip-syncing, must never starve or block commands critical to the gameplay loop.
3. **Race Condition Resilience:** Client-side UI and card animations must never break or desync due to race conditions in `RepNotify`, Unreal's callback mechanism triggered when a replicated variable updates on a client.
4. **Disconnect Recovery:** If a client loses connection mid-match, the game must absorb the disconnect without crashing or soft-locking the turn loop, allowing the player to rejoin and reclaim their exact state within a defined grace period.

### Scope and Explicit Boundaries

Because *Card Caboose* runs on a peer-hosted listen server over Steam rather than dedicated cloud infrastructure, two architectural features were intentionally excluded from the scope of the implementation and left as future work:

1. **Host Migration:** In a listen-server setup, the host machine is both the server and an active player. Should the host disconnect or crash, the session ends for all connected clients. Implementing full host migration—electing a new host and reconstructing the server on a different machine mid-match—falls outside the scope of this study due to time constraints.
2. **Engine-Level Actor Prioritization and Dormancy:** Unreal Engine provides built-in actor bandwidth scheduling through `NetPriority`, `NetUpdateFrequency`, and network dormancy. This project intentionally tests how far transport-level separation (Reliable vs. Unreliable channels) and custom RPC rate-limiting can carry a 4-player game without tuning engine-level actor dormancy or priority weights.

## Research

Designing resilient network layers requires understanding the transport guarantees of the engine—and recognizing where those guarantees stop. Unreal Engine 5 ships with a replication framework built originally around fast-paced action games. Adapting it to a turn-based card game handling hidden information and continuous social presence requires examining how Unreal's networking primitives work as well as how alternative multiplayer architectures solve similar problems.

### Unreal Engine 5 Network Primitives

At the core of Unreal's multiplayer model is **server authority**: the server holds the absolute truth of the game world, while clients send input requests and render the replicated outcome. In *Card Caboose*, this runs on a **listen server**, where one player's game instance acts simultaneously as both the authoritative server and a local client. While convenient for peer-to-peer sessions without cloud hosting costs, a listen server introduces an asymmetric quirk: the host executes game logic locally in memory and never triggers `RepNotify` callbacks, whereas remote clients rely on network replication to trigger those exact same callbacks.

To sync state and trigger actions across machines, Unreal relies on two primary mechanisms:

- **Remote Procedure Calls (RPCs):** Functions invoked on one machine and executed on another. `Server` RPCs travel from an owning client to the server (used here for player intent such as playing a card or an item), `Client` RPCs travel from the server to a specific owning client (such as rejecting an invalid move), and `NetMulticast` RPCs broadcast from the server to all connected clients. RPCs are marked either `Reliable` or `Unreliable`. Reliable RPCs are guaranteed to arrive and execute in strict FIFO order per actor channel. However, if a packet is dropped, queued RPCs on that actor must wait for retransmission—much like standing in line to get served at the bank. On the other hand, Unreliable RPCs are fire-and-forget: dropped packets are never resent across the network, making them ideal for continuous visual updates.
- **Property Replication and `RepNotify`:** Variables marked with `Replicated` or `ReplicatedUsing` are automatically synced from the server to clients. Unlike Reliable RPCs, property replication is eventually consistent: if a variable changes three times during a burst of packet loss, intermediate values may be skipped and only the latest value is guaranteed to converge. Replication can also be filtered per connection using conditions such as `COND_OwnerOnly` and `COND_SkipOwner`.

Critically, Unreal provides **no cross-actor guarantee for ordering** during property replication. If the server changes `ACardGameState` as well as `ACardPlayerState` in the exact same frame, those updates may arrive on a client in separate packets and in arbitrary order.

### Evaluating Alternative Multiplayer Architectures

Before committing to a custom hybrid model in Unreal C++, four established multiplayer architectures were evaluated against our game's constraints:

<!-- FIGURE 2: Comparison table evaluating Tick-Based Snapshot Sync, Deterministic Lockstep, Pure Event Sourcing, HTTP/WebSocket Backend, and Card Caboose's Hybrid Model -->

1. **Tick-Based Snapshot Synchronization:** Unreal's default architecture for shooters and action games. The server replicates actor transforms and state at a fixed tick rate while clients interpolate between snapshots. While naturally self-healing against packet loss, continuous ticking wastes bandwidth during idle turn deliberation. Also, raw state snapshots tell a client what the board looks like right now, not how it got there—making card-flight animations impossible without an accompanying event history.
2. **Deterministic Lockstep:** Mostly used in RTS games, where every client runs an identical simulation and exchanges only player input. Bandwidth usage is minimal, but lockstep requires bit-exact determinism across platforms and stalls every player whenever the slowest connection lags. Above all, lockstep is fundamentally incompatible with hidden-information card games: every client must hold the complete deck and opponent hands in local memory to simulate the game, making memory-reading cheats trivial.
3. **Pure Event Sourcing:** Every state mutation is transmitted as an ordered stream of Reliable events, where clients reconstruct the game state by replaying the log from start to finish. While this guarantees exact animation order and effortless replays, it is highly susceptible to packet loss: if a single event is corrupted or dropped out of sequence, every subsequent state transition breaks, requiring late-joining and reconnecting clients to replay the entire match history or request a heavy full-state snapshot.
4. **Dedicated HTTP/WebSocket Backend:** The industry standard for pure 2D/3D card games like *Hearthstone* or *Marvel Snap*, where the game lives in a cloud database and turns are resolved via stateless web requests. This makes reconnects trivial and allows matches to survive even if all players disconnect simultaneously. However, decoupling game logic into a web backend would sacrifice Unreal's 3D spatial replication, VOIP routing, and low-latency streaming—core pillars of *Card Caboose*'s social table experience.

Comparing these models revealed that a pure RPC-driven architecture would suffer from the same fragility as pure event sourcing, while pure tick-based replication would lack the discrete event context needed for card animations. Instead, *Card Caboose* tests a **three-class hybrid architecture**:

- **Class 1 – Gameplay Intent:** Sparse, `Reliable` `Server` RPCs carrying minimal identifiers rather than raw game state.
- **Class 2 – Authoritative State:** Eventually consistent property replication acting as the single source of truth, paired with a 16-entry sequenced ring buffer strictly for driving animations forward.
- **Class 3 – Cosmetic Proxy Traffic:** Frequency-capped, quantized `Unreliable` RPCs (`COND_SkipOwner`) for social presence, allowing cosmetic updates to drop freely without ever blocking gameplay commands.

<!-- FIGURE 3: Architecture diagram illustrating the three network traffic classes -->

## The Process

To keep network authority clean and allow the team to construct UI, card visuals, and 3D interactions without touching replication plumbing, the game's C++ architecture was structured around a strict separation of responsibilities. The structure can be compared to a referee with a rulebook: reading from the rulebook, the referee is the only one allowed to change anything, and the only thing the clients see is the scoreboard.

- **The Rulebook (`UCardRulesLibrary`):** A stateless `UBlueprintFunctionLibrary` containing pure validation functions. Because the exact same C++ functions run on both the owning client and the server, rule logic is never duplicated. Passive card effects are strictly prohibited from holding internal state or randomness so that client and server always evaluate identical inputs identically.
- **The Referee (`UCardTurnManager`):** A server-only `UActorComponent` attached to the game's `ACardGameMode`. It does not run on tick; all transitions are driven by engine timers. When a card or item is triggered, the turn manager delegates execution to `UCardEffectQueue`, a server-side FIFO queue capped at 200 effects per resolution chain to prevent infinite loops.
- **The Scoreboard (`ACardGameState` and `ACardPlayerState`):** Replicated actors visible to clients. `ACardGameState` holds shared match data such as phase, turn order, pile counts, countdown deadlines, and the `RecentCardMoves` ring buffer. `ACardPlayerState` stores per-player card zones, gold, scores, items, seating index, and flags used for reconnection.
- **The RPC Gateway (`ACardPlayerController`):** Exposes the 13 gameplay-related `Reliable` `Server` RPCs alongside targeted `Client` RPCs.

<!-- FIGURE 4: Architecture diagram mapping C++ classes across Server-Only, Owning Client, and Replicated All -->

### Anti-Cheat with Replication Filtering

In a multiplayer card game, preventing memory-reading cheats starts at the replication layer so that private data never leaves the server:

- A player's `Hand` is replicated using `COND_OwnerOnly`, meaning remote clients only receive `HandCount` and render card backs via `UCardHandDisplayComponent`.
- Cards in the `Deck`, `FaceDown` table cards, and `GarbagePile` are not replicated at all; clients receive only integer counters (`DeckCount`, `FaceDownCount`, `GarbagePileCount`).
- When a player draws a card from the deck or garbage pile, `RecordCardMove` strips card identity data, transmitting only the card count so opponents cannot inspect drawn cards.
- Clients never send card structs or array indices in `Server_PlayCards`; they transmit only `TArray<int32>` unique instance IDs, forcing the server to look up the actual card instances itself.

### Action Lifecycle

When a player drags a card onto the center pile, `UCardDragComponent` runs a local state machine (`Idle` → `Dragging` → `Committed` \| `Returning` → `Idle`). If `UCardRulesLibrary` approves the move locally, the card enters `Committed` and `Server_PlayCards` is invoked as the final call—an ordering detail required because a listen-server host executes the RPC synchronously in the same call stack.

<!-- FIGURE 5: Flowchart of a card play from EndDrag through Server_PlayCards to either animation or Client_ActionRejected -->

None of the `Server` RPCs use Unreal's `WithValidation` keyword, which automatically kicks clients upon validation failure. Under 200 ms latency, honest clients acting on slightly stale state may legitimately submit a move that became invalid milliseconds earlier. Instead, `UCardTurnManager` responds with a soft `Client_ActionRejected` RPC, smoothly returning the committed card to the player's hand, backed by a 3-second client-side `CommitTimeout` fallback. Similarly, turn timers replicate only the server deadline and duration, while the server grants a `0.5s TimeoutGrace` buffer behind the visual deadline so last-second plays survive network jitter.

In the inter-round shop (`UCardShopComponent`), live auctions prevent double-charging during simultaneous bids by requiring clients to pass `ExpectedBid` while deducting active bids via `GetReservedGold()`.

Because `ACardGameState` and `ACardPlayerState` replicate on independent actor channels, clients frequently receive updates out of order during packet loss and jitter. During development, this caused cards to pop into a player's hand before the flight animation had started, and animations to trigger before the center pile array updated. Instead of fighting the transport layer to enforce ordering across actors, the client was redesigned around order-independent receivers:

- **`PostRepNotifies()` Batching:** Inside `ACardGameState`, `OnRep_CardMoves` does not immediately broadcast its animation; it sets `bCardMovesDirty = true`. Unreal invokes `PostRepNotifies()` after all properties on the actor have updated in that network bunch, ensuring the center pile state is consistent before moves with `Seq > LastBroadcastCardMoveSeq` are dispatched to `UCardMoveQueue`. Once the queue finishes animating its local `DisplayPile`, it snaps visuals to the authoritative replicated pile via `Reconcile()`.
- **Listen-Server Parity (`NotifyStateChanged`):** Because a listen-server host never triggers `OnRep_*` callbacks, every server state mutation ends with `NotifyStateChanged()`, which calls `ForceNetUpdate()` for remote clients while manually broadcasting `OnGameStateUpdated` and new `OnCardMove` delegates locally on the host.
- **Token Arrival Gate (`UCardHandArrivals`):** Synchronizes incoming `Hand` updates on `ACardPlayerState` with move animations on `ACardGameState` via a ticket counter (`Tokens` + `1.5s RevealTimeout`), ensuring cards reveal in the exact same sequence regardless of packet arrival order.

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

<!-- FIGURE 6: Sequence diagram showing the cross-actor race condition resolved by PostRepNotifies and UCardHandArrivals -->

### Proxy Traffic and VOIP Travel Crashes

Social presence runs across three `Unreliable` proxy components using `COND_SkipOwner`: `UCardHandIKComponent`, `UUSocialReplicationComponent` (head gaze and quantized `uint8` voice amplitude), and `UCardLeanComponent` (`FVector_NetQuantize10`). Because `Unreliable` packets never trigger retransmissions, continuous proxy traffic cannot cause head-of-line blocking on `Reliable` gameplay RPCs.

Testing packaged builds over Steam uncovered an audio-thread crash during seamless travel (`VoipListenerSynthComponent still registered after world cleanup`). The root cause was twofold: Unreal's VOIP listener components lack an owning actor and outlive `EndPlay` during level teardown, and the listen-server host always arrived in the match level first—activating voice channels while remote clients were still inside the transition map. This was solved by unregistering lingering listener components during `FWorldDelegates::OnWorldCleanup` and suppressing voice activation (`ClientEnableNetworkVoice_Implementation`) until all client controllers report `HasClientLoadedCurrentWorld()` to the host.

<!-- FIGURE 7: Screenshot of the UE 5.7 packaged build crash log during seamless travel -->

<!-- FIGURE 8: GIF showing the muppets' head gaze, leaning, hand IK, and VOIP lip-sync in action -->

## Results

To evaluate state convergence and bandwidth consumption objectively without altering gameplay or replication behavior, I implemented a passive instrumentation subsystem (`UCardNetMetricsSubsystem`). Activated via console variables (`card.NetMetrics 1` and `card.NetMetricsMark`), each game process—both host and connected clients—writes a separate CSV log recording `STATE` rows and `NETSTAT` rows. `STATE` rows are sampled every frame whenever the deterministic public state hash (`ComputePublicStateHash`, which hashes only public integers and booleans sorted by `PlayerId` while omitting private hands) changes, logging the phase, active player ID, turn number, and center pile card count. `NETSTAT` rows are sampled once per second per connection, recording round-trip latency (`AvgLagMs`), incoming/outgoing bandwidth (`KB/s`), and dropped packet counts.

Using this subsystem, I set up six test profiles using Unreal's Network Emulation console variables (`NetEmulation.PktLag`, `PktLagVariance`, `PktLoss`, `PktOrder`, and `PktDup`) to evaluate connection behavior during active gameplay:

- **Profile A (Baseline):** No emulation, validating hash parity, propagation delay, and baseline bandwidth.
- **Profile B (High Latency):** Added `PktLag` to measure state convergence and turn propagation delay under elevated latency.
- **Profile C (Lag + Jitter + Loss):** Combined `PktLag`, `PktLagVariance`, and `PktLoss` to stress reliable retransmissions, cross-actor ordering, and `UCardHandArrivals`.
- **Profile D (Extreme Emulation):** Heavy latency, packet loss, and packet reordering (`PktOrder`) to test stability near failure thresholds.
- **Run E (Heaviest Sustained Packet Loss):** Extreme packet loss (~1,000 dropped packets in 96 seconds) in a 3-player PIE session. *(Note: Because PIE instances share a single `UniqueNetId` under the `NULL` Online Subsystem, live Steam `UniqueNetId` disconnect/rejoin testing across separate machines remains separate from PIE telemetry.)*
- **Profile F (Proxy Traffic Isolation):** Back-to-back 3-player sessions comparing social proxy components enabled versus disabled (both during idle table deliberation and active card play) to isolate proxy bandwidth share and latency impact.

### Emulated Stress Test Results (3-Player Sessions)

Five 3-player PIE sessions (one listen-server host and two remote clients) were recorded across Profiles A–E and evaluated strictly during active match phases (`Phase >= 1` after seamless travel):

| Test Run | Matched Match Hashes | Final Hash Parity (All 3) | State Delay (Median / Max) | Extra Client Intermediate States | Measured RTT `AvgLagMs` (Mean / Max) | Bandwidth per Client (Down / Up KB/s) | Window Packets Lost (Down / Up) |
|---|---|---|---|---|---|---|---|
| **Profile A (Baseline)** | 100% (31/31) | Yes (`09E4B89A`) | 11.5–23.5 ms / 41.3 ms | 0 | 21.4 ms / 34.2 ms | 2.07 / 3.05 KB/s | 0 / 0 |
| **Profile B (High Latency)** | 100% (17/17) | Yes (`EF80AED6`) | 248.3–257.9 ms / 300.7 ms | 0 | 496.4 ms / 625.6 ms | 1.66 / 2.81 KB/s | 0 / 0 |
| **Profile C (Lag + Jitter + Loss)** | 100% (30/30) | Yes (`D597FC1E`) | 346.2–351.3 ms / 1,951.5 ms | 2–4 | 725.5 ms / 1,074.2 ms | 1.44 / 2.85 KB/s | 259–278 / 352–389 |
| **Profile D (Extreme Emulation)** | 97.4–100% (37–38/38) | Yes (`188AB13B`) | 295.4–298.0 ms / 1,356.0 ms | 2 | 632.8 ms / 1,473.9 ms | 1.81 / 2.81 KB/s | 499–533 / 556–590 |
| **Run E (Heaviest Packet Loss)** | 96.6% (28/29) | Yes (`3B6981A8`) | 296.4–302.4 ms / 9,118.4 ms | 6–7 | 582.0 ms / 799.3 ms | 1.75 / 3.12 KB/s | 916–952 / 1,181–1,203 |

<!-- FIGURE 9: Screenshot of side-by-side Host and Client CSV logs displaying matching StateHash sequences -->

<!-- FIGURE 10: Side-by-side GIF comparing a card play at baseline vs. high latency, plus a rejected card snapping back -->

<!-- FIGURE 11: Chart comparing median and maximum state propagation delay across Profiles A–E -->

### Proxy Traffic Isolation (Profile F: Social Replication On vs. Off)

To quantify the exact bandwidth footprint of `UUSocialReplicationComponent`, `UCardLeanComponent`, and `UCardHandIKComponent` and verify whether they affect state propagation latency, two 3-player sessions were recorded back-to-back with social proxy replication toggled on and off:

| Configuration | Activity State | Client Downstream (InKBps) | Client Upstream (OutKBps) | Median State Propagation Delay | Matched Hashes |
|---|---|---|---|---|---|
| **Social Replication ON** | Idle | 1.20 KB/s | 1.77 KB/s | — | — |
| **Social Replication ON** | Active Play | 1.25 KB/s | 1.79 KB/s | 10.6–21.3 ms | 100% (10/10) |
| **Social Replication OFF** | Idle | 1.04 KB/s | 1.62 KB/s | — | — |
| **Social Replication OFF** | Active Play | 1.08 KB/s | 1.61 KB/s | 9.1–20.9 ms | 100% (15/15) |

<!-- FIGURE 12: Bar chart comparing client downstream and upstream bandwidth (KB/s) with social proxy components ON vs. OFF -->

### Key Empirical Findings

1. **100% Final State Convergence Under Severe Degradation:** Across all seven runs—even when RTT spiked to **1.47 seconds** and over **900–1,200 packets** were dropped in a single 96-second window—the host and both clients converged on the exact same final `StateHash`. No session crashed or soft-locked the turn loop.
2. **Empirical Proof of Eventual Consistency Over Pure Event Sync:** In Profile D and Run E, clients skipped 1 out of 38 and 1 out of 29 intermediate host states (`946D58B2` and `2CC141D2`/`C920D583`) when two mutations happened in rapid succession during heavy packet loss. Unreal's property replication delivered the latest authoritative state directly without permanent desync. Had *Card Caboose* relied on pure event sourcing rather than property replication as its source of truth, a single skipped transition would have permanently broken client state.
3. **Cross-Actor Race Conditions Captured in Telemetry:** Under 0% packet loss (Profiles A, B, and F), clients logged **0** extra intermediate hashes. Once jitter and packet loss were introduced (Profiles C–E), clients logged **2–7 transient intermediate hashes**—capturing the exact frames where `ACardGameState` and `ACardPlayerState` arrived in separate packets before converging back to the host's state.
4. **Social Proxy Traffic Costs ~160–180 Bytes/s With Zero Gameplay Delay:** Comparing Profile F with social proxy replication enabled versus disabled showed that `UUSocialReplicationComponent`, `UCardLeanComponent`, and `UCardHandIKComponent` account for only **0.16–0.17 KB/s downstream** and **0.15–0.18 KB/s upstream** (~10–13% of total traffic). Median state propagation delay remained virtually identical (**10.6–21.3 ms** with proxy ON vs. **9.1–20.9 ms** with proxy OFF), proving that continuous `Unreliable` social replication never delays gameplay-critical updates.

## Reflection

The initial thesis behind this game was that a turn-based game could avoid Unreal's tick-based replication overhead by relying on an event-driven RPC model. Looking at the finished C++ architecture, this turned out to be only half true. While incoming player intent is strictly driven by RPCs, outgoing state synchronization relies on standard Unreal property replication on `ACardGameState` and `ACardPlayerState`, which is fundamentally eventually consistent state synchronization.

A pure RPC or event-sourced model would have been far too fragile under packet loss: if a single state-mutating event were dropped or arrived out of order, client states would diverge permanently. Conversely, pure property replication lacked the discrete historical context required to animate sequentially. What made the game resilient was the **three-class hybrid**: Reliable RPCs for intent, replicated properties as the single source of truth, and a ring buffer for driving visual presentation.

Our telemetry from Profile D and Run E directly confirmed this trade-off: under heavy packet loss, clients occasionally skipped an intermediate `StateHash` and logged 2–7 transient cross-actor states, yet still converged 100% on the final board state. That empirically proves why eventual consistency via property replication was essential—a pure RPC stream would have permanently diverged on those skipped transitions.

Combining property replication with animation events brought a significant complexity tax. Because Unreal provides no cross-actor delivery ordering between `ACardGameState` and `ACardPlayerState`, a large portion of the client codebase exists solely to absorb out-of-order updates (`PostRepNotifies()`, `Seq` ring buffers, `UCardMoveQueue` reconciliation, `UCardHandArrivals` tickets, frame-polled HUDs, and host `NotifyStateChanged()` broadcasts).

Had the game been built as a traditional 2D card game backed by a WebSocket server, the entire board state could have been serialized as a single JSON payload per turn, eliminating many of the workarounds required here. Yet because *Card Caboose* is a first-person 3D tabletop game requiring real-time spatial VOIP, gaze tracking, and hand IK, staying inside the Unreal replication ecosystem made this complex hybrid a worthwhile trade-off.

### Known Flaws and Limitations

- **Listen-Server Asymmetry:** Running on a player-hosted listen server means the host constantly operates at `0 ms` latency. This gives the host a slight timing advantage during last-second plays, and if the host disconnects or crashes, it terminates the entire session.
- **Unused Engine Bandwidth Scheduling:** We never tuned `NetPriority` or `NetUpdateFrequency`, relying exclusively on Reliable/Unreliable channel separation and RPC rate-limiting. While sufficient for four players, scaling this model up would require explicit actor prioritization.

### What I Wish I Had Time For

- **Dedicated Servers:** Since we want to move *Card Caboose* toward a commercial Steam release, I would have liked time to transition to dedicated servers. Because rule validation (`UCardRulesLibrary`) and turn authority (`UCardTurnManager`) are already decoupled from rendering, migrating from a listen server to dedicated servers would eliminate the host latency advantage and single-point-of-failure disconnects.
- **Host Migration:** If we retain peer-hosted sessions alongside dedicated servers, implementing host migration would require serializing both `ACardGameState` and all individual `ACardPlayerState` inventories—including hidden decks—into a periodic backup snapshot so a newly elected host can reconstruct the match.

Ultimately, writing robust network code for a turn-based multiplayer game in Unreal Engine 5 is not about eliminating state replication in favor of pure events—it is about separating *truth* from *presentation*. By treating Reliable RPCs strictly as player intent, keeping authoritative game state inside filtered replicated properties such as `COND_OwnerOnly`, isolating social proxy data on Unreliable channels, and building order-independent receivers on the client, the end result turned our game into a predictable tabletop experience. Even with the extra complexity from cross-actor synchronization workarounds and the trade-offs of using a listen server, this three-class hybrid architecture provides a solid, resilient foundation that stays responsive under high latency and scales cleanly toward future dedicated server support.

All in all, the dream scenario of creating a 100% stable networking system is nearly unachievable. In the end, the player running the listen server will always have a slight advantage over clients connecting remotely. But through workarounds and hybrid setups, you can structure network code in a way that stays reliable and fair for everyone at the table. Using the system implemented here allows a social tabletop game to run without a hitch—though if you tried to drop this exact listen-server setup into a twitch shooter like *Counter-Strike*, everyone except the host would have a very bad time.
