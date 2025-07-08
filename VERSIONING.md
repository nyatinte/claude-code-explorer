# Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/) (SemVer).

## Version Format

`MAJOR.MINOR.PATCH`

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

## Release Process

### 1. Version Bump

Run the release script which handles testing, building, and version bumping:

```bash
bun run release
```

This will:
1. Run all tests
2. Check code quality
3. Build the project
4. Prompt for version type (patch/minor/major/custom)
5. Update package.json
6. Create a git commit with message `chore: release vX.X.X`
7. Create a git tag

### 2. Push to GitHub

```bash
git push --follow-tags
```

### 3. Automated Publishing

GitHub Actions will automatically:
- Publish to npm with provenance
- Create a GitHub release with changelog

## Version Guidelines

### Patch Release (1.0.0 → 1.0.1)
- Bug fixes
- Performance improvements
- Documentation updates
- Dependency updates (non-breaking)

### Minor Release (1.0.0 → 1.1.0)
- New features
- New CLI options
- New file type support
- Backwards-compatible API additions

### Major Release (1.0.0 → 2.0.0)
- Breaking changes
- Removed features
- Major refactoring
- Node.js version requirement changes

## Pre-release Versions

For testing before stable release:

```bash
# Beta: 1.1.0-beta.0
# Release Candidate: 1.1.0-rc.0
```

## PR Preview Packages

Pull requests automatically publish preview packages via `pkg-pr-new`, allowing testing before merge.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features (triggers minor)
- `fix:` Bug fixes (triggers patch)
- `feat!:` or `BREAKING CHANGE:` (triggers major)
- `chore:` Maintenance tasks
- `docs:` Documentation only
- `test:` Test additions/changes
- `refactor:` Code refactoring