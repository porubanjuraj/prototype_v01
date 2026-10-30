# Kaštieľ Mojmírovce – desktop prototype (1280 px)

Statický prototyp domovskej stránky podľa Figmy `Kastiel-Mojmirovce---Web` (`48:87` Homepage, komponenty v `1:2`).
Bez build kroku – HTML + CSS + JS. Knižnice (GSAP, ScrollTrigger, Lenis) sú lokálne v `assets/vendor/`.

## Spustenie

```bash
cd prototype && ruby -run -e httpd . -p 8780
```

Potom `http://localhost:8780/`. (Fonty Manrope sa načítavajú z Google Fonts, Season z `assets/fonts/`.)

## Štruktúra

- `index.html` – všetky sekcie v poradí z Figmy + Open Menu + Floating Reservation
- `css/tokens.css` – tokeny z Figma variables (nemeniť ručne)
- `css/style.css` – komponenty a sekcie
- `js/main.js` – interakcie a scroll animácie
- `assets/img`, `assets/svg` – export z Figmy (`get_design_context`), fotky izieb a sál z `00_resources`

## Interakcie

| Časť | Správanie |
|---|---|
| Smooth scroll | Lenis + ScrollTrigger |
| Hall slider (5 slidov) | pin sekcie, na scroll sa pozadie odhaľuje **clip-path zdola nahor** (+ jemný zoom), karta sa mení s fade (referencia: elementis.co „innovation“) |
| Room slider (5 izieb) | pin, fotky sa posúvajú vertikálne, text vľavo sa prelína (referencia: hillbrookestate.co.nz „at your own pace“) |
| Mapa | klik na hotspot otvorí/zatvorí Place Card, naraz jeden |
| Teaser carousel | šípky cyklia 4 slidy, počítadlo `02 – 04` |
| Offer cards | hover rozšíri kartu (528 px), ostatné sa zúžia |
| Marquee „In vino veritas“ | nekonečný, zrýchľuje pri scrollovaní, pauza na hover |
| Open Menu | trigger v hlavičke; hover na položke prepne pravý panel na podmenu, Esc/× zatvorí |
| Floating Reservation | fixná vpravo dole, pill ↔ panel, zdieľa dátumy a hostí s Booking Bar |
| `prefers-reduced-motion` | vypína pin, marquee, reveal animácie |

## PLACEHOLDERY (na výmenu)

- **Ceny izieb** Biely apartmán (240 €) a Prezidentský apartmán (340 €) – vymyslené (`index.html`, `data-room`).
- **Mapa** – v dizajne je len karta „Bazén“; texty a fotky ostatných 5 zastávok sú ilustračné (`js/main.js`, objekt `places`).
- **Teaser carousel** – 4. slide (Bowling) a poradie sú doplnené (`teasers` v `js/main.js`).
- **Texty slidov Hall slideru 02–05** – pracovná verzia UX writera, priradenie fotiek 02–04 treba overiť.
- **URL**: rezervačný systém (`Skontrolovať dostupnosť` → `#`), sociálne siete (`#`), poukazy, SK/EN, právne odkazy. Menu odkazuje na starý web `kastielmojmirovce.sk`.
- **Dátumy** – natívny `<input type="date">` v štýle Date Field (kalendár nie je v dizajne).
- **Season font** je TRIAL (`assets/fonts/SeasonCollectionVF-TRIAL.ttf`); na verejné nasadenie treba licenciu. Používa osi `wght 300` + `SERF 100` („Serif Light“).

## Odchýlky od Figmy

- Hover/pressed/focus/disabled stavy komponentov sú **odvodené** (v dizajne nie sú), podľa `FIGMA-HANDOFF.md` §6.
- Link Row v Park/Lunch/Evening je vo východiskovom (nehoverovanom) stave; v dizajne je jeden riadok ukázaný ako hover.
- Hand-kurzory v dizajne sú ilustrácia, nie súčasť UI.
- Header nie je sticky (podľa handoffu); trvalé CTA je Floating Reservation.
- Pod/nad 1280 px sa layout nescaluje – obsah je centrovaný, pozadia sú full-bleed.
