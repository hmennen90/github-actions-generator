<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWorkflow } from './composables/useWorkflow'
import { useDynamicData } from './composables/useDynamicData'
import StepCatalog from './components/StepCatalog.vue'
import JobEditor from './components/JobEditor.vue'
import TriggerEditor from './components/TriggerEditor.vue'
import YamlPreview from './components/YamlPreview.vue'
import type { CatalogStep } from './types/workflow'

const { lastUpdated, load: loadData } = useDynamicData()
onMounted(() => loadData())

const {
  workflow,
  yaml,
  addTrigger,
  removeTrigger,
  addJob,
  removeJob,
  addStepFromCatalog,
  removeStep,
  moveStep,
} = useWorkflow()

const activeJobIndex = ref(0)

function handleAddStep(step: CatalogStep) {
  addStepFromCatalog(activeJobIndex.value, step)
}
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-900 text-gray-100">
    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-2.5 bg-gray-950 border-b border-gray-800">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h1 class="text-lg font-semibold">GitHub Actions Generator</h1>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="lastUpdated" class="text-xs text-gray-600" :title="lastUpdated">
          Data: {{ new Date(lastUpdated).toLocaleDateString() }}
        </span>
        <a
          href="https://docs.github.com/en/actions"
          target="_blank"
          class="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Actions Docs
        </a>
      </div>
    </header>

    <!-- Main Layout -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Step Catalog -->
      <aside class="w-64 border-r border-gray-800 bg-gray-900 flex-shrink-0 overflow-hidden">
        <StepCatalog @add="handleAddStep" />
      </aside>

      <!-- Center: Workflow Editor -->
      <main class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Workflow Name -->
        <div class="flex items-center gap-3">
          <label class="text-xs text-gray-500 uppercase tracking-wider">Workflow</label>
          <input
            v-model="workflow.name"
            class="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 font-medium focus:outline-none focus:border-blue-500 w-64"
            placeholder="CI"
          />
        </div>

        <!-- Triggers -->
        <div>
          <label class="block text-xs text-gray-500 uppercase tracking-wider mb-2">Triggers</label>
          <TriggerEditor
            :triggers="workflow.triggers"
            @add="addTrigger"
            @remove="removeTrigger"
          />
        </div>

        <!-- Job Tabs -->
        <div class="flex items-center gap-2 border-b border-gray-700 pb-0">
          <button
            v-for="(job, index) in workflow.jobs"
            :key="job.id"
            @click="activeJobIndex = index"
            class="px-3 py-1.5 text-sm rounded-t transition-colors border-b-2 -mb-px"
            :class="
              activeJobIndex === index
                ? 'text-blue-400 border-blue-400 bg-gray-800'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            "
          >
            {{ job.name || job.id }}
          </button>
          <button
            @click="addJob(); activeJobIndex = workflow.jobs.length - 1"
            class="px-2 py-1.5 text-sm text-gray-500 hover:text-blue-400 transition-colors"
          >
            + Job
          </button>
        </div>

        <!-- Active Job Editor -->
        <JobEditor
          v-if="workflow.jobs[activeJobIndex]"
          :job="workflow.jobs[activeJobIndex]"
          :job-index="activeJobIndex"
          :can-remove="workflow.jobs.length > 1"
          @remove="removeJob(activeJobIndex); activeJobIndex = Math.max(0, activeJobIndex - 1)"
          @add-step="addStepFromCatalog"
          @remove-step="removeStep"
          @move-step="moveStep"
        />
      </main>

      <!-- Right: YAML Preview -->
      <aside class="w-96 border-l border-gray-800 bg-gray-950 flex-shrink-0 overflow-hidden">
        <YamlPreview :yaml="yaml" />
      </aside>
    </div>
  </div>
</template>
