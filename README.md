# GitLand

GitLand is a medieval 3D map of GitHub activity. Repositories become buildings, topic groups become towns, repository relationships become roads, and recent activity becomes visible life in the world.

The project is built as a Vite + Three.js web app. It includes a checked-in GitHub REST dataset so the map works immediately after cloning, plus a collector script that can refresh the data from the GitHub API.

## What You Are Looking At

GitLand turns repository metrics into a navigable kingdom:

- A repository is a building.
- A topic group is a village or district.
- High-influence repositories become larger structures or castles.
- Lower-influence repositories become houses or outposts.
- Roads express topic-level and repository-level relationships.
- People express recent activity and contributor-like motion.
- The camera is an aerial map camera with mouse wheel zoom, drag panning, keyboard movement, and a minimap.

The current visual direction is a medieval strategy-game world: castles, manors, houses, roads, banners, crowds, forests, mountains, fields, plazas, and topic-colored districts.

## Current Data Snapshot

The repository currently includes a collected GitHub REST snapshot at `src/github-data.json`.

Current checked-in data:

- Source: GitHub REST API
- Collection time: `2026-05-21T06:43:22.224Z`
- Rendered repositories: `1,189`
- Focused 90-day candidate universe: `1,227`
- Window: up to 90 days

The checked-in data lets the app run without a token. You only need a token if you want to refresh or expand the dataset.

## Quick Start

From a fresh clone:

```bash
npm install
npm run dev
```

Vite will print a local URL, usually:

```text
http://127.0.0.1:5173/
```

If you want to use a specific port:

```bash
npm run dev -- --port 5174
```

Then open the printed URL in a browser.

The main map is available at:

```text
/
```

The experimental building selection page is available at:

```text
/building-gallery.html
```

## Controls

- Mouse wheel: zoom between street-level and aerial map view.
- Drag with left mouse button: pan around the kingdom.
- Drag with right mouse button, or hold Shift while dragging: rotate the camera.
- `W`, `A`, `S`, `D` or arrow keys: move the camera target.
- `F`: toggle fullscreen.
- Time buttons: switch between 7-day, 30-day, and 90-day activity windows.
- Minimap: shows districts, repositories, and the current camera target.
- Click a building: open the repository detail panel.
- Hover a building: show a compact repository label.

## Project Structure

```text
.
├── index.html
├── package.json
├── scripts
│   ├── collect-github-data.js
│   └── smoke-test.js
└── src
    ├── data.js
    ├── github-data.json
    ├── main.js
    ├── styles.css
    └── world.js
```

Important files:

- `src/world.js`: Three.js scene, terrain, buildings, roads, people, camera, minimap, and test hooks.
- `src/data.js`: transforms repository data into world entities, clusters, metrics, building types, positions, and histories.
- `src/github-data.json`: checked-in GitHub REST snapshot used by default.
- `src/main.js`: DOM bindings, HUD updates, selection panel, hover panel, and public debug hooks.
- `scripts/collect-github-data.js`: GitHub REST data collector.
- `scripts/smoke-test.js`: Playwright-based smoke test.
- `progress.md`: development notes and history for future iteration.

## Metric Mapping

GitLand derives visual meaning from repository data:

- `influence`: long-term weight from stars, forks, and watchers.
- `hotness`: recent activity from stars, commits, pull requests, issues, releases, and contributors.
- `buildingType`: castle, guildhall, manor, or house.
- `height`: influenced by long-term influence and recent hotness.
- `peopleCount`: derived from recent contributors and activity.
- `topic`: controls village placement, colors, labels, district identity, and road grouping.
- `detailLevel`: high-impact repositories get full geometry; lower-ranked repositories can be rendered as lighter outposts.

The app supports three time windows: 7 days, 30 days, and 90 days. Switching the window recomputes recent activity and updates hotness, people, labels, and visual emphasis.

## Data Collection

The app can refresh `src/github-data.json` from the GitHub REST API:

```bash
npm run collect:data
```

The collector reads `.env` automatically if it exists. `.env` is ignored by git and must not be committed.

Start from the checked-in sample file:

```bash
cp .env.example .env
```

Then edit `.env` and add your own token if you want to refresh live data.

Recommended `.env` shape:

```bash
GITHUB_TOKEN=your_token_here
GITLAND_PER_TOPIC=1000
GITLAND_EVENT_REPOS_PER_TOPIC=1000
GITLAND_EVENT_PAGES=3
GITLAND_EVENT_CONCURRENCY=3
GITLAND_PAGE_DELAY_MS=120
```

Supported environment variables:

- `GITHUB_TOKEN` or `GH_TOKEN`: optional GitHub token for higher API limits.
- `GITLAND_DAYS`: number of days to collect, default `90`.
- `GITLAND_PER_TOPIC`: repositories requested per topic query, default `30`, capped by GitHub search limits.
- `GITLAND_OUT`: output path, default `src/github-data.json`.
- `GITLAND_EVENT_PAGES`: event pages per repository, default `3` with a token and `1` without.
- `GITLAND_EVENT_REPOS_PER_TOPIC`: repositories per topic that receive exact event collection.
- `GITLAND_EVENT_CONCURRENCY`: concurrent event collection workers.
- `GITLAND_PAGE_DELAY_MS`: delay between paginated API calls.

The collector searches six focused topic areas:

- AI
- Frontend
- Infrastructure
- Database
- Mobile
- Game engines

For repositories where public event collection is skipped or fails, the collector still stores real repository metadata and estimates daily activity from metadata. The `coverage` field on each repository explains whether its recent history came from public events or metadata estimation.

## Testing

Build the app:

```bash
npm run build
```

Run the smoke test while the dev server is running:

```bash
npm run smoke -- --url http://127.0.0.1:5173
```

If your dev server is on port `5174`:

```bash
npm run smoke -- --url http://127.0.0.1:5174
```

The smoke test checks:

- The scene loads.
- The theme is medieval.
- The default time window is 90 days.
- Many repository buildings are present.
- At least one castle is visible.
- Crowd activity exists.
- Mouse wheel zoom changes camera distance.
- Dragging pans the camera.
- Clicking a visible castle selects a repository.
- The 30-day time control works.
- The canvas does not look blank.
- No browser console errors were captured.

The smoke test writes a screenshot to:

```text
test-results/gitland-smoke.png
```

`test-results` is ignored by git.

## Browser Debug Hooks

The app exposes a few browser globals for automated inspection:

```js
window.render_game_to_text()
window.advanceTime(ms)
window.gitland.setTimeWindow(days)
window.gitland.selectRepo(repoId)
```

`window.render_game_to_text()` returns JSON with scene state, camera state, cluster summaries, repository screen positions, selected repository information, performance counters, and captured errors.

The building lab page also exposes:

```js
window.render_game_to_text()
window.advanceTime(ms)
window.gitlandBuildingLab.setFamily(family)
window.gitlandBuildingLab.inspectVariant(variantId)
```

Its text state reports the active building family, selected variant, visible candidate count, camera state, and captured browser errors.

## Git and Secrets

Do not commit local secrets.

Ignored by `.gitignore`:

- `.env`
- `.env.local`
- `node_modules`
- `dist`
- `output`
- `test-results`
- log files

The checked-in dataset is safe to run without a token. Tokens are only needed for data refreshes.

## Known Limitations

- The visual assets are procedural Three.js geometry and canvas textures, not a curated GLTF/PBR asset pipeline.
- The full 1,189-repository view is heavy and can produce many draw calls.
- Roads and people are currently dense enough to show the data volume, but future iterations should add stronger hierarchy and level-of-detail.
- GitHub REST search has a practical 1,000-result window per query, so the dataset is a focused topic universe rather than every public GitHub repository.
- Public repository events are limited by GitHub availability and rate limits.

## Next Iteration Ideas

- Reduce road density while keeping all buildings and people visible.
- Expand the map scale for a stronger open-world exploration feel.
- Raise the maximum aerial zoom-out distance.
- Improve screenshot freshness by writing unique test artifact directories per run.
- Add real medieval GLTF kits and PBR materials for higher visual realism.
- Batch or instance more building details to reduce draw calls.
- Add stronger village identity through terrain color, architecture variations, district plazas, and road hierarchy.
