# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build step. Open `index.html` directly in a browser:

```bash
# Quickest option — Python's built-in server (avoids CORS quirks with file:// in some browsers)
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static file server works. There are no dependencies to install — Leaflet (unpkg) and the fonts (Cinzel, Cinzel Decorative, EB Garamond, IM Fell English, from Google Fonts) are all loaded from CDN at runtime. Note: if outbound access to those CDNs is blocked, the map cannot initialise (`L is not defined`) — that is an environment limitation, not a code bug.

## Architecture

The entire app lives in a single file: **`index.html`** (~3000 lines). The design is a "Victorian broadsheet / steampunk atlas": an aged-vellum sidebar ("the ledger"), sepia-filtered map tiles, curved (bowed) route lines, per-leg transport icons, an animated voyage playback, and a full-screen "reading mode" folio.

Sections are marked with `═══` box-drawing banners — search for those to jump around.

| Section | Lines (approx) | Purpose |
|---------|---------------|---------|
| `<head>` (CDN links) | 8–13 | Leaflet + Google Fonts |
| `<style>` | 15–756 | All CSS — `LEDGER` (sidebar), `MAP STAGE`, `READING MODE` (the folio) |
| HTML skeleton | 758–940 | Static DOM: sidebar shell, `#map` div, `#empty-state` overlay |
| `<script>` | 941–end | All data + all application logic |

### Script sections (in order)

1. **`JOURNEYS` array** (`JOURNEY DATA`) — the only place that needs touching to add or edit a book. **15 journeys.** Each entry carries `id`, `title`, `author`, `year`, `type` (`"route"` | `"constellation"`), `color`, `blurb`, and a `stops[]` array. Each stop has `name`, `realPlace`, `coords [lat, lng]`, `inBook`, `reference`, plus three optional fields:
   - `note` — for approximate / conventional coordinates.
   - `imagePrompt` — an image-generation prompt; when present, the popup shows a **"📋 Copy image prompt"** button.
   - `vessel` — e.g. `"ship"`; overrides the auto-detected transport icon for the leg *leaving* this stop (see icons below).

2. **`state` + globals** (`STATE`) — `state` is `{ activeIds: Set, layers: {} }` (`layers` maps id → `{ markers[], polyline, ... }`). `voyage` holds the animated-playback state (`id`, `step`, `head`, `playing`, `timer`, `raf`, `ship`, `poly`, `path`). `crossings` holds the journey-intersection overlay. Constants: `STEP_MS` (2000 ms), `FLY`; helper `byId(id)`.

3. **Geography helpers** — `haversine(a, b)`; `tuneTileContrast()` adjusts the sepia tile filter on zoom.

4. **Map + tile layer** (`MAP`) — Leaflet instance with filtered tiles. Tile layers are never recreated.

5. **Icon factories** (`ICONS`) — `sealIcon(color, num)`, `starIcon(color)`, `crossIcon()`, and the transport glyphs `shipIcon()`, `carIcon()`, `carriageIcon()`, `vesselIcon(type)`. All return `L.divIcon` with inline-styled HTML. Transport inference lives here: `legTransport(a, b)` guesses ship/car from coordinates, `eraYear(yearStr)` parses the publication era, and **`legVessel(journey, stepIdx)`** picks the icon for a leg — using `stop.vessel` as an override when set, otherwise inferring (pre-1886 land legs become a carriage, later ones a car). **Important:** marker hover effects must use CSS `filter` only (`el.style.filter`, see `litMarker`) — never set `style.transform` on a Leaflet marker element, because Leaflet uses `translate3d` on the same property for positioning.

6. **Popup content** (`POPUP CONTENT`) — `buildPlate(stop)`, `travelEstimate(km, vessel)`, **`buildPopup(stop, journey, idx)`** (shows leg distance/time, the note, and the copy-image-prompt button), and `crossingPopup`. Content is from the static `JOURNEYS` data, so no sanitisation is needed — keep it that way; don't interpolate user-supplied strings here.

7. **Draw / remove** (`DRAW / REMOVE`) — `bowedPath(coords)` produces the curved route line; `trailPinIcon` / `sampleTrailPins` scatter small markers along it. `drawJourney(journey, animate)` creates the markers + optional polyline into `state.layers[id]`; `removeJourney` tears them down. `boundsOf(ids)` and `ensureCharted(id, animate)` support fit-to-view.

8. **Voyage console** (`VOYAGE CONSOLE`) — animated playback of a single route: `voyageEnsure`, `voyageRender(head)`, `voyageSeek`, `voyageGlide` (the ship slides along `bowedPath`), `voyagePlay` / `advanceVoyage` / `voyagePause`, `updateVoyageUI`, `pulseMarker`.

9. **Reading mode** (`READING MODE`) — the full-screen "folio": `buildStoryEl`, `storyOpen(id)`, `storyGo(step)`, `storyToggleAuto` / `storyStopAuto`, `storyClose`.

10. **Crossings** (`CROSSINGS`) — `computeCrossings` finds places where two active journeys meet; `toggleCrossings` / `clearCrossings` / `renderCrossingsPanel` manage the overlay.

11. **Sidebar / ship's log** (`SHIP'S LOG + SIDEBAR`) — `renderVoyageConsole`, **`renderSidebar`** (full `innerHTML` replacement on the journey list), `litMarker(jid, idx, on)`. Stop items carry `data-jid` / `data-idx` so click/hover handlers can look up the right marker in `state.layers`.

12. **Gazetteer** (`GAZETTEER`) — `runGazetteer(q)` searches stops/places.

13. **Toggle / chart-all / clear** — `toggleJourney(id)`, `chartAll()`, `clearAll()`, `ensureChartedAndRender`, then always `updateEmptyState()` + `renderSidebar()` to keep the DOM in sync.

14. **Timeline** — `renderTimeline()`.

15. **Init** — `syncHash` / `loadHash` (URL-hash deep-linking) + bootstrap.

### Key design constraints

- **No `style.transform` on marker elements.** Leaflet owns that property for positioning. Use `el.style.filter` for visual hover effects instead.
- **`renderSidebar` is a full re-render.** Don't try to patch individual sidebar nodes — just call it after any state change.
- **The voyage owns the animated line.** During playback the route is redrawn incrementally (`voyage.poly` / `voyage.path`); `voyageTeardown` restores the static state.
- **`constellation` journeys never get a polyline.** `drawJourney` and the voyage/reading functions branch on `journey.type`.

## Adding a new book

Copy any existing entry in the `JOURNEYS` array. Use `type: "route"` for journeys with a narrative sequence, `type: "constellation"` for a thematically-linked but geographically-dispersed set of places. Pick a muted, distinct hex colour. Then per stop:

- Add a `note` to any stop whose coordinates are approximate or conventional.
- Add an `imagePrompt` to offer a "Copy image prompt" button in the popup.
- Add `vessel: "ship"` on the *departure* stop of any sea leg that `legTransport` would otherwise misjudge as land (short coastal hops, river steamers, same-longitude ocean crossings).
