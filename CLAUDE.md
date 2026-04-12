# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server at http://localhost:5173
npm run build        # Type-check (vue-tsc -b) then Vite production build
npm run preview      # Preview production build
node scripts/fetch-data.mjs   # Refresh Docker Hub/MCR/runner data → public/data/*.json
```

No test runner or linter is configured.

## Architecture

Visual editor for GitHub Actions workflows. Three-column layout:
- **Left**: StepCatalog (searchable, categorized pre-built actions)
- **Center**: Workflow editor (triggers, job tabs, step config, container selection)
- **Right**: YamlPreview (live YAML output with copy/download)

### Data Flow

```
useWorkflow (reactive Workflow state)
    ↕ emit/props
App.vue ← components (TriggerEditor, JobEditor, StepEditor, ContainerSelector)
    ↓ computed
yamlGenerator.ts → YAML string → YamlPreview
```

- **useWorkflow** holds a single reactive `Workflow` object. All mutations go through its exported functions. `yaml` is a computed that regenerates on every change.
- **useDynamicData** fetches `public/data/{runners,containers,meta}.json` at startup, falling back to static defaults in `src/data/stepCatalog.ts`. Returns `readonly()` refs.
- **useImageInspect** queries Docker Hub v2 registry API (anonymous auth token → manifest → config blob) to extract installed packages from ENV vars and Dockerfile history. Results cached in localStorage for 7 days with auto-eviction on full storage.

### YAML Generation

`yamlGenerator.ts` converts the Workflow model to a YAML string. Key behaviors:
- Multiline `run` commands use YAML `|` literal block style
- Per-step containers (when job has no container) are wrapped in `docker run --rm -v $GITHUB_WORKSPACE:/workspace`
- Empty triggers default to `workflow_dispatch`

### Data Pipeline

`scripts/fetch-data.mjs` fetches container image tags from Docker Hub and MCR, plus runner toolsets from `actions/runner-images` on GitHub. Writes to `public/data/`. Automated daily at 6 AM UTC via `.github/workflows/update-and-deploy.yml`.

### ContainerSelector Package Search

The ContainerSelector component supports searching across all container types by pre-installed package name (e.g. "Node 14", "Python 3.12"). It matches against the `preInstalled` arrays on each container image.

## Key Conventions

- Vue 3 Composition API with `<script setup lang="ts">` exclusively
- Typed emits: `defineEmits<{ name: [arg: Type] }>()`
- Tailwind CSS v4 (imported via `@import "tailwindcss"` in style.css, configured as Vite plugin)
- Dark theme throughout: gray-900 backgrounds, gray-100 text, blue-400 accents
- Vite base path is `/github-actions-generator/` (sub-path deployment to GitHub Pages)
- `CatalogStep.uses` = GitHub Action reference; `CatalogStep.run` = shell command; never both
- UIDs: `id-${counter}-${Date.now()}`
