import { GitLandWorld } from "./world.js";

window.__gitlandErrors = { consoleErrors: [], assetErrors: [], webglErrors: [] };

const originalConsoleError = console.error.bind(console);
console.error = (...args) => {
  window.__gitlandErrors.consoleErrors.push(args.map(String).join(" "));
  originalConsoleError(...args);
};

window.addEventListener("error", (event) => {
  window.__gitlandErrors.assetErrors.push(event.message || "window error");
});

window.addEventListener("unhandledrejection", (event) => {
  window.__gitlandErrors.consoleErrors.push(String(event.reason ?? "unhandled rejection"));
});

const canvas = document.querySelector("#world");
const minimap = document.querySelector("#minimap");
const districtLabelLayer = document.querySelector("#district-label-layer");
const hoverLabel = document.querySelector("#hover-label");
const selectionPanel = document.querySelector("#selection-panel");
const repoCount = document.querySelector("#repo-count");
const activeWindow = document.querySelector("#active-window");
const dataSource = document.querySelector("#data-source");
const altitudeMarker = document.querySelector("#altitude-marker");
const legend = document.querySelector("#legend");
const legendToggle = document.querySelector("#legend-toggle");

const numberFormat = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatNumber(value) {
  return numberFormat.format(value);
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function renderSelection(repo) {
  if (!repo) {
    selectionPanel.classList.add("hidden");
    selectionPanel.textContent = "";
    return;
  }

  selectionPanel.classList.remove("hidden");
  const settlementType = repo.settlementRenderedFull ? `${repo.settlementType} stage ${repo.settlementStage}` : "outpost";
  const clan = repo.settlementClan ?? repo.speciesSignature?.clanId ?? repo.topicLabel;
  const pick = repo.settlementPickId ?? repo.speciesGlyph ?? "instanced-outpost";
  selectionPanel.innerHTML = `
    <div class="selection-title">
      <h2>${escapeHtml(repo.fullName)}</h2>
      <span class="badge">${escapeHtml(repo.buildingType)}</span>
    </div>
    <p class="repo-desc">${escapeHtml(repo.description)}</p>
    <div class="metric-grid">
      <div class="metric"><small>Hotness</small><strong>${formatPercent(repo.hotness)}</strong></div>
      <div class="metric"><small>Influence</small><strong>${formatPercent(repo.influence)}</strong></div>
      <div class="metric"><small>Stars</small><strong>${formatNumber(repo.stars)}</strong></div>
      <div class="metric"><small>Forks</small><strong>${formatNumber(repo.forks)}</strong></div>
      <div class="metric"><small>90d commits</small><strong>${formatNumber(repo.recent.commits)}</strong></div>
      <div class="metric"><small>People</small><strong>${repo.peopleCount}</strong></div>
      <div class="metric"><small>Clan</small><strong>${escapeHtml(clan)}</strong></div>
      <div class="metric"><small>Settlement</small><strong>${escapeHtml(settlementType)}</strong></div>
    </div>
    <p class="repo-desc settlement-desc">${escapeHtml(pick)}</p>
    <div class="topic-list">
      ${repo.topics.map((topic) => `<span class="topic-token">${escapeHtml(topic)}</span>`).join("")}
    </div>
  `;
}

function renderHover(repo, pointer) {
  if (!repo || !pointer) {
    hoverLabel.classList.add("hidden");
    hoverLabel.textContent = "";
    return;
  }

  hoverLabel.classList.remove("hidden");
  const settlementType = repo.settlementRenderedFull ? `${repo.settlementType} ${repo.settlementStage}` : "outpost";
  const clan = repo.settlementClan ?? repo.speciesGlyph ?? repo.topicLabel;
  hoverLabel.textContent = `${repo.fullName} · ${formatPercent(repo.hotness)} · ${clan} · ${settlementType}`;
  hoverLabel.style.left = `${Math.min(window.innerWidth - hoverLabel.offsetWidth - 12, pointer.x + 14)}px`;
  hoverLabel.style.top = `${Math.max(12, pointer.y - 34)}px`;
}

const world = new GitLandWorld({
  canvas,
  minimap,
  districtLabelLayer,
  onStats(data) {
    repoCount.textContent =
      data.representedRepositoryTotal && data.representedRepositoryTotal > data.repos.length
        ? `${formatNumber(data.repos.length)} representative buildings / ${formatNumber(data.representedRepositoryTotal)} candidates`
        : `${formatNumber(data.repos.length)} representative buildings`;
    activeWindow.textContent = String(data.timeWindowDays);
    dataSource.textContent = data.dataSource === "github-rest" ? "GitHub live representative sample" : "sample";
  },
  onHover: renderHover,
  onSelect: renderSelection,
  onAltitude(value) {
    altitudeMarker.style.left = `${value * 100}%`;
  }
});

for (const button of document.querySelectorAll(".time-pill")) {
  button.addEventListener("click", () => {
    const days = Number(button.dataset.days);
    document.querySelectorAll(".time-pill").forEach((item) => item.classList.toggle("active", item === button));
    world.setTimeWindow(days);
  });
}

legendToggle.addEventListener("click", () => {
  legend.classList.toggle("collapsed");
});

window.render_game_to_text = () => world.renderGameToText();
window.advanceTime = (ms) => world.advanceTime(ms);
window.gitland = {
  setTimeWindow: (days) => world.setTimeWindow(days),
  selectRepo: (repoId) => {
    const repo = world.worldData.repos.find((item) => item.id === repoId) ?? null;
    world.selectedRepo = repo;
    renderSelection(repo);
  }
};
