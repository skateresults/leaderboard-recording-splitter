# Recording splitter

Small web app to **split a single lap-timing recording** into **one file per race**. Input files are **plain-text recordings from [MyLaps Orbit](https://www.mylaps.com/)** (scoreboard feed): one line per message, in the feed’s native format (`$B`, `$F`, etc.).

## Behavior

- **Race boundaries:** each `$B` line starts a new race segment. Lines **before the first `$B`** are ignored.
- **Restarts:** consecutive `$B` blocks with the **same race id** are merged into one export.
- **Exports:** download each race as `.txt` or everything as a ZIP. Line order and content are preserved except for dropped idle lines (see below).
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

Pushes to `main` build with GitHub Actions and deploy the `dist` output to the `gh-pages` branch (other branches use a dry run). Adjust the workflow in `.github/workflows/` if your default branch or hosting setup differs.
