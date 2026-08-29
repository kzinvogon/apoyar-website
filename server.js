
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const TTL_MS = Number(process.env.STATS_REFRESH_MINUTES || 30) * 60 * 1000;

const repos = {
  sustentus: process.env.GITHUB_REPO_SUSTENTUS || "sustentus/sustentus",
  serviflow: process.env.GITHUB_REPO_SERVIFLOW || "",
  bleckmann: process.env.GITHUB_REPO_BLECKMANN || ""
};

const cache = new Map();

async function gh(url) {
  const headers = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "apoyar.io"
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(url, {headers});
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
  return r;
}

function nextLink(link) {
  if (!link) return null;
  const m = link.split(",").find(x => x.includes('rel="next"'));
  return m ? m.match(/<([^>]+)>/)?.[1] : null;
}

async function paged(url, maxPages=20) {
  let out=[], pages=0, next=url;
  while(next && pages < maxPages) {
    const r = await gh(next);
    const data = await r.json();
    if (!Array.isArray(data)) break;
    out.push(...data);
    next = nextLink(r.headers.get("link"));
    pages++;
  }
  return out;
}

async function repoStats(slug) {
  if (!slug) return {configured:false};
  const [owner, repo] = slug.split("/");
  if (!owner || !repo) return {configured:false};

  const meta = await (await gh(`https://api.github.com/repos/${owner}/${repo}`)).json();
  const since30 = new Date(Date.now() - 30*86400000).toISOString();

  const commits30 = await paged(`https://api.github.com/repos/${owner}/${repo}/commits?since=${encodeURIComponent(since30)}&per_page=100`, 10);
  const contributors = await paged(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`, 5);
  const branches = await paged(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, 10);

  const days = {};
  for (const c of commits30) {
    const iso = c?.commit?.author?.date || c?.commit?.committer?.date;
    if (!iso) continue;
    const day = iso.slice(0,10);
    days[day] = (days[day] || 0) + 1;
  }

  const activeDays = Object.keys(days).length;
  const series = [];
  for (let i=29;i>=0;i--) {
    const d = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    series.push({date:d, commits:days[d] || 0});
  }

  return {
    configured:true,
    repo: slug,
    name: meta.name,
    description: meta.description,
    defaultBranch: meta.default_branch,
    stars: meta.stargazers_count,
    forks: meta.forks_count,
    openIssues: meta.open_issues_count,
    branches: branches.length,
    contributors: contributors.length,
    commits30: commits30.length,
    activeDays30: activeDays,
    series30: series,
    updatedAt: new Date().toISOString()
  };
}

async function getStats(key) {
  const slug = repos[key];
  const existing = cache.get(key);
  if (existing && Date.now() - existing.cachedAt < TTL_MS) return existing.value;
  const value = await repoStats(slug);
  cache.set(key, {cachedAt:Date.now(), value});
  return value;
}

app.get("/api/github-stats", async (req,res) => {
  try {
    const [sustentus, serviflow, bleckmann] = await Promise.all([
      getStats("sustentus"),
      getStats("serviflow"),
      getStats("bleckmann")
    ]);
    res.set("Cache-Control","public, max-age=300");
    res.json({sustentus, serviflow, bleckmann, refreshMinutes:Number(process.env.STATS_REFRESH_MINUTES || 30)});
  } catch (e) {
    console.error(e);
    res.status(502).json({error:"Unable to refresh GitHub statistics"});
  }
});

app.get("/health", (req,res)=>res.json({ok:true}));

app.use(express.static(__dirname, {extensions:["html"]}));
app.get("*", (req,res)=>res.sendFile(path.join(__dirname,"404.html")));

app.listen(PORT, () => {
  console.log(`Apoyar site listening on ${PORT}`);
  // Warm cache shortly after boot.
  setTimeout(() => Promise.allSettled([getStats("sustentus"),getStats("serviflow"),getStats("bleckmann")]), 1500);
});
