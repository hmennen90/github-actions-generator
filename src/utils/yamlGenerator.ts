import type { Workflow, WorkflowJob, WorkflowStep, WorkflowTrigger } from '../types/workflow'

function indent(text: string, level: number): string {
  const spaces = '  '.repeat(level)
  return text
    .split('\n')
    .map((line) => (line.trim() ? spaces + line : ''))
    .join('\n')
}

function formatTrigger(trigger: WorkflowTrigger): string {
  if (trigger.type === 'workflow_dispatch') {
    return '  workflow_dispatch:'
  }

  if (trigger.type === 'schedule' && trigger.cron) {
    return `  schedule:\n    - cron: '${trigger.cron}'`
  }

  const lines = [`  ${trigger.type}:`]
  if (trigger.branches && trigger.branches.length > 0) {
    lines.push('    branches:')
    for (const branch of trigger.branches) {
      lines.push(`      - ${branch}`)
    }
  }
  if (trigger.types && trigger.types.length > 0) {
    lines.push('    types:')
    for (const t of trigger.types) {
      lines.push(`      - ${t}`)
    }
  }

  if (trigger.paths && trigger.paths.length > 0) {
    lines.push('    paths:')
    for (const path of trigger.paths) {
      lines.push(`      - '${path}'`)
    }
  }

  // If no sub-config, keep it simple
  if (lines.length === 1) {
    return lines[0]
  }

  return lines.join('\n')
}

function formatStep(step: WorkflowStep, inJobContainer: boolean): string {
  const lines: string[] = []

  lines.push(`- name: ${step.name}`)

  if (step.ifCondition) {
    lines.push(`  if: ${step.ifCondition}`)
  }

  if (step.uses) {
    lines.push(`  uses: ${step.uses}`)
  }

  if (step.run !== undefined && step.run !== '') {
    if (step.run.includes('\n')) {
      lines.push('  run: |')
      for (const runLine of step.run.split('\n')) {
        lines.push(`    ${runLine}`)
      }
    } else {
      lines.push(`  run: ${step.run}`)
    }
  }

  if (step.with && Object.keys(step.with).length > 0) {
    lines.push('  with:')
    for (const [key, value] of Object.entries(step.with)) {
      if (value) {
        lines.push(`    ${key}: ${value}`)
      }
    }
  }

  if (step.env && Object.keys(step.env).length > 0) {
    lines.push('  env:')
    for (const [key, value] of Object.entries(step.env)) {
      if (value) {
        lines.push(`    ${key}: ${value}`)
      }
    }
  }

  // Per-step container (only if job doesn't already use a container)
  if (!inJobContainer && step.container?.enabled && step.container.image) {
    // GitHub Actions doesn't support per-step containers natively.
    // We convert this to a docker run command wrapping the step's run command.
    const stepIdx = lines.findIndex((l) => l.startsWith('  run:'))
    if (stepIdx !== -1 && step.run) {
      const escapedRun = step.run.replace(/'/g, "'\\''")
      lines[stepIdx] = `  run: docker run --rm -v $GITHUB_WORKSPACE:/workspace -w /workspace ${step.container.image} sh -c '${escapedRun}'`
      // Remove multiline run lines if any
      while (stepIdx + 1 < lines.length && lines[stepIdx + 1].startsWith('    ')) {
        lines.splice(stepIdx + 1, 1)
      }
    }
  }

  return lines.join('\n')
}

function formatJob(job: WorkflowJob): string {
  const lines: string[] = []

  lines.push(`  ${job.id}:`)
  lines.push(`    name: ${job.name}`)
  lines.push(`    runs-on: ${job.runsOn}`)

  if (job.container?.enabled && job.container.image) {
    lines.push(`    container:`)
    lines.push(`      image: ${job.container.image}`)
    if (job.container.options) {
      lines.push(`      options: ${job.container.options}`)
    }
  }

  const hasContainer = !!(job.container?.enabled && job.container.image)

  lines.push('    steps:')
  for (const step of job.steps) {
    const stepYaml = formatStep(step, hasContainer)
    lines.push(indent(stepYaml, 3))
  }

  return lines.join('\n')
}

export function generateYaml(workflow: Workflow): string {
  const lines: string[] = []

  lines.push(`name: ${workflow.name}`)
  lines.push('')
  lines.push('on:')

  if (workflow.triggers.length === 0) {
    lines.push('  workflow_dispatch:')
  } else {
    for (const trigger of workflow.triggers) {
      lines.push(formatTrigger(trigger))
    }
  }

  lines.push('')
  lines.push('jobs:')

  for (const job of workflow.jobs) {
    lines.push(formatJob(job))
  }

  return lines.join('\n') + '\n'
}
