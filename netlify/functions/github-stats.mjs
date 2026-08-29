
const repos = {
  sustentus: process.env.GITHUB_REPO_SUSTENTUS || "sustentus/sustentus",
  serviflow: process.env.GITHUB_REPO_SERVIFLOW || "",
  bleckmann: process.env.GITHUB_REPO_BLECKMANN || ""
};

async function gh(url) {
  const headers = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "apoyar.io"
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(url,{headers});
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r;
}
function nextLink(link){
  if(!link) return null;
  const n=link.split(",").find(x=>x.includes('rel="next"'));
  return n ? n.match(/<([^>]+)>/)?.[1] : null;
}
async function paged(url,maxPages=10){
  let out=[],next=url,p=0;
  while(next && p<maxPages){
    const r=await gh(next), data=await r.json();
    if(!Array.isArray(data)) break;
    out.push(...data); next=nextLink(r.headers.get("link")); p++;
  }
  return out;
}
async function stats(slug){
  if(!slug) return {configured:false};
  const [owner,repo]=slug.split("/");
  if(!owner||!repo) return {configured:false};
  const since=new Date(Date.now()-30*86400000).toISOString();
  const [commits,contributors,branches]=await Promise.all([
    paged(`https://api.github.com/repos/${owner}/${repo}/commits?since=${encodeURIComponent(since)}&per_page=100`,10),
    paged(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,5),
    paged(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,10)
  ]);
  const days={};
  for(const c of commits){
    const iso=c?.commit?.author?.date||c?.commit?.committer?.date;
    if(iso) days[iso.slice(0,10)]=(days[iso.slice(0,10)]||0)+1;
  }
  const series30=[];
  for(let i=29;i>=0;i--){
    const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    series30.push({date:d,commits:days[d]||0});
  }
  return {
    configured:true, repo:slug, commits30:commits.length,
    activeDays30:Object.keys(days).length, branches:branches.length,
    contributors:contributors.length, series30, updatedAt:new Date().toISOString()
  };
}
export default async () => {
  try {
    const [sustentus,serviflow,bleckmann]=await Promise.all([
      stats(repos.sustentus),stats(repos.serviflow),stats(repos.bleckmann)
    ]);
    return new Response(JSON.stringify({sustentus,serviflow,bleckmann}),{
      status:200,headers:{"content-type":"application/json","cache-control":"public,max-age=300"}
    });
  } catch(e) {
    return new Response(JSON.stringify({error:"Unable to refresh GitHub statistics"}),{
      status:502,headers:{"content-type":"application/json"}
    });
  }
};
