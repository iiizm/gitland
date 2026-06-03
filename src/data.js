import githubSnapshot from "./github-data.json";

const DAYS = 90;

export const TOPICS = [
  { id: "ai", label: "AI Citadel", color: "#1e5f9d", roof: "#354365", center: [-225, -125] },
  { id: "frontend", label: "Frontend Quarter", color: "#2f7f42", roof: "#8e2f27", center: [0, -225] },
  { id: "infra", label: "Infra Hills", color: "#515b66", roof: "#3f3a32", center: [215, -105] },
  { id: "database", label: "Database Borough", color: "#6b378e", roof: "#4b254a", center: [205, 130] },
  { id: "mobile", label: "Mobile Harbor", color: "#16848e", roof: "#6f5a2f", center: [-10, 225] },
  { id: "game", label: "Game Commons", color: "#a84724", roof: "#8f2f22", center: [-215, 115] }
];

const REPO_BLUEPRINTS = [
  ["tensorflow/tensorflow", "ai", 188000, 74200, 9100, 1.0, "Machine learning realm with many guilds at work."],
  ["pytorch/pytorch", "ai", 92100, 24100, 6400, 0.98, "Deep learning forge with a busy contributor square."],
  ["huggingface/transformers", "ai", 143000, 30100, 5300, 1.18, "Model library citadel with fast-rising banners."],
  ["langchain-ai/langchain", "ai", 105000, 16400, 3800, 1.35, "Agentic tooling guild hall with dense market traffic."],
  ["openai/openai-python", "ai", 26300, 3700, 710, 1.12, "Client library manor near the AI citadel."],
  ["ollama/ollama", "ai", 131000, 10300, 2300, 1.42, "Local model stronghold drawing a festival crowd."],
  ["microsoft/autogen", "ai", 50200, 7700, 1200, 1.08, "Multi-agent workshop with active roads."],
  ["vercel/ai", "ai", 17200, 2600, 410, 1.24, "Application AI outpost with warm windows."],

  ["facebook/react", "frontend", 229000, 47300, 6700, 0.72, "Old royal castle of component craft."],
  ["vuejs/core", "frontend", 47600, 8300, 860, 0.66, "Green-roofed guild hall beside the frontend square."],
  ["sveltejs/svelte", "frontend", 79600, 4400, 980, 0.86, "Bright manor with animated town banners."],
  ["vitejs/vite", "frontend", 71100, 6500, 940, 1.05, "Fast build tower with lively cart roads."],
  ["tailwindlabs/tailwindcss", "frontend", 84200, 4200, 990, 0.82, "Tailor guild with colored pennants."],
  ["storybookjs/storybook", "frontend", 84100, 9300, 1100, 0.74, "Component theater near the quarter gate."],
  ["remix-run/remix", "frontend", 31500, 2600, 460, 0.7, "Route smiths working around a compact manor."],
  ["pmndrs/react-three-fiber", "frontend", 29200, 1400, 390, 0.9, "Canvas artisan house close to the game road."],

  ["kubernetes/kubernetes", "infra", 112000, 39500, 3600, 0.82, "Cloud fortress with many outer towers."],
  ["docker/compose", "infra", 34400, 5200, 810, 0.58, "Container harbor warehouse on the infra road."],
  ["hashicorp/terraform", "infra", 43200, 9500, 950, 0.7, "Stone planner keep in the hills."],
  ["prometheus/prometheus", "infra", 57900, 9200, 870, 0.76, "Observability watchtower with bell lights."],
  ["grafana/grafana", "infra", 68100, 12500, 1000, 0.84, "Dashboard manor with bright upper windows."],
  ["ansible/ansible", "infra", 64100, 24500, 1500, 0.54, "Automation guild hall with broad roads."],
  ["denoland/deno", "infra", 101000, 5600, 1700, 0.92, "Runtime castle overlooking the hills."],
  ["bun-sh/bun", "infra", 78100, 2800, 1100, 1.32, "New high-speed keep with fresh banners."],

  ["postgres/postgres", "database", 17400, 4800, 520, 0.42, "Ancient archive tower with steady lanterns."],
  ["redis/redis", "database", 68600, 23000, 1200, 0.64, "Key-value castle with a red tiled roof."],
  ["mongodb/mongo", "database", 26600, 5700, 560, 0.48, "Document store manor near the market."],
  ["supabase/supabase", "database", 79900, 7200, 1500, 1.2, "Open-source backend city with rising crowds."],
  ["prisma/prisma", "database", 41900, 1600, 600, 0.82, "Schema workshop with precise stone paths."],
  ["duckdb/duckdb", "database", 27600, 2200, 490, 1.08, "Analytical hall growing fast on the borough edge."],
  ["clickhouse/clickhouse", "database", 38600, 7100, 710, 0.88, "Columnar bastion with lively worker traffic."],
  ["sqlite/sqlite", "database", 10300, 1500, 240, 0.32, "Small but venerable archive cottage."],

  ["flutter/flutter", "mobile", 168000, 28400, 3800, 0.74, "Harbor castle for cross-platform builders."],
  ["facebook/react-native", "mobile", 119000, 24600, 2300, 0.62, "Twin gate citadel facing the mobile harbor."],
  ["expo/expo", "mobile", 33700, 5100, 660, 0.98, "Launch guild with many messenger routes."],
  ["ionic-team/ionic-framework", "mobile", 51100, 13600, 840, 0.46, "Older harbor manor with steady docks."],
  ["fastlane/fastlane", "mobile", 40500, 5700, 740, 0.38, "Release road station by the water."],
  ["realm/realm-swift", "mobile", 16400, 2200, 280, 0.42, "Swift archive house near the quay."],

  ["godotengine/godot", "game", 93400, 20600, 1900, 1.05, "Open game castle with a crowded square."],
  ["bevyengine/bevy", "game", 40100, 4100, 820, 1.16, "Rust game guild rising around new banners."],
  ["Unity-Technologies/ml-agents", "game", 16700, 4300, 390, 0.5, "Training yard on the AI road."],
  ["playcanvas/engine", "game", 9700, 1500, 190, 0.4, "Web game workshop with simple brick roofs."],
  ["pixijs/pixijs", "game", 44100, 4700, 580, 0.62, "2D renderer guild hall near the commons."],
  ["mrdoob/three.js", "game", 104000, 35700, 2100, 0.86, "3D engine castle with roads to every quarter."]
];

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function makeHistory(name, stars, heatBias) {
  const random = mulberry32(hashString(name));
  const baseStars = Math.max(1, Math.log10(stars) - 2.8);
  const history = [];

  for (let day = 0; day < DAYS; day += 1) {
    const recency = day / (DAYS - 1);
    const wave = 0.72 + Math.sin(day * 0.23 + random() * 0.8) * 0.18;
    const launchBump = heatBias > 1 ? Math.pow(recency, 2.3) * (heatBias - 0.9) : 0;
    const pulse = random() > 0.92 ? 1 + random() * heatBias : 1;
    const activity = Math.max(0.12, heatBias * wave + launchBump) * pulse;

    history.push({
      day: day - DAYS + 1,
      stars: Math.round((baseStars * 7 + random() * 5) * activity),
      forks: Math.round((baseStars * 1.3 + random() * 2.5) * activity),
      commits: Math.round((baseStars * 9 + random() * 16) * activity),
      pullRequests: Math.round((baseStars * 2.5 + random() * 6) * activity),
      issues: Math.round((baseStars * 3.2 + random() * 7) * activity),
      releases: random() > 0.9 - heatBias * 0.04 ? 1 : 0,
      contributors: Math.round((baseStars * 1.8 + random() * 8) * activity)
    });
  }

  return history;
}

function topicTags(topic) {
  const common = {
    ai: ["ai", "models", "agents", "python"],
    frontend: ["frontend", "typescript", "ui", "web"],
    infra: ["infra", "cloud", "runtime", "ops"],
    database: ["database", "sql", "backend", "storage"],
    mobile: ["mobile", "ios", "android", "release"],
    game: ["game", "graphics", "engine", "realtime"]
  };

  return common[topic] ?? ["unknown"];
}

export function createRepoDataset() {
  if (githubSnapshot.source === "github-rest" && Array.isArray(githubSnapshot.repos) && githubSnapshot.repos.length) {
    return githubSnapshot.repos.map((repo) => ({
      id: repo.fullName,
      owner: repo.owner,
      name: repo.name,
      fullName: repo.fullName,
      url: repo.url,
      topic: repo.topic,
      topics: repo.topics?.length ? repo.topics : topicTags(repo.topic),
      stars: repo.stars ?? 0,
      forks: repo.forks ?? 0,
      watchers: repo.watchers ?? 0,
      language: repo.language ?? "Unknown",
      description: repo.description || "Public GitHub repository collected from the live API.",
      openIssues: repo.openIssues ?? 0,
      pushedAt: repo.pushedAt,
      updatedAt: repo.updatedAt,
      coverage: repo.coverage,
      history: normalizeHistory(repo.history)
    }));
  }

  return REPO_BLUEPRINTS.map(([fullName, topic, stars, forks, watchers, heatBias, description]) => {
    const [owner, name] = fullName.split("/");
    return {
      id: fullName,
      owner,
      name,
      fullName,
      topic,
      topics: topicTags(topic),
      stars,
      forks,
      watchers,
      description,
      history: makeHistory(fullName, stars, heatBias)
    };
  });
}

function normalizeHistory(history = []) {
  const safeHistory = history.slice(-DAYS);
  const missing = DAYS - safeHistory.length;
  const empty = Array.from({ length: Math.max(0, missing) }, (_, index) => ({
    day: index - DAYS + 1,
    stars: 0,
    forks: 0,
    commits: 0,
    pullRequests: 0,
    issues: 0,
    releases: 0,
    contributors: 0
  }));

  return [...empty, ...safeHistory].map((day, index) => ({
    day: index - DAYS + 1,
    date: day.date,
    stars: day.stars ?? 0,
    forks: day.forks ?? 0,
    commits: day.commits ?? 0,
    pullRequests: day.pullRequests ?? 0,
    issues: day.issues ?? 0,
    releases: day.releases ?? 0,
    contributors: day.contributors ?? 0
  }));
}

function sumRecent(history, days) {
  return history.slice(-days).reduce(
    (total, day) => ({
      stars: total.stars + day.stars,
      forks: total.forks + day.forks,
      commits: total.commits + day.commits,
      pullRequests: total.pullRequests + day.pullRequests,
      issues: total.issues + day.issues,
      releases: total.releases + day.releases,
      contributors: total.contributors + day.contributors
    }),
    { stars: 0, forks: 0, commits: 0, pullRequests: 0, issues: 0, releases: 0, contributors: 0 }
  );
}

function norm(value, max) {
  if (!max) return 0;
  return clamp(value / max, 0, 1);
}

function activityTotal(recent) {
  return (
    (recent?.stars ?? 0) +
    (recent?.forks ?? 0) +
    (recent?.commits ?? 0) +
    (recent?.pullRequests ?? 0) +
    (recent?.issues ?? 0) +
    (recent?.releases ?? 0) +
    (recent?.contributors ?? 0)
  );
}

function dominantSignal(recent) {
  const entries = [
    ["stars", recent?.stars ?? 0],
    ["commits", recent?.commits ?? 0],
    ["pullRequests", recent?.pullRequests ?? 0],
    ["issues", recent?.issues ?? 0],
    ["releases", recent?.releases ?? 0],
    ["contributors", recent?.contributors ?? 0]
  ];
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "stars";
}

export function buildWorldData(days = 90) {
  const safeDays = clamp(days, 7, DAYS);
  const repos = createRepoDataset().map((repo) => ({
    ...repo,
    recent: sumRecent(repo.history, safeDays),
    activityByWindow: {
      7: sumRecent(repo.history, 7),
      30: sumRecent(repo.history, 30),
      90: sumRecent(repo.history, 90)
    }
  }));

  const influenceValues = repos.map((repo) => Math.log10(repo.stars + repo.forks * 2 + repo.watchers * 4 + 10));
  const minInfluence = Math.min(...influenceValues);
  const maxInfluence = Math.max(...influenceValues);
  const maxRecentStars = Math.max(...repos.map((repo) => repo.recent.stars));
  const maxCommits = Math.max(...repos.map((repo) => repo.recent.commits));
  const maxPullRequests = Math.max(...repos.map((repo) => repo.recent.pullRequests));
  const maxIssues = Math.max(...repos.map((repo) => repo.recent.issues));
  const maxReleases = Math.max(...repos.map((repo) => repo.recent.releases));
  const maxContributors = Math.max(...repos.map((repo) => repo.recent.contributors));

  const maxActivity = Math.max(...repos.map((repo) => activityTotal(repo.recent)));
  const clustered = repos.map((repo) => {
    const topicIndex = TOPICS.findIndex((topic) => topic.id === repo.topic);
    const topic = TOPICS[topicIndex] ?? TOPICS[0];
    const random = mulberry32(hashString(`${repo.id}:${days}`));
    const ordinal = repos.filter((item) => item.topic === repo.topic).findIndex((item) => item.id === repo.id);
    const totalInTopic = repos.filter((item) => item.topic === repo.topic).length;
    const angle = ordinal * 2.399963 + random() * 0.35;
    const radius = 16 + Math.sqrt(ordinal) * 5.6 + random() * 5 + Math.floor(ordinal / 32) * 2.6;
    const influenceRaw = Math.log10(repo.stars + repo.forks * 2 + repo.watchers * 4 + 10);
    const influence = norm(influenceRaw - minInfluence, maxInfluence - minInfluence);
    const hotness = clamp(
      norm(repo.recent.stars, maxRecentStars) * 0.28 +
        norm(repo.recent.commits, maxCommits) * 0.18 +
        norm(repo.recent.pullRequests, maxPullRequests) * 0.17 +
        norm(repo.recent.issues, maxIssues) * 0.13 +
        norm(repo.recent.releases, maxReleases) * 0.08 +
        norm(repo.recent.contributors, maxContributors) * 0.16,
      0,
      1
    );
    const peopleCount = clamp(
      Math.round(1 + hotness * 18 + norm(repo.recent.contributors, maxContributors) * 16),
      1,
      38
    );
    const buildingType =
      influence > 0.82 || repo.stars > 100000
        ? "castle"
        : influence > 0.67
          ? "guildhall"
          : influence > 0.5
            ? "manor"
            : "house";

    const recentActivityTotal = activityTotal(repo.recent);
    const trendScore = clamp(hotness * 0.7 + influence * 0.12 + norm(recentActivityTotal, maxActivity) * 0.18, 0, 1);

    return {
      ...repo,
      topicLabel: topic.label,
      topicColor: topic.color,
      roofColor: topic.roof,
      influence,
      hotness,
      trendScore,
      recentActivityTotal,
      dominantSignal: dominantSignal(repo.recent),
      peopleCount,
      buildingType,
      topicOrdinal: ordinal,
      topicRepoCount: totalInTopic,
      detailLevel: ordinal < 8 || influence > 0.82 ? "full" : "outpost",
      height: 3.5 + influence * 15 + hotness * 4,
      position: {
        x: topic.center[0] + Math.cos(angle) * radius + (random() - 0.5) * 16,
        z: topic.center[1] + Math.sin(angle) * radius + (random() - 0.5) * 16
      }
    };
  });

  const topicSummaryById = new Map((githubSnapshot.topics ?? []).map((topic) => [topic.id, topic]));
  const globalTrendRepos = [...clustered].sort(
    (a, b) =>
      b.trendScore - a.trendScore ||
      b.hotness - a.hotness ||
      b.recent.stars - a.recent.stars ||
      b.influence - a.influence
  );
  globalTrendRepos.forEach((repo, index) => {
    repo.globalTrendRank = index + 1;
  });

  const topicTrendInputs = TOPICS.map((topic) => {
    const topicRepos = clustered.filter((repo) => repo.topic === topic.id);
    const topRepos = [...topicRepos].sort(
      (a, b) =>
        b.trendScore - a.trendScore ||
        b.hotness - a.hotness ||
        b.recent.stars - a.recent.stars ||
        b.influence - a.influence
    );
    topRepos.forEach((repo, index) => {
      repo.topicRepoRank = index + 1;
    });
    const risingLimit = topicRepos.length ? Math.max(1, Math.ceil(topicRepos.length * 0.08)) : 0;
    const risingThreshold = risingLimit ? topRepos[Math.min(topRepos.length - 1, risingLimit - 1)]?.hotness ?? 0 : 0;
    const recentTotals = topicRepos.reduce(
      (total, repo) => ({
        stars: total.stars + repo.recent.stars,
        forks: total.forks + repo.recent.forks,
        commits: total.commits + repo.recent.commits,
        pullRequests: total.pullRequests + repo.recent.pullRequests,
        issues: total.issues + repo.recent.issues,
        releases: total.releases + repo.recent.releases,
        contributors: total.contributors + repo.recent.contributors
      }),
      { stars: 0, forks: 0, commits: 0, pullRequests: 0, issues: 0, releases: 0, contributors: 0 }
    );
    return {
      topic,
      repos: topicRepos,
      topRepos,
      recentTotals,
      totalActivity: activityTotal(recentTotals),
      hotRepoCount: topicRepos.filter((repo) => repo.hotness >= risingThreshold && risingThreshold > 0).length,
      averageHotness: topicRepos.reduce((total, repo) => total + repo.hotness, 0) / Math.max(1, topicRepos.length)
    };
  });
  const maxTopicActivity = Math.max(...topicTrendInputs.map((input) => input.totalActivity));
  const maxHotRepoCount = Math.max(...topicTrendInputs.map((input) => input.hotRepoCount));
  const topicTrends = topicTrendInputs
    .map((input) => {
      const topRepo = input.topRepos[0] ?? null;
      const trendScore = clamp(
        input.averageHotness * 0.56 +
          (topRepo?.hotness ?? 0) * 0.24 +
          norm(input.totalActivity, maxTopicActivity) * 0.14 +
          norm(input.hotRepoCount, maxHotRepoCount) * 0.06,
        0,
        1
      );
      const sourceSummary = topicSummaryById.get(input.topic.id) ?? {};
      return {
        topic: input.topic.id,
        label: input.topic.label,
        query: sourceSummary.query ?? null,
        candidateCount: sourceSummary.totalCount ?? input.repos.length,
        fetchedCount: sourceSummary.fetchedCount ?? input.repos.length,
        pagesFetched: sourceSummary.pagesFetched ?? null,
        renderedCount: input.repos.length,
        averageHotness: input.averageHotness,
        score: trendScore,
        totalActivity: input.totalActivity,
        hotRepoCount: input.hotRepoCount,
        recentTotals: input.recentTotals,
        topRepoId: topRepo?.id ?? null,
        topRepoName: topRepo?.fullName ?? null,
        topRepoHotness: topRepo?.hotness ?? 0,
        topRepoLanguage: topRepo?.language ?? "Unknown",
        dominantSignal: dominantSignal(input.recentTotals),
        topRepos: input.topRepos.slice(0, 5).map((repo) => ({
          id: repo.id,
          name: repo.fullName,
          url: repo.url ?? `https://github.com/${repo.fullName}`,
          hotness: repo.hotness,
          trendScore: repo.trendScore,
          topicRank: repo.topicRepoRank,
          globalRank: repo.globalTrendRank,
          stars: repo.stars,
          language: repo.language ?? "Unknown",
          dominantSignal: repo.dominantSignal,
          recent: repo.recent
        }))
      };
    })
    .sort((a, b) => b.score - a.score || b.averageHotness - a.averageHotness || b.totalActivity - a.totalActivity);
  topicTrends.forEach((trend, index) => {
    trend.rank = index + 1;
  });
  const trendByTopic = new Map(topicTrends.map((trend) => [trend.topic, trend]));
  for (const repo of clustered) {
    const topicTrend = trendByTopic.get(repo.topic);
    repo.topicTrendRank = topicTrend?.rank ?? 0;
    repo.topicTrendScore = topicTrend?.score ?? 0;
    repo.topicTopRepoName = topicTrend?.topRepoName ?? null;
    repo.isTopicTopRepo = repo.id === topicTrend?.topRepoId;
  }

  const clusters = TOPICS.map((topic) => {
    const topicRepos = clustered.filter((repo) => repo.topic === topic.id);
    const averageHotness =
      topicRepos.reduce((total, repo) => total + repo.hotness, 0) / Math.max(1, topicRepos.length);
    const trend = trendByTopic.get(topic.id);
    return {
      ...topic,
      repoCount: topicRepos.length,
      averageHotness,
      trend,
      trendRank: trend?.rank ?? 0,
      trendScore: trend?.score ?? 0,
      topRepoId: trend?.topRepoId ?? null,
      topRepoName: trend?.topRepoName ?? null,
      topRepoHotness: trend?.topRepoHotness ?? 0,
      hotRepoCount: trend?.hotRepoCount ?? 0,
      totalActivity: trend?.totalActivity ?? 0,
      recentTotals: trend?.recentTotals ?? null,
      centroid: { x: topic.center[0], z: topic.center[1] }
    };
  });

  const eventDerivedCount = clustered.filter((repo) => repo.coverage?.source === "github-rest-events").length;
  const metadataEstimatedCount = clustered.filter((repo) => repo.coverage?.source !== "github-rest-events").length;

  return {
    dataSource: githubSnapshot.source === "github-rest" && githubSnapshot.repos?.length ? "github-rest" : "sample",
    collectedAt: githubSnapshot.collectedAt ?? null,
    timeWindowDays: safeDays,
    generatedDays: DAYS,
    trend: {
      windowDays: safeDays,
      collectedAt: githubSnapshot.collectedAt ?? null,
      dataSource: githubSnapshot.source === "github-rest" && githubSnapshot.repos?.length ? "github-rest" : "sample",
      authenticated: Boolean(githubSnapshot.authenticated),
      repositoryUniverseCount:
        githubSnapshot.repositoryUniverseCount ?? githubSnapshot.repositoryCount ?? clustered.length,
      renderedRepositoryCount: clustered.length,
      coverage: {
        eventDerivedCount,
        metadataEstimatedCount
      },
      hotTopics: topicTrends,
      hotRepos: globalTrendRepos.slice(0, 18).map((repo, index) => ({
        rank: index + 1,
        topicRank: repo.topicRepoRank,
        name: repo.fullName,
        url: repo.url ?? `https://github.com/${repo.fullName}`,
        topic: repo.topic,
        topicLabel: repo.topicLabel,
        language: repo.language ?? "Unknown",
        description: repo.description,
        stars: repo.stars,
        forks: repo.forks,
        watchers: repo.watchers,
        hotness: repo.hotness,
        influence: repo.influence,
        score: repo.trendScore,
        activityTotal: repo.recentActivityTotal,
        activityBreakdown: repo.recent,
        dominantSignal: repo.dominantSignal,
        coverageSource: repo.coverage?.source ?? "sample-history"
      }))
    },
    representedRepositoryTotal:
      githubSnapshot.repositoryUniverseCount ?? githubSnapshot.repositoryCount ?? clustered.length,
    repos: clustered,
    clusters
  };
}
