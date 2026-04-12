#!/usr/bin/env node

/**
 * Fetches Docker Hub tags and GitHub Actions runner-images data,
 * writes JSON files to public/data/ for the app to consume at runtime.
 *
 * Usage: node scripts/fetch-data.mjs
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'public', 'data')

mkdirSync(DATA_DIR, { recursive: true })

// ─── Docker Hub ────────────────────────────────────────────────────────

const DOCKER_HUB_IMAGES = [
  { type: 'ubuntu', repo: 'library/ubuntu', icon: '🐧', label: 'Ubuntu' },
  { type: 'alpine', repo: 'library/alpine', icon: '🏔️', label: 'Alpine' },
  { type: 'debian', repo: 'library/debian', icon: '🌀', label: 'Debian' },
  { type: 'node', repo: 'library/node', icon: '🟢', label: 'Node.js' },
  { type: 'python', repo: 'library/python', icon: '🐍', label: 'Python' },
  { type: 'php', repo: 'library/php', icon: '🐘', label: 'PHP' },
  { type: 'golang', repo: 'library/golang', icon: '🔵', label: 'Go' },
  { type: 'rust', repo: 'library/rust', icon: '🦀', label: 'Rust' },
  { type: 'java', repo: 'library/eclipse-temurin', icon: '☕', label: 'Java' },
]

// Microsoft .NET and Maven/Gradle have different registries — handled separately
const EXTRA_IMAGES = [
  {
    type: 'dotnet',
    icon: '🔷',
    label: '.NET',
    images: [
      { repo: 'dotnet/sdk', registry: 'mcr.microsoft.com', prefix: 'mcr.microsoft.com/dotnet/sdk' },
    ],
  },
]

// ─── Curated pre-installed package map ─────────────────────────────────
// These are well-known packages shipped with official Docker images.
// Keyed by container type, with optional tag-pattern overrides.

const PRE_INSTALLED = {
  ubuntu: {
    _base: ['apt', 'bash', 'coreutils', 'curl', 'wget', 'git', 'GCC', 'make', 'Perl'],
    // Version-specific additions
    '24.': ['Python 3.12', 'OpenSSL 3.0'],
    '22.': ['Python 3.10', 'OpenSSL 3.0'],
    '20.': ['Python 3.8', 'OpenSSL 1.1'],
  },
  alpine: {
    _base: ['apk', 'busybox', 'musl libc', 'sh'],
    // Alpine is minimal — almost nothing pre-installed
  },
  debian: {
    _base: ['apt', 'bash', 'coreutils', 'Perl', 'GCC', 'make'],
    bookworm: ['Python 3.11', 'Git 2.39', 'OpenSSL 3.0'],
    bullseye: ['Python 3.9', 'Git 2.30', 'OpenSSL 1.1'],
    buster: ['Python 3.7', 'Git 2.20', 'OpenSSL 1.1'],
    trixie: ['Python 3.12', 'Git 2.43', 'OpenSSL 3.0'],
  },
  node: {
    _base: ['Node.js', 'npm', 'yarn', 'corepack', 'Git', 'Python 3'],
    '-alpine': ['Node.js', 'npm', 'yarn', 'corepack'],
  },
  python: {
    _base: ['Python', 'pip', 'setuptools', 'wheel', 'Git', 'GCC', 'make'],
    '-alpine': ['Python', 'pip', 'setuptools', 'wheel'],
  },
  php: {
    _base: ['PHP', 'php-cli', 'php-json', 'php-mbstring', 'php-xml', 'Git', 'GCC'],
    '-alpine': ['PHP', 'php-cli'],
  },
  golang: {
    _base: ['Go', 'Git', 'GCC', 'ca-certificates', 'make'],
    '-alpine': ['Go', 'Git', 'ca-certificates'],
  },
  rust: {
    _base: ['Rust', 'Cargo', 'rustfmt', 'clippy', 'GCC', 'Git', 'make'],
    '-alpine': ['Rust', 'Cargo', 'rustfmt', 'clippy'],
  },
  java: {
    _base: ['Java JDK', 'jlink', 'jshell'],
  },
  dotnet: {
    _base: ['.NET SDK', 'dotnet CLI', 'NuGet', 'PowerShell'],
  },
}

/**
 * Resolve pre-installed packages for a given container type + tag name.
 * Merges _base packages with any tag-pattern-matched extras.
 */
function resolvePreInstalled(type, tagName) {
  const map = PRE_INSTALLED[type]
  if (!map) return []

  const base = [...(map._base || [])]

  // Check tag-specific overrides (match partial strings)
  for (const [pattern, pkgs] of Object.entries(map)) {
    if (pattern === '_base') continue
    if (tagName.includes(pattern)) {
      // For alpine-variant tags, _replace_ base with the slim list
      if (pattern === '-alpine') return pkgs
      // Otherwise merge
      for (const pkg of pkgs) {
        if (!base.includes(pkg)) base.push(pkg)
      }
    }
  }

  return base
}

/** Tag filter patterns — we only want "clean" version tags, no sha, no windows, no slim variants overload */
const TAG_FILTERS = {
  ubuntu: (t) => /^\d+\.\d+$/.test(t.name),
  alpine: (t) => /^\d+\.\d+$/.test(t.name),
  debian: (t) => /^(bookworm|bullseye|buster|trixie|sid)$/.test(t.name),
  node: (t) => /^\d+(-alpine)?$/.test(t.name) || /^\d+\.\d+-alpine$/.test(t.name) && !t.name.includes('slim'),
  python: (t) => /^3\.\d+(-alpine)?$/.test(t.name),
  php: (t) => /^8\.\d+(-alpine)?$/.test(t.name),
  golang: (t) => /^1\.\d+(-alpine)?$/.test(t.name),
  rust: (t) => /^1\.\d+(-alpine)?$/.test(t.name) && !t.name.includes('slim'),
  java: (t) => /^\d+$/.test(t.name),
}

async function fetchDockerHubTags(repo, pageSize = 100) {
  const url = `https://hub.docker.com/v2/repositories/${repo}/tags/?page_size=${pageSize}&ordering=last_updated`
  console.log(`  Fetching ${url}`)
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  ⚠ Failed to fetch ${repo}: ${res.status}`)
    return []
  }
  const data = await res.json()
  return data.results || []
}

async function fetchMcrTags(repo) {
  const url = `https://mcr.microsoft.com/v2/${repo}/tags/list`
  console.log(`  Fetching ${url}`)
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  ⚠ Failed to fetch MCR ${repo}: ${res.status}`)
    return []
  }
  const data = await res.json()
  return (data.tags || []).map((name) => ({ name }))
}

function sortVersionsDesc(tags) {
  return tags.sort((a, b) => {
    const av = a.name.match(/^(\d+)\.?(\d+)?/)
    const bv = b.name.match(/^(\d+)\.?(\d+)?/)
    if (!av || !bv) return 0
    const majorDiff = parseInt(bv[1]) - parseInt(av[1])
    if (majorDiff !== 0) return majorDiff
    return parseInt(bv[2] || '0') - parseInt(av[2] || '0')
  })
}

async function fetchAllContainerData() {
  console.log('Fetching Docker Hub tags...')
  const containerTypes = [{ id: 'none', label: 'No Container', icon: '', images: [] }]

  for (const img of DOCKER_HUB_IMAGES) {
    console.log(`\n📦 ${img.label} (${img.repo})`)
    const allTags = await fetchDockerHubTags(img.repo)
    const filter = TAG_FILTERS[img.type] || (() => true)
    let filtered = allTags.filter(filter)

    // Sort by version descending, take top entries
    filtered = sortVersionsDesc(filtered).slice(0, 10)

    const images = filtered.map((t) => {
      const imageName = img.repo.replace('library/', '')
      return {
        value: `${imageName}:${t.name}`,
        label: `${img.label} ${t.name}`,
        preInstalled: resolvePreInstalled(img.type, t.name),
        lastUpdated: t.last_updated || null,
        size: t.full_size || null,
      }
    })

    console.log(`  → ${images.length} tags: ${images.map((i) => i.value).join(', ')}`)

    containerTypes.push({
      id: img.type,
      label: img.label,
      icon: img.icon,
      images,
    })
  }

  // .NET from MCR
  for (const extra of EXTRA_IMAGES) {
    console.log(`\n📦 ${extra.label}`)
    const allImages = []
    for (const src of extra.images) {
      const tags = await fetchMcrTags(src.repo)
      const filtered = tags
        .filter((t) => /^\d+\.\d+$/.test(t.name))
        .sort((a, b) => parseFloat(b.name) - parseFloat(a.name))
        .slice(0, 5)

      for (const t of filtered) {
        allImages.push({
          value: `${src.prefix}:${t.name}`,
          label: `${extra.label} ${t.name} SDK`,
          preInstalled: resolvePreInstalled(extra.type, t.name),
        })
      }
    }
    console.log(`  → ${allImages.length} tags`)
    containerTypes.push({
      id: extra.type,
      label: extra.label,
      icon: extra.icon,
      images: allImages,
    })
  }

  // Custom option always last
  containerTypes.push({ id: 'custom', label: 'Custom', icon: '⚙️', images: [] })

  return containerTypes
}

// ─── Runner Images (pre-installed software) ────────────────────────────

const RUNNER_IMAGES_REPO = 'actions/runner-images'
const TOOLSET_FILES = [
  { runner: 'ubuntu-24.04', path: 'images/ubuntu/toolsets/toolset-2404.json' },
  { runner: 'ubuntu-22.04', path: 'images/ubuntu/toolsets/toolset-2204.json' },
  { runner: 'windows-2022', path: 'images/windows/toolsets/toolset-2022.json' },
]

async function fetchGitHubFile(repo, path) {
  const url = `https://raw.githubusercontent.com/${repo}/main/${path}`
  console.log(`  Fetching ${url}`)
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  ⚠ Failed: ${res.status}`)
    return null
  }
  return res.text()
}

function extractToolVersions(toolsetJson) {
  try {
    const toolset = JSON.parse(toolsetJson)
    const result = []

    // Java
    if (toolset.java) {
      const versions = toolset.java.versions || toolset.java.default_versions || []
      if (versions.length) result.push({ name: 'Java', versions })
    }

    // Node.js
    if (toolset.node) {
      const versions = toolset.node.versions || toolset.node.default_versions || []
      if (versions.length) result.push({ name: 'Node.js', versions })
    }

    // Python
    if (toolset.python) {
      const versions = toolset.python.versions || toolset.python.default_versions || []
      if (versions.length) result.push({ name: 'Python', versions })
    }

    // Go
    if (toolset.go) {
      const versions = toolset.go.versions || toolset.go.default_versions || []
      if (versions.length) result.push({ name: 'Go', versions })
    }

    // .NET
    if (toolset.dotnet?.versions) {
      result.push({ name: '.NET SDK', versions: toolset.dotnet.versions })
    }

    // Ruby
    if (toolset.ruby?.versions) {
      result.push({ name: 'Ruby', versions: toolset.ruby.versions })
    }

    // PHP
    if (toolset.php?.versions) {
      result.push({ name: 'PHP', versions: toolset.php.versions })
    }

    // Rust
    if (toolset.rust) {
      result.push({ name: 'Rust', versions: ['stable'] })
    }

    // PowerShell
    if (toolset.powershell) {
      result.push({ name: 'PowerShell', versions: [toolset.powershell.version || 'latest'] })
    }

    return result
  } catch (e) {
    console.warn(`  ⚠ Failed to parse toolset: ${e.message}`)
    return []
  }
}

async function fetchRunnerData() {
  console.log('\nFetching runner-images toolsets...')
  const runners = {}

  for (const entry of TOOLSET_FILES) {
    console.log(`\n🖥️  ${entry.runner}`)
    const content = await fetchGitHubFile(RUNNER_IMAGES_REPO, entry.path)
    if (content) {
      runners[entry.runner] = extractToolVersions(content)
      console.log(`  → ${runners[entry.runner].length} tools found`)
    }
  }

  // ubuntu-latest maps to latest ubuntu
  runners['ubuntu-latest'] = runners['ubuntu-24.04'] || runners['ubuntu-22.04'] || []
  runners['windows-latest'] = runners['windows-2022'] || []

  // macOS — no toolset JSON available in the same format, use known defaults
  runners['macos-latest'] = runners['macos-15'] = runners['macos-14'] = [
    { name: 'Xcode', versions: ['16.x'] },
    { name: 'Python', versions: ['3.12'] },
    { name: 'Node.js', versions: ['20'] },
    { name: 'Ruby', versions: ['3.x'] },
    { name: 'Java', versions: ['11', '17', '21'] },
    { name: '.NET SDK', versions: ['8.0'] },
    { name: 'Go', versions: ['1.22'] },
  ]
  runners['macos-13'] = runners['macos-14']

  return runners
}

// ─── Runner options (static, but with dynamic pre-installed data) ──────

function buildRunnerOptions(runnerToolsets) {
  const options = [
    { value: 'ubuntu-latest', label: 'Ubuntu (latest)', billing: 'free', preInstalled: runnerToolsets['ubuntu-latest'] || [] },
    { value: 'ubuntu-24.04', label: 'Ubuntu 24.04', billing: 'free', preInstalled: runnerToolsets['ubuntu-24.04'] || [] },
    { value: 'ubuntu-22.04', label: 'Ubuntu 22.04', billing: 'free', preInstalled: runnerToolsets['ubuntu-22.04'] || [] },

    { value: 'windows-latest', label: 'Windows (latest)', billing: 'free', note: '2x Linux cost on private repos', preInstalled: runnerToolsets['windows-latest'] || [] },
    { value: 'windows-2022', label: 'Windows 2022', billing: 'free', note: '2x Linux cost on private repos', preInstalled: runnerToolsets['windows-2022'] || [] },

    { value: 'macos-latest', label: 'macOS (latest)', billing: 'free', note: '10x Linux cost on private repos', preInstalled: runnerToolsets['macos-latest'] || [] },
    { value: 'macos-15', label: 'macOS 15 (ARM)', billing: 'free', note: '10x Linux cost on private repos', preInstalled: runnerToolsets['macos-15'] || [] },
    { value: 'macos-14', label: 'macOS 14 (ARM)', billing: 'free', note: '10x Linux cost on private repos', preInstalled: runnerToolsets['macos-14'] || [] },
    { value: 'macos-13', label: 'macOS 13 (Intel)', billing: 'free', note: '10x Linux cost on private repos', preInstalled: runnerToolsets['macos-13'] || [] },

    { value: 'ubuntu-latest-4-cores', label: 'Ubuntu 4-core', billing: 'paid', note: '$0.012/min — requires Team/Enterprise', preInstalled: runnerToolsets['ubuntu-latest'] || [] },
    { value: 'ubuntu-latest-8-cores', label: 'Ubuntu 8-core', billing: 'paid', note: '$0.022/min — requires Team/Enterprise', preInstalled: runnerToolsets['ubuntu-latest'] || [] },
    { value: 'ubuntu-latest-16-cores', label: 'Ubuntu 16-core', billing: 'paid', note: '$0.042/min — requires Team/Enterprise', preInstalled: runnerToolsets['ubuntu-latest'] || [] },
    { value: 'windows-latest-8-cores', label: 'Windows 8-core', billing: 'paid', note: '$0.042/min — requires Team/Enterprise', preInstalled: runnerToolsets['windows-latest'] || [] },
    { value: 'macos-latest-xlarge', label: 'macOS 12-core (Apple Silicon)', billing: 'paid', note: '$0.077/min — requires Team/Enterprise', preInstalled: runnerToolsets['macos-latest'] || [] },

    { value: 'self-hosted', label: 'Self-hosted', billing: 'free', note: 'Your own infrastructure', preInstalled: [] },
  ]
  return options
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Fetching GitHub Actions Generator data...\n')

  const [containerTypes, runnerToolsets] = await Promise.all([
    fetchAllContainerData(),
    fetchRunnerData(),
  ])

  const runners = buildRunnerOptions(runnerToolsets)

  // Write JSON files
  writeFileSync(join(DATA_DIR, 'containers.json'), JSON.stringify(containerTypes, null, 2))
  console.log(`\n✅ Written ${DATA_DIR}/containers.json`)

  writeFileSync(join(DATA_DIR, 'runners.json'), JSON.stringify(runners, null, 2))
  console.log(`✅ Written ${DATA_DIR}/runners.json`)

  // Metadata
  const meta = {
    lastUpdated: new Date().toISOString(),
    sources: [
      'Docker Hub API (hub.docker.com)',
      'MCR (mcr.microsoft.com)',
      'actions/runner-images (github.com)',
    ],
  }
  writeFileSync(join(DATA_DIR, 'meta.json'), JSON.stringify(meta, null, 2))
  console.log(`✅ Written ${DATA_DIR}/meta.json`)

  console.log('\n🎉 Done!')
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
