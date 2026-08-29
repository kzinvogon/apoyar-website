# Railway deployment

## Service
Deploy this repository/folder as one Railway persistent web service.

Railway variables:
- GITHUB_TOKEN = fine-grained GitHub token with read-only access to both repositories
- GITHUB_REPO_SUSTENTUS = sustentus/sustentus
- GITHUB_REPO_SERVIFLOW = exact GitHub owner/repository slug for ServiFlow
- GITHUB_REPO_BLECKMANN = exact GitHub owner/repository slug for the Bleckmann application estate
- STATS_REFRESH_MINUTES = 30

The server refreshes each repository at most once per cache interval and never exposes the token to the browser.

Health check:
- /health

Live statistics API:
- /api/github-stats

## Domain
Attach apoyar.io and www.apoyar.io to the Railway service, then update DNS as Railway instructs.

## Framer transition
Keep the existing Framer site live until Railway has passed testing on its temporary Railway domain. Only then change the production DNS.

## GitHub access
Use a fine-grained token restricted to read-only repository metadata/content as needed. Avoid a broad classic personal access token.
