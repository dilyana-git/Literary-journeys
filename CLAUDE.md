# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build step. Open `index.html` directly in a browser:

```bash
# Quickest option — Python's built-in server (avoids CORS quirks with file:// in some browsers)
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static file server works. There are no dependencies to install — Leaflet, EB Garamond, and Crimson Text are all loaded from CDN at runtime.

## Architecture

The entire app lives in a single file: **`index.html`**.

It is divided into three clearly-marked sections (search for the `╔` box-drawing characters to jump between them):

| Section | Lines (approx) | Purpose |
|---------|---------------|---------|
| `<style>` | 1–422 | All CSS — layout, sidebar, popups, mobile breakpoint |
| HTML skeleton | 423–471 | Static DOM: sidebar shell, `#map` div, `#empty-state` overlay |
| `<script>` | 473–1206 | All data + all application logic |

### Script sections (in order)

1. **`JOURNEYS` array** — the only place that needs touching to add or edit a book. Each entry carries `id`, `title`, `author`, `year`, `type` (`"route"` | `"constellation"`), `color`, `blurb`, and a `stops[]` array. Stops have `name`, `realPlace`, `coords [lat, lng]`, `inBook`, `reference`, and optional `note`.

2. **`state` object** — single mutable store: `activeIds` (Set of journey IDs currently on the map), `layers` (map from id → `{ markers[], polyline }`), and trace-animation fields (`tracingId`, `traceTimer`, `traceStep`, `traceMarker`, `tracePoly`).

3. **Map + tile layer** — Leaflet instance with CartoDB Positron tiles.

4. **Icon factories** — `makeRouteIcon(color, num)`, `makeConstellationIcon(color)`, `makeTraceIcon(color)`. All return `L.divIcon` with inline-styled HTML. **Important:** marker hover effects must use CSS `filter` only — never set `style.transform` on a Leaflet marker element, because Leaflet uses `translate3d` on the same property for positioning.

5. **`buildPopup(stop, journey, idx)`** — returns an HTML string for the Leaflet popup. Content is from the static `JOURNEYS` data, so no sanitisation is needed, but keep it that way — don't interpolate user-supplied strings here.

6. **Draw/remove** — `drawJourney` creates all `L.marker` + optional `L.polyline` instances and stores them in `state.layers[id]`. `removeJourney` tears them back down. Tile layers are never recreated.

7. **Trace animation** — `startTrace` / `stopTrace`. During a trace the static polyline is removed and rebuilt incrementally stop-by-stop using `setTimeout` + `TRACE_DELAY` (2200 ms). `restorePolyline` recreates the full static line when the trace ends or is stopped.

8. **Sidebar** — `renderSidebar` does a full innerHTML replacement on `#journey-list` each time state changes (safe at this data size). Stop items carry `data-jid` and `data-idx` attributes so click/hover handlers can look up the correct Leaflet marker in `state.layers`.

9. **Toggle / show-all / clear** — mutate `state.activeIds`, call `drawJourney` / `removeJourney`, then always call `updateEmptyState()` + `renderSidebar()` to keep DOM in sync.

### Key design constraints

- **No `style.transform` on marker elements.** Leaflet owns that property for positioning. Use `el.style.filter` for visual hover effects instead.
- **`renderSidebar` is a full re-render.** Don't try to patch individual sidebar nodes — just call it after any state change.
- **Trace owns the polyline.** While `state.tracingId` is set, the journey's `state.layers[id].polyline` is `null`; `restorePolyline` must be called before the field can be used again.
- **`constellation` journeys never get a polyline.** The `drawJourney` and trace functions both branch on `journey.type`.

## Adding a new book

Copy any existing entry in the `JOURNEYS` array. Use `type: "route"` for journeys with a narrative sequence, `type: "constellation"` for a thematically-linked but geographically-dispersed set of places. Pick a muted, distinct hex colour. Add a `note` field to any stop whose coordinates are approximate or conventional.
