<script setup lang="ts">
import type { WorkflowTrigger } from '../types/workflow'
import { triggerOptions } from '../data/stepCatalog'

defineProps<{
  triggers: WorkflowTrigger[]
}>()

const emit = defineEmits<{
  add: [type: string]
  remove: [index: number]
}>()

function addBranch(trigger: WorkflowTrigger) {
  if (!trigger.branches) trigger.branches = []
  trigger.branches.push('')
}

function removeBranch(trigger: WorkflowTrigger, index: number) {
  trigger.branches?.splice(index, 1)
}

function getActivityTypes(triggerType: string): string[] {
  return triggerOptions.find((o) => o.value === triggerType)?.activityTypes || []
}

function toggleType(trigger: WorkflowTrigger, actType: string) {
  if (!trigger.types) trigger.types = []
  const idx = trigger.types.indexOf(actType)
  if (idx >= 0) {
    trigger.types.splice(idx, 1)
  } else {
    trigger.types.push(actType)
  }
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(trigger, index) in triggers"
      :key="index"
      class="bg-gray-800 rounded-lg p-2.5 border border-gray-700 space-y-2"
    >
      <div class="flex flex-wrap items-start gap-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{{ trigger.type }}</span>
          <button
            @click="emit('remove', index)"
            class="p-0.5 text-gray-500 hover:text-red-400 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Branches -->
        <div v-if="['push', 'pull_request'].includes(trigger.type)" class="flex flex-wrap items-center gap-1.5 flex-1">
          <span class="text-xs text-gray-500">branches:</span>
          <div v-for="(_branch, bIdx) in trigger.branches" :key="bIdx" class="flex items-center gap-0.5">
            <input
              v-model="trigger.branches![bIdx]"
              class="px-1.5 py-0.5 bg-gray-900 border border-gray-600 rounded text-xs text-gray-200 font-mono w-24 focus:outline-none focus:border-blue-500"
              placeholder="main"
            />
            <button @click="removeBranch(trigger, bIdx)" class="text-gray-600 hover:text-red-400 text-xs">&times;</button>
          </div>
          <button
            @click="addBranch(trigger)"
            class="text-xs text-blue-400 hover:text-blue-300"
          >+ branch</button>
        </div>

        <!-- Cron -->
        <div v-if="trigger.type === 'schedule'" class="flex items-center gap-1.5">
          <span class="text-xs text-gray-500">cron:</span>
          <input
            v-model="trigger.cron"
            class="px-1.5 py-0.5 bg-gray-900 border border-gray-600 rounded text-xs text-gray-200 font-mono w-36 focus:outline-none focus:border-blue-500"
            placeholder="0 0 * * *"
          />
        </div>
      </div>

      <!-- Activity Types -->
      <div v-if="getActivityTypes(trigger.type).length > 0">
        <span class="text-xs text-gray-500">types:</span>
        <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1">
          <label
            v-for="actType in getActivityTypes(trigger.type)"
            :key="actType"
            class="flex items-center gap-1.5 text-xs cursor-pointer"
            :class="trigger.types?.includes(actType) ? 'text-gray-200' : 'text-gray-500'"
          >
            <input
              type="checkbox"
              :checked="trigger.types?.includes(actType)"
              @change="toggleType(trigger, actType)"
              class="rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 w-3 h-3"
            />
            {{ actType }}
          </label>
        </div>
        <p v-if="!trigger.types?.length" class="text-xs text-gray-600 mt-1">
          No types selected = all activity types (GitHub default)
        </p>
      </div>
    </div>

    <!-- Add trigger -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="opt in triggerOptions"
        :key="opt.value"
        :disabled="triggers.some((t) => t.type === opt.value)"
        @click="emit('add', opt.value)"
        class="px-2 py-1 text-xs rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700"
      >
        + {{ opt.label }}
      </button>
    </div>
  </div>
</template>
