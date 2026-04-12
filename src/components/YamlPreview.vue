<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  yaml: string
}>()

const copied = ref(false)

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.yaml)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = props.yaml
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
}

function download() {
  const blob = new Blob([props.yaml], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ci.yml'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between p-3 border-b border-gray-700">
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">YAML Output</h2>
      <div class="flex gap-1.5">
        <button
          @click="copyToClipboard"
          class="px-2.5 py-1 text-xs rounded transition-colors"
          :class="copied ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
        >
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
        <button
          @click="download"
          class="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
        >
          Download
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-auto p-3">
      <pre class="text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{{ yaml }}</pre>
    </div>
  </div>
</template>
