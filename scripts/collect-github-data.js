import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";

function loadEnvFile(path = ".env") {
  try {
    const text = readFileSync(path, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (!key || process.env[key] !== undefined) continue;
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // .env is optional; CI and shell environments can provide variables directly.
  }
}

loadEnvFile();

const DAYS = Number(process.env.GITLAND_DAYS ?? 90);
const PER_TOPIC = Number(process.env.GITLAND_PER_TOPIC ?? 30);
const OUT_FILE = process.env.GITLAND_OUT ?? "src/github-data.json";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const EVENT_PAGES = Number(process.env.GITLAND_EVENT_PAGES ?? (TOKEN ? 3 : 1));
const EVENT_REPOS_PER_TOPIC = Number(process.env.GITLAND_EVENT_REPOS_PER_TOPIC ?? (TOKEN ? 12 : 4));
const PAGE_DELAY_MS = Number(process.env.GITLAND_PAGE_DELAY_MS ?? 250);
const EVENT_CONCURRENCY = Number(process.env.GITLAND_EVENT_CONCURRENCY ?? (TOKEN ? 3 : 1));

const TOPIC_QUERIES = [
  {
    id: "ai",
    query: "topic:machine-learning stars:>5000 archived:false",
    fallbackTopics: ["ai", "machine-learning", "models", "python"]
  },
  {
    id: "frontend",
    query: "topic:frontend stars:>5000 archived:false",
    fallbackTopics: ["frontend", "typescript", "ui", "web"]
  },
  {
    id: "infra",
    query: "topic:kubernetes stars:>3000 archived:false",
    fallbackTopics: ["infra", "cloud", "devops", "ops"]
  },
  {
    id: "database",
    query: "topic:database stars:>3000 archived:false",
    fallbackTopics: ["database", "sql", "backend", "storage"]
  },
  {
    id: "mobile",
    query: "topic:android stars:>3000 archived:false",
    fallbackTopics: ["mobile", "android", "ios", "release"]
  },
  {
    id: "game",
    query: "topic:game-engine stars:>1000 archived:false",
    fallbackTopics: ["game", "graphics", "engine", "realtime"]
  }
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await worker(items[index], index);
      }
    })
  );

  return results;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

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

function sinceDate(now) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - DAYS);
  return date.toISOString().slice(0, 10);
}

function recentQuery(query, now) {
  if (query.includes("pushed:")) return query;
  return `${query} pushed:>=${sinceDate(now)}`;
}

function parseLinkHeader(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(",").map((part) => {
      const section = part.trim();
      const url = section.match(/<([^>]+)>/)?.[1];
      const rel = section.match(/rel="([^"]+)"/)?.[1];
      return [rel, url];
    }).filter(([rel, url]) => rel && url)
  );
}

async function githubFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `https://api.github.com${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "gitland-data-collector",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }

  return {
    data: await response.json(),
    link: parseLinkHeader(response.headers.get("link")),
    remaining: response.headers.get("x-ratelimit-remaining"),
    reset: response.headers.get("x-ratelimit-reset")
  };
}

function emptyHistory(now) {
  return Array.from({ length: DAYS }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (DAYS - 1 - index));
    return {
      day: index - DAYS + 1,
      date: date.toISOString().slice(0, 10),
      stars: 0,
      forks: 0,
      commits: 0,
      pullRequests: 0,
      issues: 0,
      releases: 0,
      contributors: 0
    };
  });
}

function summarizeEvents(events, now) {
  const since = now.getTime() - DAYS * 24 * 60 * 60 * 1000;
  const history = emptyHistory(now);
  const contributorSets = history.map(() => new Set());

  for (const event of events) {
    const created = new Date(event.created_at).getTime();
    if (!Number.isFinite(created) || created < since) continue;
    const ageDays = Math.floor((now.getTime() - created) / (24 * 60 * 60 * 1000));
    const index = DAYS - 1 - ageDays;
    if (!history[index]) continue;

    const bucket = history[index];
    if (event.actor?.login) contributorSets[index].add(event.actor.login);

    if (event.type === "WatchEvent") bucket.stars += 1;
    else if (event.type === "ForkEvent") bucket.forks += 1;
    else if (event.type === "PushEvent") bucket.commits += event.payload?.commits?.length || 1;
    else if (event.type === "PullRequestEvent") bucket.pullRequests += 1;
    else if (event.type === "IssuesEvent") bucket.issues += 1;
    else if (event.type === "ReleaseEvent") bucket.releases += 1;
  }

  for (let i = 0; i < history.length; i += 1) {
    history[i].contributors = contributorSets[i].size;
  }

  return history;
}

function estimateHistoryFromRepo(repo, now) {
  const history = emptyHistory(now);
  const random = mulberry32(hashString(repo.full_name));
  const pushedAt = new Date(repo.pushed_at ?? repo.updated_at ?? now).getTime();
  const ageDays = Number.isFinite(pushedAt) ? Math.floor((now.getTime() - pushedAt) / (24 * 60 * 60 * 1000)) : DAYS;
  const activityWindow = clamp(1 - ageDays / DAYS, 0.12, 1);
  const starBase = Math.max(0.6, Math.log10((repo.stargazers_count ?? 0) + 10) - 2.35);
  const forkBase = Math.max(0.2, Math.log10((repo.forks_count ?? 0) + 10) - 1.8);
  const issueBase = Math.max(0.1, Math.log10((repo.open_issues_count ?? 0) + 10) - 1.2);

  for (let i = 0; i < history.length; i += 1) {
    const recency = i / Math.max(1, history.length - 1);
    const wave = 0.65 + Math.sin(i * 0.37 + random() * 0.9) * 0.22;
    const active = Math.pow(recency, 0.85) * activityWindow * wave;
    const pulse = random() > 0.9 ? 1.6 + random() * 1.2 : 1;
    history[i].stars = random() < 0.18 + active * 0.32 ? Math.round(starBase * active * pulse) : 0;
    history[i].forks = random() < 0.08 + active * 0.12 ? Math.round(forkBase * active) : 0;
    history[i].commits = random() < 0.2 + active * 0.5 ? Math.max(0, Math.round((1 + starBase * 1.7) * active * pulse)) : 0;
    history[i].pullRequests = random() < 0.08 + active * 0.22 ? Math.round((0.7 + forkBase) * active) : 0;
    history[i].issues = random() < 0.06 + active * 0.16 ? Math.round((0.5 + issueBase) * active) : 0;
    history[i].releases = random() > 0.965 - activityWindow * 0.025 ? 1 : 0;
    history[i].contributors = history[i].commits || history[i].pullRequests ? 1 + Math.round(random() * (1 + starBase * 1.2)) : 0;
  }

  return history;
}

async function collectRepoEvents(fullName) {
  let path = `/repos/${fullName}/events?per_page=100`;
  const events = [];

  for (let page = 0; page < EVENT_PAGES && path; page += 1) {
    const { data, link } = await githubFetch(path);
    events.push(...data);
    path = link.next ?? "";
    if (path) await sleep(PAGE_DELAY_MS);
  }

  return events;
}

async function searchRepos(topicConfig, now) {
  const queryText = recentQuery(topicConfig.query, now);
  const query = encodeURIComponent(queryText);
  const items = [];
  const maxSearchResults = Math.min(Math.max(1, PER_TOPIC), 1000);
  let totalCount = 0;
  let page = 1;

  while (items.length < maxSearchResults && page <= 10) {
    const perPage = Math.min(100, maxSearchResults - items.length);
    const { data } = await githubFetch(`/search/repositories?q=${query}&sort=stars&order=desc&per_page=${perPage}&page=${page}`);
    const pageItems = data.items ?? [];
    totalCount = data.total_count ?? totalCount;
    items.push(...pageItems);
    if (!pageItems.length || items.length >= totalCount) break;
    page += 1;
    await sleep(PAGE_DELAY_MS);
  }

  return { items, totalCount, queryText, pagesFetched: page };
}

function toRepoRecord(repo, topicConfig, history, eventsSeen) {
  return {
    id: repo.full_name,
    owner: repo.owner?.login ?? repo.full_name.split("/")[0],
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    topic: topicConfig.id,
    topics: repo.topics?.length ? repo.topics.slice(0, 6) : topicConfig.fallbackTopics,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    watchers: repo.watchers_count ?? repo.subscribers_count ?? 0,
    language: repo.language ?? "Unknown",
    description: repo.description || "Public GitHub repository collected from the live API.",
    openIssues: repo.open_issues_count ?? 0,
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
    history,
    coverage: {
      source: "github-rest-events",
      eventPages: EVENT_PAGES,
      eventsSeen,
      note:
        "Recent activity is derived from public repository events available through the GitHub REST API, capped to the latest 90 days."
    }
  };
}

async function main() {
  const now = new Date();
  const repos = [];
  const seen = new Set();
  const topicSummaries = [];

  for (const topicConfig of TOPIC_QUERIES) {
    const { items: results, totalCount, queryText, pagesFetched } = await searchRepos(topicConfig, now);
    console.log(`Searching ${topicConfig.id}: ${queryText} (${totalCount} matches, ${results.length} fetched)`);
    topicSummaries.push({ id: topicConfig.id, query: queryText, totalCount, fetchedCount: results.length, pagesFetched });
    await sleep(PAGE_DELAY_MS);

    const uniqueResults = [];
    for (const repo of results) {
      if (seen.has(repo.full_name)) continue;
      seen.add(repo.full_name);
      uniqueResults.push(repo);
    }

    let completed = 0;
    const records = await mapWithConcurrency(uniqueResults, EVENT_CONCURRENCY, async (repo, uniqueIndex) => {
      const shouldCollectEvents = uniqueIndex < EVENT_REPOS_PER_TOPIC;
      let events = [];
      let history;
      let record;

      if (shouldCollectEvents) {
        try {
          events = await collectRepoEvents(repo.full_name);
          history = summarizeEvents(events, now);
          record = toRepoRecord(repo, topicConfig, history, events.length);
        } catch (error) {
          history = estimateHistoryFromRepo(repo, now);
          record = toRepoRecord(repo, topicConfig, history, 0);
          record.coverage.source = "github-rest-search-metadata";
          record.coverage.note =
            `Repository metadata is from GitHub REST search. Daily 90-day activity is estimated because event collection failed: ${String(error.message ?? error).split("\n")[0]}`;
        }
      } else {
        history = estimateHistoryFromRepo(repo, now);
        record = toRepoRecord(repo, topicConfig, history, 0);
        record.coverage.source = "github-rest-search-metadata";
        record.coverage.note =
          "Repository identity, stars, forks, topics, language, issues, and pushed/updated timestamps are from GitHub REST search. Daily 90-day activity is estimated from metadata to keep the public API request volume practical.";
      }

      completed += 1;
      if (completed === 1 || completed === uniqueResults.length || completed % 25 === 0) {
        console.log(`  ${topicConfig.id}: ${completed}/${uniqueResults.length} processed`);
      }
      return record;
    });

    repos.push(...records);
  }

  const payload = {
    source: "github-rest",
    collectedAt: now.toISOString(),
    days: DAYS,
    perTopic: PER_TOPIC,
    eventPages: EVENT_PAGES,
    eventReposPerTopic: EVENT_REPOS_PER_TOPIC,
    eventConcurrency: EVENT_CONCURRENCY,
    authenticated: Boolean(TOKEN),
    repositoryCount: repos.length,
    repositoryUniverseCount: topicSummaries.reduce((total, topic) => total + topic.totalCount, 0),
    topics: topicSummaries,
    repos
  };

  await writeFile(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${repos.length} repositories to ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
