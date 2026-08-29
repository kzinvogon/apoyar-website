# Correct Netlify deployment

This ZIP is deliberately FLAT: `index.html` is at the ZIP root.

For a manual Netlify deploy:
1. Drag `apoyar-site-netlify-fixed.zip` into Netlify Deploys.
2. Do not wrap the files in another directory.
3. The site should load immediately.

For live GitHub statistics, add these Netlify environment variables:
- GITHUB_TOKEN
- GITHUB_REPO_SUSTENTUS=sustentus/sustentus
- GITHUB_REPO_SERVIFLOW=<owner>/<repo>
- GITHUB_REPO_BLECKMANN=<owner>/<repo>

The same site can still be deployed to Railway; `server.js` and `railway.toml` remain included.
