<script setup lang="ts">
import { ref, computed } from 'vue'
import { stepCatalog } from '../data/stepCatalog'
import type { CatalogStep } from '../types/workflow'

const emit = defineEmits<{
  add: [step: CatalogStep]
}>()

const search = ref('')
const expandedCategory = ref<string | null>('Setup')

const categories = computed(() => {
  const cats = new Map<string, CatalogStep[]>()
  for (const step of stepCatalog) {
    if (search.value && !step.label.toLowerCase().includes(search.value.toLowerCase())) continue
    if (!cats.has(step.category)) cats.set(step.category, [])
    cats.get(step.category)!.push(step)
  }
  return cats
})

function toggleCategory(cat: string) {
  expandedCategory.value = expandedCategory.value === cat ? null : cat
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="p-3 border-b border-gray-700">
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Step Catalog</h2>
      <input
        v-model="search"
        type="text"
        placeholder="Search steps..."
        class="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
    </div>
    <div class="flex-1 overflow-y-auto">
      <div v-for="[category, steps] in categories" :key="category">
        <button
          @click="toggleCategory(category)"
          class="w-full px-3 py-2 flex items-center justify-between text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <span>{{ category }}</span>
          <svg
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-90': expandedCategory === category }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div v-if="expandedCategory === category" class="pb-1">
          <button
            v-for="step in steps"
            :key="step.id"
            @click="emit('add', step)"
            class="w-full px-3 py-2 pl-5 flex items-center gap-2 text-sm text-gray-400 hover:bg-gray-750 hover:text-gray-200 transition-colors group"
          >
            <span class="text-base">{{ step.icon }}</span>
            <div class="text-left flex-1 min-w-0">
              <div class="truncate">{{ step.label }}</div>
              <div class="text-xs text-gray-500 truncate group-hover:text-gray-400">{{ step.description }}</div>
            </div>
            <svg class="w-4 h-4 opacity-0 group-hover:opacity-100 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
