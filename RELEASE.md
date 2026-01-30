# Release Process

This document describes the automated release process for the VSCode Terminal System Notifier extension.

## Automated Workflows

### Build Workflow (`.github/workflows/build.yml`)

Automatically runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Steps:**
1. Checks out code
2. Sets up Node.js (tests on versions 18.x and 20.x)
3. Installs dependencies
4. Runs linter
5. Compiles TypeScript
6. Validates build artifacts
7. Uploads artifacts for Node 20.x builds

### Release Workflow (`.github/workflows/release.yml`)

Automatically runs when a version tag is pushed (e.g., `v0.0.1`, `v1.0.0`).

**Steps:**
1. Checks out code
2. Sets up Node.js 20.x
3. Installs dependencies
4. Runs linter
5. Compiles TypeScript
6. Packages extension as `.vsix` file
7. Creates GitHub release with:
   - Release notes from CHANGELOG
   - Installation instructions
   - Feature highlights
8. Uploads `.vsix` file as release asset
9. (Optional) Publishes to VSCode Marketplace if `VSCE_PAT` secret is configured

## Creating a Release

### Method 1: Using Git Tags (Recommended)

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Push the tag to trigger release
git push origin --tags
```

### Method 2: Manual Tag Creation

```bash
# Create and push a tag manually
git tag v0.0.2
git push origin v0.0.2
```

The release workflow will automatically:
- Build the extension
- Create a GitHub release
- Upload the `.vsix` file
- Generate release notes

## Version Numbering

Follow Semantic Versioning (semver):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backwards compatible
- **Patch** (0.0.1): Bug fixes, backwards compatible

## Publishing to VSCode Marketplace (Optional)

To enable automatic publishing to the VSCode Marketplace:

1. Get a Personal Access Token (PAT) from Azure DevOps:
   - Visit https://dev.azure.com/
   - Create organization if needed
   - Go to User Settings > Personal Access Tokens
   - Create new token with "Marketplace (Manage)" scope
   - Copy the token

2. Add the token to GitHub Secrets:
   - Go to repository Settings > Secrets and variables > Actions
   - Create new secret named `VSCE_PAT`
   - Paste your token

3. Future releases will automatically publish to the marketplace

## Release Checklist

Before creating a release:

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with new version and changes
- [ ] Test extension locally
- [ ] Ensure all tests pass
- [ ] Update README if needed
- [ ] Commit all changes
- [ ] Create and push version tag

## Manual Release (Alternative)

If you prefer manual releases:

```bash
# Install vsce
npm install -g @vscode/vsce

# Package the extension
vsce package

# This creates vscode-system-notifier-X.Y.Z.vsix

# Create GitHub release manually and upload the .vsix file
```

## Troubleshooting

**Build fails:**
- Check Node.js version (should be 18.x or 20.x)
- Ensure all dependencies are installed: `npm ci`
- Run lint: `npm run lint`
- Run compile: `npm run compile`

**Release fails:**
- Verify tag format is `vX.Y.Z` (e.g., `v0.0.1`)
- Check GitHub Actions logs for specific error
- Ensure GITHUB_TOKEN has proper permissions

**Marketplace publish fails:**
- Verify VSCE_PAT secret is set correctly
- Check token hasn't expired
- Ensure publisher name matches Azure DevOps publisher

## Monitoring Releases

- View all releases: https://github.com/wang-zerui/vscode_system_notifier/releases
- Check workflow runs: https://github.com/wang-zerui/vscode_system_notifier/actions
- Monitor build status badge (add to README if desired)

## Build Status Badge

Add this to README.md to show build status:

```markdown
![Build Status](https://github.com/wang-zerui/vscode_system_notifier/actions/workflows/build.yml/badge.svg)
```
