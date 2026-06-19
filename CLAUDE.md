# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A static, single-page math practice site for grades 1–6 (`盹盹的数学乐园`). Vanilla HTML/CSS/JS, no build step. Deployed via GitHub Pages from `main` at https://aslash115-maker.github.io/dundunmath/.

## Source files

- `index.html` — entry point; loads `curriculum.js` then `app.js`
- `curriculum.js` — curriculum data + per-chapter problem generators
- `app.js` — UI, hash routing, localStorage persistence, sparkle effect
- `styles.css` — kid-friendly candy-color theme

There is no bundler, no `package_json`, no tests. To preview locally: `python -m http.server` in the project root, then open http://localhost:8000.

## Architecture

**Curriculum model.** `CURRICULUM = [grade1..grade6]`. Each grade has `chapters[]`; each chapter has `id`, `name`, `generate()`, and optional `maxCount` (overrides the default 100 questions per chapter — the trivia chapter `趣味数学` uses 12).

**Problem shape.** `generate()` returns `{ question, answer, choices?, figure? }`:
- If `choices` is present → multiple-choice / true-false (rendered as buttons; auto-classed `judge` for 对/错 and `long` for verbose options)
- If absent → free-text fill-in (used in grades 5–6 for fractions, decimals, equations, etc.)
- `figure` is an inline SVG string (animated via SMIL) shown above the question — currently used only by `趣味数学`. To add more visual chapters, return `figure` from `generate()`; styling is handled by `.figure` in `styles.css`.

**Helpers in `curriculum.js`.** `mc(q, ans, distractors)`, `mcn(q, ans, range)` (auto-numeric distractors), `judge(q, isTrue)`, `judgeEq(left, op, right, jitter)` for "is this equation correct?" judges. Distractors are tightened to be near the answer so guessing is harder.

**Routing.** Hash-based: `#/` (home) → `#/g/{i}` (grade) → `#/q/{chapterId}` (quiz). Implemented in `route()` at the bottom of `app.js`.

**Persistence.** Single localStorage key `dundunmath:v1`, schema `{ progress: { [chapterId]: {...} }, best: { [chapterId]: number } }`. Progress saves on every answer in `next()` and on quiz exit; cleared on chapter completion (which also records `best`). The home page reads `latestUnfinished()` to surface a "继续上次" card. Per-chapter ✕ button and footer "🗑️ 清空进度 / ⚠️ 清空全部" provide tiered wipe.

**Correct-answer flow.** `submit()` shows feedback + emoji burst (`celebrate()`) and auto-advances after 700ms. Wrong answers wait for the user to click "下一题" so they can read the correct value.

## Working in this codebase

- **No comments unless WHY is non-obvious.** Existing code follows this.
- **Adding a chapter:** add an entry to the appropriate grade's `chapters[]`. Use a unique `id` (`g{grade}-c{n}`); existing `localStorage` data keys off `id`, so changing an id orphans saved progress for that chapter (harmless — old entries are simply ignored).
- **Validating problem generators.** Many bugs come from `mcn` distractors colliding with the correct answer or `judgeEq` producing negatives. The pattern used during development was a quick Node script that loads `curriculum.js` via `vm.runInContext`, calls `generateProblems` for every chapter, and asserts: count matches `maxCount || 100`, every problem has a defined `answer`, and (if `choices` present) `answer` appears in `choices`. Re-create that script ad hoc when adding generators.
- **Deployment.** Pushing to `main` triggers GitHub Pages rebuild (~1–2 min). There is no PR workflow — direct push is the norm here. After pushing, hard-refresh (Ctrl+F5) to bypass cached assets.
- **Local file:// vs Pages.** Browsers segregate `localStorage` per origin, so progress saved while opening `index.html` directly is independent from the Pages site.
