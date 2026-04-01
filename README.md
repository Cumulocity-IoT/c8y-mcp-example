# MCP example 
An example MCP service.

![](./docs/agent.png)

## Requirements

- Node.js 24
- Yarn (via corepack)

## Development Workflow

### Pull Requests

Every PR automatically builds the microservice to verify it compiles successfully. Draft PRs are skipped unless labeled with `run-ci-on-draft`.

## Local Development

```bash
yarn start:dev
```

## Build as Microservice

```bash
yarn docker:build
```

## Release Process

This project uses semantic versioning with manual release triggers. See [BUILD_AND_RELEASE.md](docs/BUILD_AND_RELEASE.md) for details.

**Quick start:**
1. Push commits to `main` following [Conventional Commits](https://www.conventionalcommits.org/) format
2. Manually trigger the "Semantic-Release" workflow in GitHub Actions
3. The workflow analyzes commits, creates a version tag, and triggers the build
4. Use `feat:` for features, `fix:` for bug fixes, `BREAKING CHANGE:` for breaking changes