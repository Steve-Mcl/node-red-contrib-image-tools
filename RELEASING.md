# Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please). Nothing is published by hand.

## How a release happens

1. Merge PRs into `main` as usual (merge commits, no squash).
2. release-please opens, and keeps updating, a PR titled `chore: release x.y.z`. It contains the version bump (`package.json`, `package-lock.json`) and the new section of `CHANGELOG.md`.
3. When you want to release, merge that PR. The workflow tags `vx.y.z`, creates the GitHub release and publishes the package to npm.

The release PR can be edited before it is merged, to tidy the changelog wording. If there is nothing releasable (only `chore`, `ci`, `test`, `build` or `refactor` changes) no release PR is opened.

## PR titles are the changelog

The changelog is built from the **titles of merged PRs**, so the title of every PR must be a [conventional commit](https://www.conventionalcommits.org/). A check on each PR enforces this.

| title starts with | meaning | version | in the changelog |
|---|---|---|---|
| `feat:` | new feature | minor | Features |
| `fix:` | bug fix | patch | Bug Fixes |
| `perf:` | performance | patch | Performance |
| `docs:` | documentation | none | Documentation |
| `revert:` | revert | patch | Reverts |
| `chore:` `ci:` `test:` `build:` `refactor:` | maintenance | none | hidden |

Add `!` after the type (`feat!: drop Node 18`) for a breaking change. That makes a major release. A `BREAKING CHANGE:` line in the PR body does the same.

Keep the commits inside a PR **plain**, not conventional (`Add webp support`, not `feat: add webp support`). With merge commits every commit in the history is read, so a conventional looking commit message inside a PR would appear in the changelog as well as the PR title.

## One time setup

### npm (trusted publishing, no token is stored)

The package is published from GitHub Actions using npm [trusted publishing](https://docs.npmjs.com/trusted-publishers). The `npm` account that owns the package has to allow it once:

1. On npmjs.com open the package, then **Settings**, then **Trusted Publisher**, and choose **GitHub Actions**
2. Fill in: organization or user `Steve-Mcl`, repository `node-red-contrib-image-tools`, workflow filename `release.yml`. Leave the environment empty
3. Optional, once it works: in the same settings, set publishing access to require two factor authentication and disallow tokens

Publishing with provenance needs npm 11.5.1 or later, which the workflow gets from Node 24.

### GitHub

- Settings, Actions, General: workflow permissions must allow GitHub Actions to create pull requests (already on)
- Optional: a PR opened with the default token does not trigger other workflows, so the release PR has no CI checks. The publish job runs `npm test` before publishing anyway. To get checks on the release PR as well, add a personal access token (repo scope) as the `RELEASE_PLEASE_TOKEN` repository secret.

## The first release (3.0.0)

`.release-please-manifest.json` records `2.1.1` (the last release that was published). The first release PR is opened once a PR with a `feat!:` title (a breaking change) is merged. From 2.1.1 that gives `3.0.0`. Its generated changelog will only list conventional PR titles, so edit the release PR to describe what is in 3.0.0 before merging it.
