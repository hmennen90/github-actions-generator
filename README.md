# GitHub Actions Generator

A visual editor for building GitHub Actions workflows. Compose triggers, jobs, and steps via a drag-and-click UI and get valid YAML output in real time.

## Features

- **Step Catalog** -- 25+ pre-configured actions (Checkout, Setup Node/Python/Java/.NET/Go, npm/yarn/Gradle/Maven builds, tests, Docker, GitHub Pages, caching, artifacts)
- **Trigger Editor** -- push, pull_request, workflow_dispatch, schedule (cron), release, issue_comment with branch and path filters
- **Job Editor** -- multiple jobs with tabs, configurable runner (Ubuntu/Windows/macOS, paid larger runners, self-hosted), job-level and step-level containers
- **Container Selector** -- choose from Ubuntu, Alpine, Debian, Node.js, Python, PHP, Go, Rust, Java, .NET images or enter a custom registry/image. **Search by pre-installed package** (e.g. "Node 14", "Python 3.12") to find the right image instantly
- **Docker Image Inspect** -- fetches image metadata (architecture, size, installed packages) live from Docker Hub via the v2 registry API, with 7-day localStorage cache
- **YAML Preview** -- live-generated, valid GitHub Actions YAML with copy-to-clipboard and download
- **Dynamic Data** -- runner toolsets and container image tags are fetched from Docker Hub, MCR, and `actions/runner-images` via a data pipeline script, with hardcoded fallbacks

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Update Container & Runner Data

The app ships with static fallback data. To fetch the latest tags and runner toolsets:

```bash
node scripts/fetch-data.mjs
```

This writes `public/data/containers.json`, `runners.json`, and `meta.json`. A GitHub Actions workflow (`.github/workflows/update-and-deploy.yml`) automates this on a daily schedule.

## Architecture

```
src/
  types/workflow.ts          -- TypeScript interfaces (Workflow, Job, Step, CatalogStep)
  data/stepCatalog.ts        -- step catalog, runner options, container types (static fallbacks)
  composables/
    useWorkflow.ts           -- reactive workflow state and mutation functions
    useDynamicData.ts        -- loads runtime JSON data with fallback to static defaults
    useImageInspect.ts       -- Docker Hub v2 registry API client with localStorage caching
  components/
    StepCatalog.vue          -- searchable, categorized step list (left sidebar)
    TriggerEditor.vue        -- trigger type buttons with branch/cron config
    JobEditor.vue            -- job config (ID, name, runner, container, steps)
    StepEditor.vue           -- individual step config (name, uses/run, with params, container)
    ContainerSelector.vue    -- container type/image picker with package search and live inspect
    YamlPreview.vue          -- live YAML output with copy and download
  utils/yamlGenerator.ts     -- converts Workflow model to GitHub Actions YAML string
  App.vue                    -- three-column layout wiring everything together
scripts/
  fetch-data.mjs             -- fetches Docker Hub + MCR + runner-images data
```

## Tech Stack

- Vue 3 (Composition API, `<script setup>`)
- TypeScript
- Vite
- Tailwind CSS v4
