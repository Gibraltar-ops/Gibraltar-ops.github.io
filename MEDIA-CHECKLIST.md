# Material att samla in

Checklista över bilder, klipp och kod som sidan behöver. Filen publiceras inte (den ligger i `exclude` i `_config.yml`).
Kryssa i med `[x]` när en sak är klar och ligger på rätt plats.

## Så spelar du in GIF:ar

1. Spela in med **ScreenToGif** (gratis, Windows).
2. Klipp till **3–6 sekunder** som loopar snyggt (slutet ska kunna gå direkt över i början).
3. Exportera som **animerad WebP** (`.webp`), inte `.gif`. Samma klipp blir 3–5 gånger mindre och har fler färger.
4. Max **1280 px bred**, **20–30 fps**. Sikta på **under 3 MB** per klipp.
5. Inget UI-brus om det inte är UI du vill visa. Inga muspekare.
6. Spara i `images/` med exakt det filnamn som står nedan, så dyker klippet upp utan kodändringar.

| Typ | Format | Storlek |
|---|---|---|
| Thumbnail (kortet på startsidan) | `.webp`, gärna en kort loop | 800×450 px (16:9), under 1 MB |
| Huvudklipp (överst på projektsidan) | animerad `.webp` | max 1280 px bred, under 3 MB |
| Klipp i texten | animerad `.webp` | max 1280 px bred, under 3 MB |
| Diagram | `.svg` från Figma | ~1520 px bred i Figma, text minst ~28 px |
| Foto | `.webp` | max 1600 px bred |

Alla bilder behöver en **alt-text** som beskriver vad klippet visar (i front matter eller i `![alt](...)`).

---

## Hela sidan (stillbilder)

- [ ] `images/portrait.webp` – porträttfoto till About. Kvadratiskt, minst 800×800 px.
- [ ] `cv.pdf` – CV (när det är klart).
- [ ] `favicon.png` – ikon i webbläsarfliken. 512×512 px, t.ex. monogrammet "MH".
- [ ] `images/og-image.png` – bilden som visas när länken delas på LinkedIn/Discord. 1200×630 px, stillbild.

## Blogginlägget: Stupidly stable network replication

- [ ] `images/blog/stupidly-stable/overview.webp` – GIF: muppar runt bordet, korthanden och center pile syns.
- [ ] `images/blog/stupidly-stable/card-flight.webp` – GIF: ett kort flyger till center pile och snäpper på plats (passar under "Action lifecycle").
- [ ] `images/blog/stupidly-stable/host-vs-client-lag.webp` – GIF: host och klient sida vid sida med simulerad lag (PktLag) där båda hamnar i samma läge. Passar under Results.
- [ ] `images/blog/stupidly-stable/network-classes.svg` – diagram: de tre nätverksklasserna.
- [ ] `images/blog/stupidly-stable/class-ownership.svg` – diagram: server-only, ägande klient och replikerade klasser.
- [ ] Mätdata från profilerna A–F (CSV) till Results.

## Card Caboose (Unreal Engine 5.7, C++) – `projects/cardcaboose.md`

- [ ] `cardcaboose_thumb.webp` – muppar runt bordet i tågkupén.
- [ ] `cardcaboose_gameplay.webp` – GIF: en hel tur i förstapersonsvy: dra ett kort, spela det, nästa spelare.
- [ ] `cardcaboose_highlight.webp` – GIF: host och klient sida vid sida under lag (kan vara samma som i bloggen).
- [ ] `cardcaboose_voip.webp` – GIF: muppens mun rör sig när spelaren pratar.
- [ ] `cardcaboose_head.webp` – GIF: en annan spelares muppe som vrider på huvudet och tittar runt.
- [ ] `cardcaboose_shop.webp` – GIF: butiken/auktionen mellan rundorna.
- [ ] Kod (C++): `Server_PlayCards` eller replikeringen av handen med `COND_OwnerOnly`.

## Dungeon Runner (SDL3, C++) – `projects/dungeonrunner.md`

- [ ] `dungeonrunner_thumb.webp`
- [ ] `dungeonrunner_gameplay.webp` – GIF: spelaren tar sig igenom en bana medan fienderna rör sig när du rör dig.
- [ ] `dungeonrunner_chaser.webp` – GIF: A*-fienden som tar ett steg mot dig för varje steg du tar.
- [ ] `dungeonrunner_rook.webp` – GIF: tornfienden, och hur du blockerar dess sikt för att ta dig förbi.
- [ ] `dungeonrunner_big.webp` – GIF: den stora 2×2-fienden som hittar vägen till dig.
- [ ] Kod (C++): A*-funktionen, eller hur den anpassas för 2×2-fienden.

## BLOONVR (Unity, HLSL / C#) – `projects/bloonvr.md`

- [ ] `bloonvr_thumb.webp`
- [ ] `bloonvr_gameplay.webp` – GIF: blåsa upp ballonger och skjuta motståndarnas. Spela in från en stabiliserad spectator-kamera; huvudrörelser från headsetet ger åksjuka i video.
- [ ] `bloonvr_clouds.webp` – GIF: molnshadern i rörelse när den ändrar form.
- [ ] `bloonvr_height.webp` – GIF: höjdillusionen, marken som sjunker och krymper medan molnbasen kommer närmare.
- [ ] `bloonvr_clouds_before_after.webp` – stillbild: samma vy med och utan dina moln/horisont.
- [ ] Kod (HLSL): kärnan i molnshadern, eller horisontkurvan i skybox-shadern.

## Lastkaj 0 (Unreal Engine 5, C++ / Blueprints) – `projects/lastkaj.md`

- [ ] `lastkaj_thumb.webp`
- [ ] `lastkaj_gameplay.webp` – GIF: gravitationen vänds och kontrollerna fungerar likadant upp och ner.
- [ ] `lastkaj_highlight.webp` – GIF: VFX och animationer på verktyget.
- [ ] `lastkaj_cable.webp` – GIF: kabelsystemet (Technical focus 1).
- [ ] `lastkaj_water_menu.webp` – GIF: vattnet i huvudmenyn (Technical focus 2). Den befintliga `lastkaj_water.webp` är 14 MB, för stor; spela in en kortare loop.
- [ ] Kod (C++): gravitationsvändningen eller den spegelvända styrningen.

## Tyrant (Unity, C#) – `projects/tyrant.md`

- [ ] `tyrant_thumb.webp`
- [ ] `tyrant_gameplay.webp` – GIF: klicka på en människa, tentakeln sträcker sig ut och äter.
- [ ] `tyrant_line_test.webp` – GIF: test av line renderer-logiken (Development Highlight).
- [ ] `tyrant_ik.webp` – GIF: tentakeln i närbild, gärna med det osynliga skelettet synligt (debug-läge).
- [ ] Kod (C#): line renderern som följer IK-målet, eller ett utdrag ur `EatManager`.

## Ping (Unity, C#) – `projects/ping.md`

- [ ] `ping_thumb.webp`
- [ ] `ping_gameplay.webp` – GIF: en ping som sprider sig i mörkret och lämnar residue.
- [ ] `ping_highlight.webp` – GIF: ekovågens radie och falloff.
- [ ] `ping_monster.webp` – GIF: monstret som bara syns i pingen.
- [ ] `ping_angels.webp` – GIF: fienden som bara rör sig när du inte tittar.
- [ ] `ping_mobile.webp` – stillbild eller GIF: touch-cirklarna på mobilskärmen.
- [ ] Kod (C#): `RaycastSonar` (laddning och raycast) eller `ScannerController` (sfären som växer).
- [ ] Beslut: gör repot Crypt publikt, eller ta bort `github_url` (privat repo ger 404 för besökare).
