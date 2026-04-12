<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { WorkflowJob } from '../types/workflow'
import { useDynamicData } from '../composables/useDynamicData'
import { useImageInspect } from '../composables/useImageInspect'

const { containers } = useDynamicData()
const { inspect, getResult, inspecting } = useImageInspect()

const props = defineProps<{
  job: WorkflowJob
}>()

const selectedTypeId = ref('none')
const customRegistry = ref('')
const customImage = ref('')
const packageSearch = ref('')
const showSearchResults = ref(false)

interface SearchResult {
  typeId: string
  typeLabel: string
  typeIcon: string
  image: { value: string; label: string }
  matchedPackages: string[]
}

const searchResults = computed<SearchResult[]>(() => {
  const q = packageSearch.value.trim().toLowerCase()
  if (!q) return []

  const results: SearchResult[] = []

  for (const type of containers.value) {
    if (type.id === 'none' || type.id === 'custom') continue
    for (const img of type.images) {
      if (!img.preInstalled || img.preInstalled.length === 0) continue
      const pkgStrings = img.preInstalled.map((p: any) =>
        typeof p === 'string' ? p : p.name || ''
      )
      const matched = pkgStrings.filter((p: string) => p.toLowerCase().includes(q))
      if (matched.length > 0) {
        results.push({
          typeId: type.id,
          typeLabel: type.label,
          typeIcon: type.icon,
          image: img,
          matchedPackages: matched,
        })
      }
    }
  }

  return results
})

function hideSearchDelayed() {
  setTimeout(() => { showSearchResults.value = false }, 200)
}

function selectSearchResult(result: SearchResult) {
  selectedTypeId.value = result.typeId
  if (!props.job.container) {
    props.job.container = { enabled: true, image: '' }
  }
  props.job.container.enabled = true
  props.job.container.image = result.image.value
  packageSearch.value = ''
  showSearchResults.value = false
}

// Sync from job state on mount
const currentImage = props.job.container?.image || ''
if (currentImage) {
  const found = containers.value.find(
    (t) => t.id !== 'none' && t.id !== 'custom' && t.images.some((img: any) => img.value === currentImage)
  )
  if (found) {
    selectedTypeId.value = found.id
  } else if (currentImage) {
    selectedTypeId.value = 'custom'
    const parts = currentImage.split('/')
    if (parts.length > 1) {
      customRegistry.value = parts.slice(0, -1).join('/')
      customImage.value = parts[parts.length - 1]
    } else {
      customImage.value = currentImage
    }
  }
}

const selectedType = computed(() => containers.value.find((t) => t.id === selectedTypeId.value))
const availableImages = computed(() => selectedType.value?.images || [])
const selectedImageEntry = computed(() =>
  availableImages.value.find((img: any) => img.value === props.job.container?.image)
)

// The current image string
const currentImageValue = computed(() => props.job.container?.image || '')

// Inspect result for current image
const inspectResult = computed(() => getResult(currentImageValue.value))
const isInspecting = computed(() => inspecting.value === currentImageValue.value)

// Trigger inspect when image changes
watch(currentImageValue, (img) => {
  if (img) inspect(img)
}, { immediate: true })

// Static pre-installed from curated data
const staticPackages = computed(() => {
  const entry = selectedImageEntry.value
  if (!entry?.preInstalled) return []
  return entry.preInstalled.map((p: any) => typeof p === 'string' ? p : p.name)
})

// Extended packages from Docker inspect (not already in static list)
const extendedPackages = computed(() => {
  const result = inspectResult.value
  if (!result) return []
  const staticSet = new Set(staticPackages.value.map((s: string) => s.toLowerCase()))
  const extra: string[] = []
  for (const pkg of result.envPackages) {
    const base = pkg.split(' ')[0].toLowerCase()
    if (!staticSet.has(base)) {
      extra.push(pkg)
    }
  }
  return extra
})

function onTypeChange(typeId: string) {
  selectedTypeId.value = typeId

  if (typeId === 'none') {
    if (props.job.container) {
      props.job.container.enabled = false
      props.job.container.image = ''
    }
    return
  }

  if (typeId === 'custom') {
    if (!props.job.container) {
      props.job.container = { enabled: true, image: '' }
    }
    props.job.container.enabled = true
    updateCustomImage()
    return
  }

  const type = containers.value.find((t) => t.id === typeId)
  if (type && type.images.length > 0) {
    if (!props.job.container) {
      props.job.container = { enabled: true, image: '' }
    }
    props.job.container.enabled = true
    props.job.container.image = type.images[0].value
  }
}

function onImageChange(imageValue: string) {
  if (!props.job.container) {
    props.job.container = { enabled: true, image: '' }
  }
  props.job.container.enabled = true
  props.job.container.image = imageValue
}

function updateCustomImage() {
  if (!props.job.container) {
    props.job.container = { enabled: true, image: '' }
  }
  props.job.container.enabled = true
  if (customRegistry.value) {
    props.job.container.image = `${customRegistry.value}/${customImage.value}`
  } else {
    props.job.container.image = customImage.value
  }
}

watch([customRegistry, customImage], () => {
  if (selectedTypeId.value === 'custom') {
    updateCustomImage()
  }
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Package Search -->
    <div class="relative">
      <label class="block text-xs text-gray-500 mb-1">Find image by package</label>
      <input
        v-model="packageSearch"
        @focus="showSearchResults = true"
        @blur="hideSearchDelayed"
        type="text"
        placeholder="e.g. Node 14, Python 3.12, GCC..."
        class="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
      <!-- Search Results Dropdown -->
      <div
        v-if="showSearchResults && packageSearch.trim() && searchResults.length > 0"
        class="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-gray-800 border border-gray-600 rounded-lg shadow-xl"
      >
        <button
          v-for="result in searchResults"
          :key="result.image.value"
          @mousedown.prevent="selectSearchResult(result)"
          class="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm">{{ result.typeIcon }}</span>
            <span class="text-sm text-gray-200">{{ result.image.label }}</span>
            <span class="text-xs text-gray-500 font-mono">{{ result.image.value }}</span>
          </div>
          <div class="flex flex-wrap gap-1 mt-1">
            <span
              v-for="pkg in result.matchedPackages"
              :key="pkg"
              class="text-xs px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded border border-blue-500/20"
            >
              {{ pkg }}
            </span>
          </div>
        </button>
      </div>
      <div
        v-else-if="showSearchResults && packageSearch.trim().length >= 2 && searchResults.length === 0"
        class="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl px-3 py-2 text-sm text-gray-500"
      >
        No images found with "{{ packageSearch.trim() }}"
      </div>
    </div>

    <div class="flex flex-wrap items-end gap-3">
      <!-- Container Type -->
      <div>
        <label class="block text-xs text-gray-500 mb-1">Container</label>
        <select
          :value="selectedTypeId"
          @change="onTypeChange(($event.target as HTMLSelectElement).value)"
          class="px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
        >
          <option v-for="type in containers" :key="type.id" :value="type.id">
            {{ type.icon ? type.icon + ' ' : '' }}{{ type.label }}
          </option>
        </select>
      </div>

      <!-- Image Selector -->
      <div v-if="selectedTypeId !== 'none' && selectedTypeId !== 'custom' && availableImages.length > 0">
        <label class="block text-xs text-gray-500 mb-1">Image</label>
        <select
          :value="job.container?.image || ''"
          @change="onImageChange(($event.target as HTMLSelectElement).value)"
          class="px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
        >
          <option v-for="img in availableImages" :key="img.value" :value="img.value">
            {{ img.label }}
          </option>
        </select>
      </div>

      <!-- Custom Registry + Image -->
      <template v-if="selectedTypeId === 'custom'">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Registry (optional)</label>
          <input
            v-model="customRegistry"
            placeholder="ghcr.io/owner, registry.example.com"
            class="px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Image</label>
          <input
            v-model="customImage"
            placeholder="my-image:latest"
            class="px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500 w-52"
          />
        </div>
      </template>
    </div>

    <!-- Pre-installed packages -->
    <div
      v-if="currentImageValue && (staticPackages.length > 0 || isInspecting || inspectResult)"
      class="space-y-2"
    >
      <!-- Static (curated) packages -->
      <div v-if="staticPackages.length > 0" class="flex flex-wrap gap-1.5 items-center">
        <span class="text-xs text-gray-500">Pre-installed:</span>
        <span
          v-for="pkg in staticPackages"
          :key="pkg"
          class="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded border border-gray-700"
        >
          {{ pkg }}
        </span>
        <!-- Spinner while inspecting -->
        <span
          v-if="isInspecting"
          class="inline-flex items-center gap-1 text-xs text-gray-500"
        >
          <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          inspecting image...
        </span>
      </div>

      <!-- No static packages — show spinner standalone -->
      <div v-else-if="isInspecting" class="flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="text-xs text-gray-500">Inspecting image for package details...</span>
      </div>

      <!-- Extended packages from inspect (ENV-detected) -->
      <div v-if="extendedPackages.length > 0" class="flex flex-wrap gap-1.5 items-center">
        <span class="text-xs text-gray-500">Detected:</span>
        <span
          v-for="pkg in extendedPackages"
          :key="pkg"
          class="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20"
        >
          {{ pkg }}
        </span>
      </div>

      <!-- Dockerfile hints from inspect -->
      <div v-if="inspectResult?.dockerfileHints?.length" class="flex flex-wrap gap-1.5 items-center">
        <span class="text-xs text-gray-500">Dockerfile packages:</span>
        <span
          v-for="pkg in inspectResult.dockerfileHints.slice(0, 20)"
          :key="pkg"
          class="text-xs px-1.5 py-0.5 bg-gray-800/50 text-gray-500 rounded border border-gray-700/50"
        >
          {{ pkg }}
        </span>
      </div>

      <!-- Image meta from inspect -->
      <div v-if="inspectResult" class="flex items-center gap-3 text-xs text-gray-600">
        <span>{{ inspectResult.os }}/{{ inspectResult.architecture }}</span>
        <span>{{ inspectResult.size }}</span>
        <span class="text-green-600/60" title="Data from Docker Registry inspect, cached locally for 7 days">cached</span>
      </div>
    </div>

    <!-- Full image path -->
    <div v-if="job.container?.enabled && job.container.image" class="text-xs font-mono text-gray-500">
      image: {{ job.container.image }}
    </div>
  </div>
</template>
