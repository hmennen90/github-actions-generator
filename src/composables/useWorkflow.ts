import { reactive, computed } from 'vue'
import type { Workflow, WorkflowStep, WorkflowTrigger } from '../types/workflow'
import type { CatalogStep } from '../types/workflow'
import { generateYaml } from '../utils/yamlGenerator'

let nextId = 1
function uid(): string {
  return `id-${nextId++}-${Date.now()}`
}

const workflow = reactive<Workflow>({
  name: 'CI',
  triggers: [{ type: 'push', branches: ['main'] }],
  jobs: [
    {
      id: 'build',
      name: 'Build',
      runsOn: 'ubuntu-latest',
      steps: [],
    },
  ],
})

export function useWorkflow() {
  const yaml = computed(() => generateYaml(workflow))

  function addTrigger(type: string) {
    const existing = workflow.triggers.find((t) => t.type === type)
    if (existing) return
    const trigger: WorkflowTrigger = { type }
    if (['push', 'pull_request'].includes(type)) {
      trigger.branches = ['main']
    }
    if (type === 'schedule') {
      trigger.cron = '0 0 * * *'
    }
    workflow.triggers.push(trigger)
  }

  function removeTrigger(index: number) {
    workflow.triggers.splice(index, 1)
  }

  function addJob() {
    const jobNum = workflow.jobs.length + 1
    workflow.jobs.push({
      id: `job-${jobNum}`,
      name: `Job ${jobNum}`,
      runsOn: 'ubuntu-latest',
      steps: [],
    })
  }

  function removeJob(index: number) {
    if (workflow.jobs.length > 1) {
      workflow.jobs.splice(index, 1)
    }
  }

  function addStepFromCatalog(jobIndex: number, catalogStep: CatalogStep) {
    const step: WorkflowStep = {
      id: uid(),
      name: catalogStep.label,
      uses: catalogStep.uses,
      run: catalogStep.run,
      with: catalogStep.defaultWith ? { ...catalogStep.defaultWith } : undefined,
    }
    workflow.jobs[jobIndex].steps.push(step)
  }

  function removeStep(jobIndex: number, stepIndex: number) {
    workflow.jobs[jobIndex].steps.splice(stepIndex, 1)
  }

  function moveStep(jobIndex: number, fromIndex: number, toIndex: number) {
    const steps = workflow.jobs[jobIndex].steps
    const [moved] = steps.splice(fromIndex, 1)
    steps.splice(toIndex, 0, moved)
  }

  return {
    workflow,
    yaml,
    addTrigger,
    removeTrigger,
    addJob,
    removeJob,
    addStepFromCatalog,
    removeStep,
    moveStep,
  }
}
