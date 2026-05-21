# GitLand

GitLand turns GitHub repositories into a medieval 3D kingdom. Repositories become buildings, topics become villages, and recent 90-day activity becomes crowds, lights, roads, and banners.

## Run

```bash
npm install
npm run collect:data
npm run dev
```

## Current Scope

- Live GitHub REST data collection into `src/github-data.json`, with sample fallback.
- Aerial map navigation with wheel zoom, drag pan, and keyboard movement.
- Medieval castles, manors, houses, topic villages, roads, crowds, banners, trees, mountains, and a minimap.
- `window.render_game_to_text()` and `window.advanceTime(ms)` for automated inspection.

## Data Model

The app keeps up to 90 daily samples per repository and derives:

- `influence`: long-term stars, forks, and watchers.
- `hotness`: recent stars, commits, PRs, issues, releases, and contributors.
- `peopleCount`: visible crowd density from recent contributors and discussion activity.

Run `npm run collect:data` to refresh the live dataset. Set `GITHUB_TOKEN` or `GH_TOKEN` before running it to raise GitHub API limits and collect more event pages per repository.
