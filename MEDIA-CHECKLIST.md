# Material att samla in

Checklista över bilder, klipp och kod som sidan behöver. Filen publiceras inte (den ligger i `exclude` i `_config.yml`).
Kryssa i med `[x]` när en sak är klar och ligger i `images/`.

## Format och storlekar

| Typ | Format | Storlek | Tips |
|---|---|---|---|
| Thumbnail (kortet på startsidan) | `.webp` | 800×450 px (16:9), under 200 KB | En tydlig stillbild eller kort loop. Inget UI-brus. |
| Kort loop (≤ 8 s) | `.webp` (animerad) | max 1280 px bred, under ~3 MB | ScreenToGif → spara som WebP. 30 fps räcker. |
| Längre klipp (> 8 s) | `.mp4` (H.264) | max 1280 px bred | 5–10 gånger mindre än WebP/GIF för samma klipp. |
| Diagram | `.svg` | ~1520 px bred i Figma | Text minst ~28 px i Figma. |
| Foto / skärmdump | `.webp` | max 1600 px bred | Komprimera i squoosh.app. |

Alla bilder behöver en **alt-text** som beskriver vad bilden visar (skrivs i sidans front matter eller i `![alt](...)`).

---

## Hela sidan

- [ ] `portrait.webp` – porträttfoto till hero eller About. Kvadratiskt, minst 800×800 px.
- [ ] `cv.pdf` – CV (när det är klart).
- [ ] `favicon.png` – ikon i webbläsarfliken. 512×512 px, gärna ett monogram ("MH").
- [ ] `og-image.png` – bild som visas när länken delas på LinkedIn/Discord. 1200×630 px.

## Blogginlägget: Stupidly stable network replication

- [ ] `blog/stupidly-stable/overview.webp` – översikt av spelet: flera muppar runt bordet, korthanden och center pile syns.
- [ ] `blog/stupidly-stable/network-classes.svg` – diagram över de tre nätverksklasserna.
- [ ] `blog/stupidly-stable/class-ownership.svg` – diagram över server-only, ägande klient och replikerade klasser.
- [ ] Mätdata från profilerna A–F (CSV) till Results.

## Card Caboose (ny projektsida, Unreal Engine 5.7, C++)

- [ ] `cardcaboose_thumb.webp` – muppar runt bordet i tågkupén.
- [ ] `cardcaboose_gameplay.webp` – ett spelat kort som flyger till center pile, sett ur förstapersonsvy.
- [ ] `cardcaboose_highlight.webp` – **host och klient sida vid sida med simulerad lag** (PktLag) där båda skärmarna hamnar i samma läge. Det starkaste beviset för nätverksarbetet.
- [ ] `cardcaboose_voip.webp` – muppens mun/ögon som rör sig när någon pratar (proxy-trafik).
- [ ] Kod (C++): replikering av handen med `COND_OwnerOnly` (`GetLifetimeReplicatedProps`).
- [ ] Kod (C++): `Server_PlayCards` – servern slår upp kort från instans-ID:n och avvisar mjukt med `Client_ActionRejected`.
- [ ] Fakta: projekttyp, teamstorlek och sammansättning, tidsåtgång, plattform (Steam?), GitHub-länk.

## Lastkaj 0 (Unreal Engine 5, C++ / Blueprints)

- [ ] `lastkaj_thumb.webp`
- [ ] `lastkaj_gameplay.webp` – gravitationsverktyget som vänder spelaren eller ett objekt.
- [ ] `lastkaj_highlight.webp` – VFX och animationer på vapnet ("Juicing up VFX and animations").
- [ ] `lastkaj_cable.webp` – kabelsystemet som drar ut spelaren (Technical focus 1).
- [ ] `lastkaj_water.mp4` – vattnet i huvudmenyn (Technical focus 2). Den befintliga `lastkaj_water.webp` är 14 MB; konvertera till MP4.
- [ ] Skärmdump: Blueprint-grafen för vattenshadern.
- [ ] Kod (C++): det mest intressanta från gravitationsverktyget eller kabelsystemet.
- [ ] Fakta: projekttyp, teamstorlek, tidsåtgång, plattform.

## Tyrant (Unity, C#)

- [ ] `tyrant_thumb.webp`
- [ ] `tyrant_gameplay.webp` – tentaklerna som sprider sig och äter.
- [ ] `tyrant_line_test.webp` – test av line renderer-logiken (Development Highlight).
- [ ] Kod (C#): tentakelns line renderer i World Space, eller ett utdrag ur `EatManager`.
- [ ] Fakta: projekttyp, teamstorlek, tidsåtgång, plattform.

## Ping (Unity, C#)

- [ ] `ping_thumb.webp`
- [ ] `ping_gameplay.webp` – en ekopuls som avslöjar omgivningen i mörkret.
- [ ] `ping_highlight.webp` – test av ekovågens radie och falloff.
- [ ] `ping_mobile.webp` – skärmdump av touch-kontrollerna på mobil.
- [ ] Kod (C#): hur sonarpulsen sprids och detekterar material.
- [ ] Fakta: projekttyp, tidsåtgång.

## Sokoban (ny projektsida)

- [ ] `sokoban_thumb.webp`
- [ ] `sokoban_gameplay.webp` – spelaren som knuffar lådor på plats.
- [ ] Kod: flytt- och knufflogiken, eller ett ångra-system om det finns.
- [ ] Fakta: motor/ramverk, språk, roll, projekttyp, teamstorlek, tidsåtgång, plattform.

## VR-projektet (ny projektsida, HLSL)

- [ ] `vr_thumb.webp`
- [ ] `vr_gameplay.mp4` – höjdkänslan och molnen. Spela in från en stabiliserad spectator-kamera; huvudrörelser från headsetet kan ge åksjuka i video.
- [ ] `vr_clouds_before_after.webp` – samma vy med och utan dina moln/effekter.
- [ ] Kod (HLSL): kärnan i molnshadern (t.ex. brus eller raymarching), 20–40 rader.
- [ ] Fakta: projektnamn, motor, roll, projekttyp, teamstorlek, tidsåtgång, headset/plattform.
