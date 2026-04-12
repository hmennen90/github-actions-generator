import { ref, readonly } from 'vue'
import type { RunnerOption, ContainerType } from '../data/stepCatalog'
import { runsOnOptions as fallbackRunners, containerTypes as fallbackContainers } from '../data/stepCatalog'

const runners = ref<RunnerOption[]>(fallbackRunners)
const containers = ref<ContainerType[]>(fallbackContainers)
const lastUpdated = ref<string | null>(null)
const loading = ref(false)
const loaded = ref(false)

function getBaseUrl(): string {
  return import.meta.env.BASE_URL || '/'
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${getBaseUrl()}data/${path}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function useDynamicData() {
  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true

    const [runnersData, containersData, metaData] = await Promise.all([
      fetchJson<RunnerOption[]>('runners.json'),
      fetchJson<ContainerType[]>('containers.json'),
      fetchJson<{ lastUpdated: string }>('meta.json'),
    ])

    if (runnersData && runnersData.length > 0) {
      runners.value = runnersData
    }
    if (containersData && containersData.length > 0) {
      containers.value = containersData
    }
    if (metaData?.lastUpdated) {
      lastUpdated.value = metaData.lastUpdated
    }

    loading.value = false
    loaded.value = true
  }

  return {
    runners: readonly(runners),
    containers: readonly(containers),
    lastUpdated: readonly(lastUpdated),
    loading: readonly(loading),
    load,
  }
}
