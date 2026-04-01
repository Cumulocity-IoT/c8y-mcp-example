# Build and Release Process

This document describes how the mcp-example microservice is built and released using GitHub Actions.

## Overview

The build and release process uses:
- **Semantic Release**: Automated versioning based on conventional commits
- **GitHub Actions**: CI/CD workflows for building and releasing
- **Docker**: Containerization of the microservice
- **Trivy**: Security scanning and SBOM generation

## Workflows

### 1. PR CI (`pr-ci.yml`)

**Trigger**: Pull requests (opened, synchronized, reopened, ready_for_review)

This workflow validates pull requests by:
1. Creating a PR-specific version (e.g., `0.0.1-PR-123-456789`)
2. Building the microservice to ensure it compiles successfully
3. Skipping draft PRs unless labeled with `run-ci-on-draft`

**Draft PR handling**: Draft PRs are skipped by default. To run CI on a draft PR, add the `run-ci-on-draft` label.

### 2. Semantic Release (`semantic-release.yml`)

**Trigger**: Manual only (workflow_dispatch)

This workflow analyzes commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification and automatically:
- Determines the next version number
- Generates a CHANGELOG
- Creates a Git tag
- Commits version updates

**Commit Message Format**:
- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `BREAKING CHANGE:` - Breaking change (major version bump)
- `chore:`, `docs:`, `style:`, `refactor:`, `test:` - No version bump

**Example**:
```bash
git commit -m "feat: add new MCP tool for device management"
git commit -m "fix: resolve connection timeout issue"
git commit -m "feat!: redesign API structure

BREAKING CHANGE: API endpoints have been restructured"
```

### 3. Create Release (`create-release.yml`)

**Trigger**: Push of a version tag (e.g., `v1.0.0`)

This workflow:
1. Sets up the build environment
2. Builds the microservice using the reusable build workflow
3. Creates a GitHub Release with:
   - Microservice ZIP file
   - SBOM (Software Bill of Materials)
   - Auto-generated release notes

### 4. Build Microservices (`build-microservices.yml`)

**Trigger**: Called by other workflows (reusable workflow)

This workflow:
1. Checks out the code
2. Sets up Node.js with Yarn
3. Updates version in `package.json` and `manifest.json`
4. Builds Docker image
5. Creates microservice ZIP file (image.tar + cumulocity.json)
6. Runs Trivy security scan
7. Generates SBOM
8. Uploads artifacts

## Release Process

### Complete Release Flow

1. **Make changes** following conventional commit format:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **Manually trigger Semantic Release**:
   - Go to the **Actions** tab in GitHub
   - Select **"Semantic-Release"** workflow
   - Click **"Run workflow"**
   - Semantic Release will:
     - Analyze commits since last release
     - Determine the next version number
     - Update `package.json` and `CHANGELOG.md`
     - Create a Git tag (e.g., `v1.1.0`)
     - Push the tag to the repository

3. **Automatic build**: The `create-release.yml` workflow triggers automatically on the new tag

4. **Download release**: Find the microservice ZIP in the GitHub Releases page

## Local Build

Build and package the microservice locally:

```bash
# Build Docker image and create ZIP
yarn docker:build

# Output: dist/mcp-example.zip
```

The ZIP file contains:
- `image.tar`: Docker image
- `cumulocity.json`: Microservice manifest

## Configuration Files

- [`.releaserc.json`](.releaserc.json) - Semantic Release configuration
- [`.github/workflows/pr-ci.yml`](.github/workflows/pr-ci.yml) - PR validation and build check
- [`.github/workflows/semantic-release.yml`](.github/workflows/semantic-release.yml) - Version and tagging
- [`.github/workflows/create-release.yml`](.github/workflows/create-release.yml) - Release creation
- [`.github/workflows/build-microservices.yml`](.github/workflows/build-microservices.yml) - Build process
- [`manifest.json`](manifest.json) - Cumulocity microservice metadata
- [`Dockerfile`](Dockerfile) - Container build instructions

## Secrets Required

Configure these secrets in GitHub repository settings:

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- `GENERIC_APP_ENABLEMENT_GH_PAT` - (Optional) For private npm packages
- `C8Y_TPSAFE_API_KEY` - (Optional) For compliance scanning
- `C8Y_TPSAFE_RULES_APP_PRIVATE_KEY` - (Optional) For compliance scanning

## Deployment

After release, deploy to Cumulocity:

1. Download the ZIP file from GitHub Releases
2. Navigate to Administration → Ecosystem → Microservices in Cumulocity
3. Click "Add microservice"
4. Upload the ZIP file
5. Configure tenant subscriptions

## Troubleshooting

### PR CI not running on draft PR
Add the `run-ci-on-draft` label to your draft pull request to enable CI checks.

### Build fails with "squash" error
Docker `--squash` requires experimental features. Remove `--squash` flag from Dockerfile build commands.

### Semantic Release skips version
Ensure commits follow conventional commit format. Check workflow logs for analysis details.

### Tag already exists
Delete the tag locally and remotely:
```bash
git tag -d v1.0.0
git push --delete origin v1.0.0
```

### SBOM upload fails
This is optional. Check if Trivy action has correct permissions and image reference.
