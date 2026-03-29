# Recording splitter

Small web app to **split a single lap-timing recording** into **one file per race**. Input files are **plain-text recordings from [MyLaps Orbit](https://www.mylaps.com/)** (scoreboard feed): one line per message, in the feed’s native format (`$B`, `$F`, etc.).

## Behavior

- **Race boundaries:** each `$B` line starts a new race segment. Lines **before the first `$B`** are ignored.
- **Restarts:** consecutive `$B` blocks with the **same race id** are merged into one export.
- **Exports:** download each race as `.txt` or everything as a ZIP. The **first column (timestamp)** is renumbered so it **starts at 0** for that race (same offset subtracted from every line). Line order and the rest of each line are unchanged except for dropped idle lines (see below).
- **Idle `$F` lines:** lines matching end-of-race filler (`$F,0` with both race timers `"00:00:00"` and a whitespace-only last quoted field) are **removed** from downloads; in-race `$F` lines (e.g. running clock / status text) are kept.
- **No `$B` in file:** the UI reports that no races were found (nothing to export).

## Development

Uses [pnpm](https://pnpm.io). Node version: see `.nvmrc`.

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
```

Stack: **Vite**, **React**, **TypeScript**.

## Deploy

Pushes to `main` build with GitHub Actions and deploy the `dist` output to the `gh-pages` branch (other branches use a dry run). The CI build sets `GITHUB_PAGES` so Vite uses base `/<repo>/`, which **GitHub Project Pages** need (`username.github.io/<repo>/`). For a **user/org site** repo (`username.github.io`) served from the domain root, use `base: '/'` instead (e.g. drop the env in the workflow or override in `vite.config.ts`).
