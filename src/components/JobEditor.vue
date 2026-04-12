<script setup lang="ts">
import { computed } from 'vue'
import type { WorkflowJob } from '../types/workflow'
import type { CatalogStep } from '../types/workflow'
import { useDynamicData } from '../composables/useDynamicData'
import StepEditor from './StepEditor.vue'
import ContainerSelector from './ContainerSelector.vue'

const { runners } = useDynamicData()

const props = defineProps<{
  job: WorkflowJob
  jobIndex: number
  canRemove: boolean
}>()

const emit = defineEmits<{
  remove: []
  addStep: [jobIndex: number, step: CatalogStep]
  removeStep: [jobIndex: number, stepIndex: number]
  moveStep: [jobIndex: number, from: number, to: number]
}>()

const hasContainer = computed(() => !!(props.job.container?.enabled && props.job.container.image))
const selectedRunner = computed(() => runners.value.find((r: any) => r.value === props.job.runsOn))

const linuxRunners = computed(() => runners.value.filter((r: any) => r.value.startsWith('ubuntu')))
const windowsRunners = computed(() => runners.value.filter((r: any) => r.value.startsWith('windows')))
const macosRunners = computed(() => runners.value.filter((r: any) => r.value.startsWith('macos')))
const otherRunners = computed(() => runners.value.filter((r: any) => r.value === 'self-hosted'))
</script>

<template>
  <div class="bg-gray-850 rounded-xl border border-gray-700 overflow-hidden">
    <!-- Job Header -->
    <div class="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700">
      <div class="flex-1 flex items-center gap-3">
        <div>
          <label class="block text-xs text-gray-500 mb-0.5">Job ID</label>
          <input
            v-model="job.id"
            class="bg-transparent text-sm text-gray-300 font-mono focus:outline-none w-28"
            placeholder="build"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-0.5">Name</label>
          <input
            v-model="job.name"
            class="bg-transparent text-sm text-gray-200 font-medium focus:outline-none w-40"
            placeholder="Build"
          />
        </div>
      </div>
      <button
        v-if="canRemove"
        @click="emit('remove')"
        class="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
        title="Remove job"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <!-- Job Config -->
    <div class="px-4 py-3 space-y-3 border-b border-gray-700">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Runs on</label>
        <div class="flex items-center gap-2">
          <select
            v-model="job.runsOn"
            class="px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <optgroup label="Linux">
              <option v-for="opt in linuxRunners" :key="opt.value" :value="opt.value">
                {{ opt.label }}{{ opt.billing === 'paid' ? ' \uD83D\uDCB0' : '' }}
              </option>
            </optgroup>
            <optgroup label="Windows">
              <option v-for="opt in windowsRunners" :key="opt.value" :value="opt.value">
                {{ opt.label }}{{ opt.billing === 'paid' ? ' \uD83D\uDCB0' : '' }}
              </option>
            </optgroup>
            <optgroup label="macOS">
              <option v-for="opt in macosRunners" :key="opt.value" :value="opt.value">
                {{ opt.label }}{{ opt.billing === 'paid' ? ' \uD83D\uDCB0' : '' }}
              </option>
            </optgroup>
            <optgroup label="Other">
              <option v-for="opt in otherRunners" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </optgroup>
          </select>
          <span
            v-if="selectedRunner?.billing === 'paid'"
            class="px-1.5 py-0.5 text-xs font-medium rounded bg-amber-500/20 text-amber-400 border border-amber-500/30"
          >
            Paid
          </span>
          <span
            v-else-if="selectedRunner?.note"
            class="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-500/15 text-blue-400 border border-blue-500/20"
          >
            Free*
          </span>
          <span
            v-else
            class="px-1.5 py-0.5 text-xs font-medium rounded bg-green-500/15 text-green-400 border border-green-500/20"
          >
            Free
          </span>
        </div>
        <p v-if="selectedRunner?.note" class="mt-1 text-xs text-gray-500">
          {{ selectedRunner.billing === 'paid' ? '\uD83D\uDCB0 ' : '\u2139\uFE0F ' }}{{ selectedRunner.note }}
        </p>
      </div>

      <!-- Pre-installed software for selected runner -->
      <div
        v-if="selectedRunner?.preInstalled && selectedRunner.preInstalled.length > 0"
        class="flex flex-wrap gap-1.5 items-center"
      >
        <span class="text-xs text-gray-500">Runner pre-installed:</span>
        <span
          v-for="tool in selectedRunner.preInstalled"
          :key="tool.name"
          class="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded border border-gray-700"
          :title="tool.versions ? tool.versions.join(', ') : ''"
        >
          {{ tool.name }}{{ tool.versions?.length ? ' ' + tool.versions[0] + (tool.versions.length > 1 ? '+' : '') : '' }}
        </span>
      </div>

      <ContainerSelector :job="job" />
    </div>

    <!-- Steps -->
    <div class="p-4">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Steps ({{ job.steps.length }})
      </h3>
      <div class="space-y-2">
        <StepEditor
          v-for="(step, stepIndex) in job.steps"
          :key="step.id"
          :step="step"
          :index="stepIndex"
          :total-steps="job.steps.length"
          :job-has-container="hasContainer"
          @remove="emit('removeStep', jobIndex, stepIndex)"
          @move-up="emit('moveStep', jobIndex, stepIndex, stepIndex - 1)"
          @move-down="emit('moveStep', jobIndex, stepIndex, stepIndex + 1)"
        />
      </div>
      <div v-if="job.steps.length === 0" class="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-700 rounded-lg">
        Add steps from the catalog on the left
      </div>
    </div>
  </div>
</template>
