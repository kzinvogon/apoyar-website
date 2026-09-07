
async function loadEngineeringStats() {
  const blocks = document.querySelectorAll("[data-live-project]");
  if (!blocks.length) return;
  try {
    const r = await fetch("/api/github-stats");
    if (!r.ok) throw new Error("stats unavailable");
    const data = await r.json();

    blocks.forEach(block => {
      const key = block.dataset.liveProject;
      const s = data[key];
      if (!s || !s.configured || s.error) {
        const message = s && s.error ? "Repository temporarily unavailable" : "Connect repository";
        block.querySelectorAll("[data-stat]").forEach(x => { x.textContent = message; });
        return;
      }
      const map = {
        commits30: s.commits30,
        activeDays30: s.activeDays30,
        branches: s.branches,
        contributors: s.contributors
      };
      Object.entries(map).forEach(([k,v]) => {
        const el = block.querySelector(`[data-stat="${k}"]`);
        if (el) el.textContent = Number(v).toLocaleString();
      });
      const updated = block.querySelector("[data-updated]");
      if (updated) updated.textContent = `Updated ${new Date(s.updatedAt).toLocaleString()}`;
      drawSpark(block.querySelector("canvas"), s.series30 || []);
    });
  } catch(e) {
    console.info("Live engineering statistics are not configured for this deployment.");
  }
}

function drawSpark(canvas, series) {
  if (!canvas || !series.length) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 560, h = canvas.clientHeight || 120;
  canvas.width = w*dpr; canvas.height = h*dpr;
  const c = canvas.getContext("2d"); c.scale(dpr,dpr);
  c.clearRect(0,0,w,h);
  const vals = series.map(x=>x.commits), max = Math.max(1,...vals);
  const gap = 3, bar = Math.max(2,(w-gap*(vals.length-1))/vals.length);
  c.fillStyle = "#13a0a8";
  vals.forEach((v,i)=>{
    const bh = Math.max(2,(v/max)*(h-18));
    c.fillRect(i*(bar+gap), h-bh, bar, bh);
  });
}
document.addEventListener("DOMContentLoaded",loadEngineeringStats);
