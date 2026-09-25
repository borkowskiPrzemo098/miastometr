---
name: Miastometr
description: Porównywarka 100 polskich miast, odczytywana z analogowych mierników panelowych.
colors:
  signal-orange: "#EE5A24"
  signal-orange-deep: "#C4441A"
  bakelite-teal: "#0F7A78"
  bakelite-teal-deep: "#0A5D5B"
  map-land-teal: "#23908D"
  mustard: "#F2B705"
  zone-red: "#D7263D"
  zone-green: "#2E9E4F"
  instrument-black: "#1C1C1A"
  face-white: "#FFFFFF"
  enamel: "#EEF0EA"
  aluminium: "#D3D7D0"
  ink-2: "#44463F"
  ink-3: "#6A6D64"
  key-lip: "#D8DBD4"
  row-highlight: "#FFF6D6"
  lamp-off: "#B9BCB5"
typography:
  display:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "clamp(2.7rem, 9.4vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "clamp(2rem, 5.2vw, 3.9rem)"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 900
    lineHeight: 1.05
    fontVariation: "'wdth' 118"
  readout:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "clamp(1.7rem, 3vw, 2.3rem)"
    fontWeight: 900
    lineHeight: 1.05
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 110"
  body:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "0.8rem"
    fontWeight: 800
    letterSpacing: "0.09em"
rounded:
  chip: "8px"
  button: "10px"
  field: "12px"
  face: "14px"
  housing: "22px"
  pill: "999px"
spacing:
  seam: "3px"
  xs: "6px"
  sm: "10px"
  md: "18px"
  lg: "28px"
  section-head: "34px"
  panel: "clamp(64px, 9vw, 112px)"
components:
  button-black:
    backgroundColor: "{colors.instrument-black}"
    textColor: "{colors.face-white}"
    rounded: "{rounded.button}"
    padding: "12px 22px 14px"
  button-orange:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.instrument-black}"
    rounded: "{rounded.button}"
    padding: "12px 22px 14px"
  button-ghost:
    backgroundColor: "{colors.face-white}"
    textColor: "{colors.instrument-black}"
    rounded: "{rounded.button}"
    padding: "12px 22px 14px"
  piano-key:
    backgroundColor: "{colors.face-white}"
    textColor: "{colors.instrument-black}"
    padding: "13px 16px 15px"
  piano-key-on:
    backgroundColor: "{colors.instrument-black}"
    textColor: "{colors.face-white}"
  field:
    backgroundColor: "{colors.face-white}"
    textColor: "{colors.instrument-black}"
    rounded: "{rounded.field}"
    padding: "13px 16px"
  city-plate:
    backgroundColor: "{colors.instrument-black}"
    textColor: "{colors.face-white}"
    rounded: "{rounded.field}"
    padding: "16px 52px 16px 18px"
  meter-face:
    backgroundColor: "{colors.face-white}"
    textColor: "{colors.instrument-black}"
    rounded: "{rounded.face}"
  instrument-housing:
    backgroundColor: "{colors.instrument-black}"
    textColor: "{colors.face-white}"
    rounded: "{rounded.housing}"
    padding: "22px"
  nav-link:
    textColor: "{colors.instrument-black}"
    rounded: "{rounded.chip}"
    padding: "8px 12px"
  nav-link-hover:
    backgroundColor: "{colors.enamel}"
  toast:
    backgroundColor: "{colors.instrument-black}"
    textColor: "{colors.face-white}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
---

# Design System: Miastometr

## Overview

**Creative North Star: "The PRL Panel Meter"**

Miastometr is a measuring instrument, not a comparison site. Every city is read off a white enamel dial with black ticks and a red / mustard / green scale band, housed in signal-orange, teal and mustard bakelite panels joined by black seams. The reference world is 1970s Polish lab and switchboard hardware (ERA, Meratronik): rotary selector knobs, piano-key switches, faders, indicator lamps and engraved nameplates. The UI borrows their physical grammar: things are pressed, turned and read, and the needle does the talking.

The palette is committed and saturated at the panel scale, but each instrument face stays white and quiet so readings stay legible. Type is a single variable family, Archivo, stretched from expanded placard caps (wdth 125) for headings down to plain width for body and condensed tabular numerals for readings. Density is medium: generous panel padding, compact instruments.

The system is light only, by explicit user request. There are no dark-mode tokens and `color-scheme` is pinned to light. The rejected look is the category's blue card-grid dashboard.

**Key Characteristics:**
- Full-bleed color panels, alternating orange / enamel / teal / white / mustard / enamel, separated by 3px black seams.
- White enamel dial faces inside a single black bezel; needles that swing on a spring.
- Archivo from wdth 125 uppercase placards to tabular-numeral readouts.
- Physical controls: rotary knob, piano keys, faders, indicator lamps.
- Tactile depth: inset bottom lips on keys and buttons, soft drop shadows under housings, never flat cards.

## Colors

Saturated bakelite panel colors around quiet white faces, with a three-zone meter scale that doubles as the only semantic color set.

### Primary
- **Signal Orange** (signal-orange): the hero and footer panel, the orange action button, the fader cap stripe, the first comparison needle, the ranking needle's pivot dot and the red tick in the logo. Text on it is always instrument black, never white.
- **Signal Orange Deep** (signal-orange-deep): rank position numerals in the leader strip, where orange must read as text on white.

### Secondary
- **Bakelite Teal** (bakelite-teal): the map panel and the second comparison needle. Text on it is white at full or 88% opacity.
- **Bakelite Teal Deep** (bakelite-teal-deep): the map frame's recessed plate and the halo stroke behind map city labels.
- **Map Land Teal** (map-land-teal): voivodeship fills on the map only.

### Tertiary
- **Mustard** (mustard): the finder panel, the knob's pointer bar, top-three rank discs, active-key status lamp, focus halo on fields, text selection, and the middle zone of every scale band.
- **Zone Red** (zone-red) and **Zone Green** (zone-green): the lower and upper thirds of the scale band. Green also marks the winning value in a comparison.

### Neutral
- **Instrument Black** (instrument-black): ticks, needles, bezels, seams, housings, table headers, primary button, text. Doubles as ink.
- **Face White** (face-white): dial faces, fields, readouts, piano keys at rest, white panel.
- **Enamel** (enamel): page background and the enamel panels; also the nav hover wash.
- **Aluminium** (aluminium): scrollbar track only, the one metal surface.
- **Ink 2 / Ink 3** (ink-2, ink-3): secondary and tertiary text on light panels; ink-3 also the placeholder color.
- **Key Lip** (key-lip): the inset bottom edge that gives white keys and toggles their depth.
- **Row Highlight** (row-highlight): hover wash for ranking rows and finder results.
- **Lamp Off** (lamp-off): an unlit lamp and "no data" map dots.

### Named Rules
**The Three-Zone Rule.** Zone red and zone green appear only as the outer thirds of the scale band (split at 33.3% / 66.6%) and the colors derived from it (map dots, legend, the comparison winner dot). Mustard is also a panel and signal color, but on a white face it always means the middle zone.

**The Neutral Size Rule.** Population is not better or worse. Its dials carry a solid black band at 80% opacity instead of zones, and its map dots are white.

**The Lamp Rule.** Air quality is categorical, so it is shown as an indicator lamp in the GIOŚ category color, never as a percentile needle. When air quality is selected the hero dial fades to 16% and a lamp replaces it; the lamp scale uses the six GIOŚ levels from very good to very bad.

**The Three Needles Rule.** Comparisons use orange, teal and black needles in that order, and the same three colors mark each city's chip everywhere in the compare view.

## Typography

**Display Font:** Archivo (with 'Arial Narrow', sans-serif), variable wdth 62–125, wght 400–900
**Body Font:** Archivo, same family
**Label/Mono Font:** Archivo with tabular numerals; no separate mono

**Character:** One variable family used like a sign-writer's set: expanded black uppercase for placards and nameplates, normal width for reading, slightly widened tabular numerals for readings.

### Hierarchy
- **Display** (900, clamp(2.7rem, 9.4vw, 6rem), 0.92, wdth 125, uppercase): the hero headline only. The city profile name uses the same voice at clamp(2.4rem, 7.4vw, 5.6rem), line-height 0.9.
- **Headline** (900, clamp(2rem, 5.2vw, 3.9rem), 0.98, wdth 125, uppercase, balanced wrap): section titles and the data nameplate title.
- **Title** (900, 1.1–1.5rem, wdth 118–125, uppercase): leader strip heading, results heading, city plate select, map readout city name, lamp caption.
- **Readout** (900, clamp(1.7rem, 3vw, 2.3rem), 1.05, wdth 110, tabular): the hero readout value; smaller siblings at 1.2–1.3rem in gauges, scores and the map readout.
- **Body** (400–600, 17px / 16px under 760px, 1.55): lede and notes capped at 58–64ch. Section subtitles are 1.08rem in ink-2.
- **Label** (800, 0.76–0.86rem, 0.07–0.09em tracking, uppercase): table headers, gauge titles, legend headings, nameplate terms, plate labels.

### Named Rules
**The Tabular Reading Rule.** Every number that can change (table cells, readouts, values, tick numerals) uses tabular numerals so needles and columns don't jitter.

**The Width Axis Rule.** Hierarchy is carried by width and weight together: wdth 125 for placards, 108–118 for titles and readings, 100 for body. Don't substitute a second family.

## Layout

A single 1240px column (`min(1240px, 100% - 40px)`) inside full-bleed panels. Each panel has vertical padding of clamp(64px, 9vw, 112px) and a 3px black top seam; the hero drops its seam and sits under the sticky white header's own bottom seam. Panel order is fixed: orange hero, enamel ranking, teal map, white profile, mustard finder, enamel compare, enamel nameplate, orange footer.

Section heads are a left-aligned stack (title, then subtitle), capped at 64ch, with 34px below. The hero and the data nameplate are the only centered compositions.

The hero console is a three-column grid (city plate / dial / knob, 1fr / 1.5fr / 360px), collapsing to two columns at 1100px (knob spans below) and one column at 760px, where the dial moves first and the knob swaps for a row of piano keys. The profile cluster and compare grid go 4 → 2 → 1 columns; the leader strip shows 5 → 3 → 2. Map and finder split 1.9:1 and 1.05:1, then stack at 900px. Under 560px the ranking drops its scale column.

Common gaps: 6px inside instruments, 10–18px between controls, 28px between major columns. The sticky header is 68px tall; scroll padding is 84px (150px on mobile, where the nav wraps to a three-column grid).

## Elevation & Depth

Depth is physical, not atmospheric. Surfaces sit on panels as objects: keys and buttons have an inset bottom lip and press in on activation, faces have an enamel bevel plus a soft cast shadow, and black housings throw a deep, soft shadow. There are no glows except the tiny lamp on an active key and the green winner dot.

### Shadow Vocabulary
- **Lift** (`0 8px 18px -10px rgba(28,28,26,.6), 0 1px 2px rgba(28,28,26,.25)`): the default for anything that sits on a panel: buttons, fields, keys, readouts, legends, tooltips, the toast.
- **Face** (`0 1px 0 rgba(255,255,255,.7) inset, 0 -2px 0 rgba(0,0,0,.06) inset, 0 14px 28px -14px rgba(28,28,26,.55), 0 2px 4px rgba(28,28,26,.18)`): dial faces, the ranking table and the results board.
- **Key lip** (`inset 0 -5px 0 rgba(0,0,0,.22)` on filled buttons, `inset 0 -5px 0 #D8DBD4` on white keys): the resting bevel.
- **Pressed** (`inset 0 3px 6px rgba(0,0,0,.45–.6)`): active, checked or toggled-on controls.
- **Housing** (`0 24px 40px -22px rgba(0,0,0,.8)`): the black gauge cluster and mixer; the map frame uses `0 20px 36px -18px rgba(0,0,0,.7)`.
- **Needle** (SVG drop shadow, dx 1.6 dy 2.2, blur 1.1, black at 32%): every needle, so it floats above the face.

### Named Rules
**The Press-In Rule.** A control that is on is pushed in (inset shadow, black fill), never raised or glowing. Hover lifts by 1–3px at most.

## Shapes

Softly rounded rectangles, like molded bakelite: 8px for nav chips and labels, 10px buttons, 12px fields and key rows, 14px faces and legends, 20–22px for the large black housings and the map frame. Circles are reserved for lamps, rank discs, the knob, map dots and needle pivots; the toast is the only pill.

Borders are heavy and black: 2.5px on controls, 3px on faces and seams, 4px on the hero dial, 6px on leader and compare bezels. Dividers inside white surfaces are thin (1.5px, #DFE2DB); inside black housings they are 1px #3a3b37.

**The One Bezel Rule.** Each instrument has exactly one black frame. A dial inside a leader tile, gauge or compare card loses its own border and shadow; the tile or the black cluster is the bezel. Never nest a bordered card in a bordered card.

## Components

### Buttons
Chunky, pressable, bevelled.
- **Shape:** gently rounded (10px), 2.5px black border, bold 800 label at 0.98rem.
- **Variants:** black (primary: profile link, "show all"), orange (share), ghost white (secondary).
- **Hover / Active:** hover lifts 1px; active drops 2px and swaps the lip for a pressed inset. Transitions 150ms on the ease-out curve.

### Piano Keys
A segmented radio row joined inside one black-bordered, 12px-rounded strip; each key is white with a grey inset lip, separated by 2px black dividers. The checked key goes black with white text, pressed-in, and a 6px mustard lamp lights at its top edge. The same component carries metric switches in every section and the finder presets; on mobile it replaces the knob and keys flex to 25% width.

### Rotary Knob
The hero's metric selector: a 132px black knob with 24 grip ridges, a darker cap and a mustard pointer bar, surrounded by eight dot positions and text labels across a 270° arc (-135° to +135°). The knob turns over 500ms on the knob curve. The checked label is a black chip with white text.

### Panel Meter (signature)
A white face in a 3px black bezel (4px and 22px radius in the hero). Geometry: pivot at (100, 128) in a 220×152 viewBox, 96-unit radius, ±58° sweep. There are 41 ticks: major every fourth (12 long, 1.8 wide), mid (7), minor (4). A thin mirror arc sits 32 units inside the ticks. The scale band is 5 units wide just outside the ticks (red, mustard and green thirds, or a solid black band for population), and the 0–100 numerals sit further out at radius 113, so the needle only ever sweeps over ticks. Corner captions (category, "% miast") are 6.5px uppercase in ink-3.

Needles are black (orange, teal, black for comparisons) with a heavier 6-unit tail and a black-and-enamel pivot cap. They move with a damped spring (stiffness 150, damping 13, four substeps per frame), slightly underdamped so they overshoot and settle like a real movement. Cluster and compare needles stagger by 70–110ms. Under reduced motion they snap.

### Edge Scale
A horizontal mini-meter used in ranking rows and finder results: fine black and grey ticks, a 5px zone band, and a 3px black needle with an orange pivot dot that slides in over 700ms. The neutral variant uses a 75% black band.

### Indicator Lamp
A circle in the GIOŚ category color with a thick black rim: 16px in tables, 48px in comparisons, 64px in the profile, 84–124px in the hero. Unlit lamps are lamp-off grey.

### Fields and Selects
- **Style:** white, 2.5px black border, 12px radius, 600 weight, lift shadow, inline SVG search or chevron icon.
- **Focus:** the outline is replaced by a 4px mustard halo.
- **City plate:** the hero's primary select is a black plate with white 1.45rem uppercase wdth 118 text and a mustard chevron; its focus ring is white. The profile select reuses the black-plate treatment.

### Faders
Mixer rows in a black 22px housing: label, track and mustard value readout. The track is dark grey with quarter ticks; the thumb is a 30×24 white cap with an orange center stripe. Bipolar faders mark their center line in mustard.

### Cards / Containers
- **Leader tile / compare card:** white with a 6px black bezel and 14px radius, lift shadow; the leader tile lifts 3px on hover.
- **Gauge cluster:** four white 10px gauges on a black 22px housing with 18px gaps; no borders on the gauges.
- **Ranking board:** white table in a 3px bezel with a face shadow, black header row, 1.5px row dividers, row-highlight on hover. Top three positions sit in mustard discs.
- **Nameplate:** a centered definition list ruled with 2px black lines, uppercase terms.

### Navigation
A sticky white bar with a 3px black bottom seam. The logo is an SVG scale (ticks and an orange needle) over an expanded 900-weight wordmark. Nav links are 700 weight at 0.95rem, 8px-rounded, with an enamel hover wash. Under 900px the row scrolls; under 760px it wraps into a three-column grid below the logo.

### Toast
A black pill at bottom center, 700 weight, that rises 16px on entry over 350ms.

## Do's and Don'ts

### Do:
- **Do** alternate full-bleed panels in the order orange, enamel, teal, white, mustard, enamel, joined by 3px black seams (`3px solid #1C1C1A`).
- **Do** put numerals outside the zone band so needles sweep only over ticks.
- **Do** give every instrument exactly one black bezel, and strip borders and shadows from dials nested inside it.
- **Do** use the ease-out curves only in CSS (`cubic-bezier(.16,1,.3,1)` for UI, `cubic-bezier(.22,1,.36,1)` for knob and needle-like slides). The only overshoot in the system is the JS needle spring (stiffness 150, damping 13).
- **Do** show air quality as an indicator lamp in the GIOŚ category color.
- **Do** keep population dials neutral: a black band, no zones, white map dots.
- **Do** use tabular numerals for every reading and a black 3px focus outline (white on orange and teal panels).
- **Do** set black text on signal orange and mustard, and white text on teal and black.

### Don't:
- **Don't** add dark-mode tokens or a dark theme; the system is light only by user request.
- **Don't** drive a percentile needle for air quality.
- **Don't** use red, mustard or green outside the scale band and its derived map and legend colors.
- **Don't** nest a bordered card inside a bordered card.
- **Don't** add bouncy or overshooting CSS easing; overshoot belongs to the needle spring alone.
- **Don't** put eyebrows or kickers above headings; a section opens with its uppercase title.
- **Don't** use a second typeface; widen or condense Archivo instead.
- **Don't** fall back to the blue card-grid dashboard look of comparison sites.
