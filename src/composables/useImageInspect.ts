import { ref, readonly } from 'vue'

export interface InspectResult {
  architecture: string
  os: string
  size: string
  created: string
  envPackages: string[]
  dockerfileHints: string[]
}

const CACHE_KEY = 'gha-gen-image-inspect'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEntry {
  data: InspectResult
  ts: number
}

function getCache(): Record<string, CacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function setCache(cache: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage full — evict oldest entries
    const entries = Object.entries(cache).sort(([, a], [, b]) => a.ts - b.ts)
    const trimmed = Object.fromEntries(entries.slice(Math.floor(entries.length / 2)))
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed))
    } catch {
      // give up
    }
  }
}

function getCached(image: string): InspectResult | null {
  const cache = getCache()
  const entry = cache[image]
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return entry.data
  }
  return null
}

function setCached(image: string, data: InspectResult) {
  const cache = getCache()
  cache[image] = { data, ts: Date.now() }
  setCache(cache)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Extract package hints from environment variables and Dockerfile history.
 *
 * Docker Hub v2 manifests give us the image config which includes:
 * - Env vars (PATH additions hint at installed tools)
 * - History (Dockerfile commands — RUN apt-get install, apk add, etc.)
 */
function parseConfig(config: any): Partial<InspectResult> {
  const envPackages: string[] = []
  const dockerfileHints: string[] = []

  // Parse ENV for known tool paths
  const env: string[] = config.config?.Env || []
  for (const e of env) {
    // JAVA_HOME, GOLANG_VERSION, PYTHON_VERSION, NODE_VERSION, PHP_VERSION, RUSTUP_HOME, DOTNET_ROOT, etc.
    const knownVars: Record<string, string> = {
      JAVA_HOME: 'Java',
      JAVA_VERSION: 'Java',
      GOLANG_VERSION: 'Go',
      PYTHON_VERSION: 'Python',
      NODE_VERSION: 'Node.js',
      PHP_VERSION: 'PHP',
      RUBY_VERSION: 'Ruby',
      RUST_VERSION: 'Rust',
      RUSTUP_HOME: 'Rust',
      DOTNET_ROOT: '.NET',
      DOTNET_SDK_VERSION: '.NET SDK',
      GCC_VERSION: 'GCC',
      COMPOSER_VERSION: 'Composer',
      YARN_VERSION: 'Yarn',
      NPM_VERSION: 'npm',
    }

    const [key, ...valueParts] = e.split('=')
    const value = valueParts.join('=')

    if (knownVars[key]) {
      const label = knownVars[key]
      // Include version if it's a version-like value
      if (/^\d/.test(value) && value.length < 30) {
        envPackages.push(`${label} ${value}`)
      } else if (!envPackages.some((p) => p.startsWith(label))) {
        envPackages.push(label)
      }
    }
  }

  // Parse history for RUN commands
  const history: { created_by?: string }[] = config.history || []
  for (const h of history) {
    const cmd = h.created_by || ''

    // apt-get install
    const aptMatch = cmd.match(/apt-get\s+install\s+(?:-[^\s]+\s+)*(.+?)(?:\s*&&|$)/i)
    if (aptMatch) {
      const pkgs = aptMatch[1]
        .split(/\s+/)
        .filter((p: string) => p && !p.startsWith('-') && !p.startsWith('$'))
        .slice(0, 15) // limit
      dockerfileHints.push(...pkgs)
    }

    // apk add
    const apkMatch = cmd.match(/apk\s+(?:add|--no-cache\s+add)\s+(?:--[^\s]+\s+)*(.+?)(?:\s*&&|$)/i)
    if (apkMatch) {
      const pkgs = apkMatch[1]
        .split(/\s+/)
        .filter((p: string) => p && !p.startsWith('-') && !p.startsWith('$'))
        .slice(0, 15)
      dockerfileHints.push(...pkgs)
    }

    // pip install
    const pipMatch = cmd.match(/pip\s+install\s+(?:--[^\s]+\s+)*(.+?)(?:\s*&&|$)/i)
    if (pipMatch) {
      const pkgs = pipMatch[1]
        .split(/\s+/)
        .filter((p: string) => p && !p.startsWith('-') && !p.startsWith('/'))
        .slice(0, 10)
      dockerfileHints.push(...pkgs.map((p: string) => `pip: ${p}`))
    }
  }

  return {
    architecture: config.architecture || 'unknown',
    os: config.os || 'unknown',
    created: config.created || '',
    envPackages: [...new Set(envPackages)],
    dockerfileHints: [...new Set(dockerfileHints)],
  }
}

/**
 * Fetch image config from Docker Hub using the v2 registry API.
 * Docker Hub allows anonymous pulls with a temporary token.
 */
async function fetchImageConfig(image: string): Promise<InspectResult | null> {
  const [repo, tag = 'latest'] = image.split(':')

  // For official images, the namespace is "library"
  const fullRepo = repo.includes('/') ? repo : `library/${repo}`

  // 1. Get anonymous auth token
  const authRes = await fetch(
    `https://auth.docker.io/token?service=registry.docker.io&scope=repository:${fullRepo}:pull`
  )
  if (!authRes.ok) return null
  const { token } = await authRes.json()

  // 2. Get manifest (prefer v2 schema 2 for config digest)
  const manifestRes = await fetch(
    `https://registry-1.docker.io/v2/${fullRepo}/manifests/${tag}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: [
          'application/vnd.docker.distribution.manifest.v2+json',
          'application/vnd.oci.image.manifest.v1+json',
          'application/vnd.docker.distribution.manifest.list.v2+json',
        ].join(', '),
      },
    }
  )
  if (!manifestRes.ok) return null

  let manifest = await manifestRes.json()

  // If it's a manifest list (multi-arch), pick linux/amd64
  if (manifest.manifests) {
    const amd64 = manifest.manifests.find(
      (m: any) => m.platform?.architecture === 'amd64' && m.platform?.os === 'linux'
    ) || manifest.manifests[0]
    if (!amd64) return null

    const subRes = await fetch(
      `https://registry-1.docker.io/v2/${fullRepo}/manifests/${amd64.digest}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.manifest.v1+json',
        },
      }
    )
    if (!subRes.ok) return null
    manifest = await subRes.json()
  }

  // 3. Get config blob
  const configDigest = manifest.config?.digest
  if (!configDigest) return null

  const configRes = await fetch(
    `https://registry-1.docker.io/v2/${fullRepo}/blobs/${configDigest}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
  if (!configRes.ok) return null
  const config = await configRes.json()

  // 4. Calculate total size
  const totalSize = (manifest.layers || []).reduce(
    (acc: number, l: any) => acc + (l.size || 0),
    0
  )

  const parsed = parseConfig(config)
  return {
    architecture: parsed.architecture || 'unknown',
    os: parsed.os || 'unknown',
    size: formatBytes(totalSize),
    created: parsed.created || '',
    envPackages: parsed.envPackages || [],
    dockerfileHints: parsed.dockerfileHints || [],
  }
}

// ─── Composable ────────────────────────────────────────────────────────

const inspecting = ref<string | null>(null)
const results = ref<Record<string, InspectResult>>({})

export function useImageInspect() {
  async function inspect(image: string): Promise<InspectResult | null> {
    if (!image) return null

    // Check in-memory
    if (results.value[image]) return results.value[image]

    // Check localStorage
    const cached = getCached(image)
    if (cached) {
      results.value[image] = cached
      return cached
    }

    // Fetch from registry
    inspecting.value = image
    try {
      const result = await fetchImageConfig(image)
      if (result) {
        results.value[image] = result
        setCached(image, result)
        return result
      }
    } catch (err) {
      console.warn(`Image inspect failed for ${image}:`, err)
    } finally {
      inspecting.value = null
    }
    return null
  }

  function getResult(image: string): InspectResult | null {
    return results.value[image] || null
  }

  return {
    inspect,
    getResult,
    inspecting: readonly(inspecting),
    results: readonly(results),
  }
}
