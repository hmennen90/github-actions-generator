export interface WorkflowStep {
  id: string
  name: string
  uses?: string
  run?: string
  with?: Record<string, string>
  env?: Record<string, string>
  ifCondition?: string
  container?: {
    enabled: boolean
    image: string
  }
}

export interface WorkflowJob {
  id: string
  name: string
  runsOn: string
  container?: {
    enabled: boolean
    image: string
    options?: string
  }
  steps: WorkflowStep[]
}

export interface WorkflowTrigger {
  type: string
  branches?: string[]
  paths?: string[]
  cron?: string
  types?: string[]
}

export interface Workflow {
  name: string
  triggers: WorkflowTrigger[]
  jobs: WorkflowJob[]
}

export interface CatalogStep {
  id: string
  label: string
  category: string
  icon: string
  description: string
  uses?: string
  run?: string
  defaultWith?: Record<string, string>
  withOptions?: Record<string, { label: string; placeholder: string; required?: boolean }>
}
