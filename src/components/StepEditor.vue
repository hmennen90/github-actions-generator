<script setup lang="ts">
import { computed } from 'vue'
import type { WorkflowStep } from '../types/workflow'
import { stepCatalog } from '../data/stepCatalog'

const props = defineProps<{
  step: WorkflowStep
  index: number
  totalSteps: number
  jobHasContainer: boolean
}>()

const emit = defineEmits<{
  remove: []
  moveUp: []
  moveDown: []
}>()

const withOptions = computed(() => {
  const entry = stepCatalog.find((s) => s.uses === props.step.uses)
  return entry?.withOptions || {}
})

const hasWithOptions = computed(() => Object.keys(withOptions.value).length > 0)
const isCustomRun = computed(() => !props.step.uses)
</script>

<template>
  <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
    <div class="flex items-center gap-2 px-3 py-2 bg-gray-750 border-b border-gray-700">
      <span class="text-gray-500 text-xs font-mono w-5 text-center">{{ index + 1 }}</span>
      <input
        v-model="step.name"
        class="flex-1 bg-transparent text-sm text-gray-200 font-medium focus:outline-none"
        placeholder="Step name"
      />
      <div class="flex items-center gap-1">
        <button
          v-if="index > 0"
          @click="emit('moveUp')"
          class="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          title="Move up"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          v-if="index < totalSteps - 1"
          @click="emit('moveDown')"
          class="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          title="Move down"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          @click="emit('remove')"
          class="p-1 text-gray-500 hover:text-red-400 transition-colors"
          title="Remove step"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="p-3 space-y-3">
      <!-- Uses display -->
      <div v-if="step.uses" class="text-xs font-mono text-gray-500">
        uses: {{ step.uses }}
      </div>

      <!-- Run command (editable for custom or run-based steps) -->
      <div v-if="isCustomRun || step.run !== undefined">
        <label class="block text-xs text-gray-400 mb-1">Command</label>
        <textarea
          v-model="step.run"
          rows="2"
          class="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500 resize-y"
          placeholder="echo 'Hello World'"
        />
      </div>

      <!-- With parameters -->
      <div v-if="hasWithOptions">
        <div v-for="(opt, key) in withOptions" :key="key" class="mb-2">
          <label class="block text-xs text-gray-400 mb-1">
            {{ opt.label }}
            <span v-if="opt.required" class="text-red-400">*</span>
          </label>
          <input
            :value="step.with?.[key] || ''"
            @input="
              if (!step.with) step.with = {};
              step.with[key] = ($event.target as HTMLInputElement).value
            "
            :placeholder="opt.placeholder"
            class="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Container option (only for run-based steps when job has no container) -->
      <div v-if="!jobHasContainer && step.run" class="flex items-center gap-2 pt-1 border-t border-gray-700">
        <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            :checked="step.container?.enabled"
            @change="
              if (!step.container) step.container = { enabled: false, image: '' };
              step.container.enabled = ($event.target as HTMLInputElement).checked
            "
            class="rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          Run in container
        </label>
        <input
          v-if="step.container?.enabled"
          v-model="step.container.image"
          placeholder="e.g. node:20"
          class="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  </div>
</template>
