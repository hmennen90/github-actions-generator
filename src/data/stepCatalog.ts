import type { CatalogStep } from '../types/workflow'

export const stepCatalog: CatalogStep[] = [
  // Checkout & Setup
  {
    id: 'checkout',
    label: 'Checkout',
    category: 'Setup',
    icon: '📥',
    description: 'Check out repository code',
    uses: 'actions/checkout@v4',
    withOptions: {
      'fetch-depth': { label: 'Fetch Depth', placeholder: '0 for full history' },
      ref: { label: 'Ref', placeholder: 'Branch, tag, or SHA' },
    },
  },
  {
    id: 'setup-node',
    label: 'Setup Node.js',
    category: 'Setup',
    icon: '🟢',
    description: 'Install Node.js with optional caching',
    uses: 'actions/setup-node@v4',
    defaultWith: { 'node-version': '20' },
    withOptions: {
      'node-version': { label: 'Node Version', placeholder: '20', required: true },
      cache: { label: 'Cache', placeholder: 'npm, yarn, or pnpm' },
    },
  },
  {
    id: 'setup-python',
    label: 'Setup Python',
    category: 'Setup',
    icon: '🐍',
    description: 'Install Python with optional caching',
    uses: 'actions/setup-python@v5',
    defaultWith: { 'python-version': '3.12' },
    withOptions: {
      'python-version': { label: 'Python Version', placeholder: '3.12', required: true },
      cache: { label: 'Cache', placeholder: 'pip' },
    },
  },
  {
    id: 'setup-java',
    label: 'Setup Java',
    category: 'Setup',
    icon: '☕',
    description: 'Install Java JDK',
    uses: 'actions/setup-java@v4',
    defaultWith: { 'java-version': '21', distribution: 'temurin' },
    withOptions: {
      'java-version': { label: 'Java Version', placeholder: '21', required: true },
      distribution: { label: 'Distribution', placeholder: 'temurin, corretto, zulu' },
      cache: { label: 'Cache', placeholder: 'maven, gradle' },
    },
  },
  {
    id: 'setup-dotnet',
    label: 'Setup .NET',
    category: 'Setup',
    icon: '🔷',
    description: 'Install .NET SDK',
    uses: 'actions/setup-dotnet@v4',
    defaultWith: { 'dotnet-version': '8.0.x' },
    withOptions: {
      'dotnet-version': { label: '.NET Version', placeholder: '8.0.x', required: true },
    },
  },
  {
    id: 'setup-go',
    label: 'Setup Go',
    category: 'Setup',
    icon: '🔵',
    description: 'Install Go toolchain',
    uses: 'actions/setup-go@v5',
    defaultWith: { 'go-version': '1.22' },
    withOptions: {
      'go-version': { label: 'Go Version', placeholder: '1.22', required: true },
      cache: { label: 'Cache', placeholder: 'true / false' },
    },
  },

  // Build
  {
    id: 'npm-install',
    label: 'npm install',
    category: 'Build',
    icon: '📦',
    description: 'Install npm dependencies',
    run: 'npm ci',
  },
  {
    id: 'npm-build',
    label: 'npm build',
    category: 'Build',
    icon: '🔨',
    description: 'Build project with npm',
    run: 'npm run build',
  },
  {
    id: 'yarn-install',
    label: 'yarn install',
    category: 'Build',
    icon: '🧶',
    description: 'Install yarn dependencies',
    run: 'yarn install --frozen-lockfile',
  },
  {
    id: 'dotnet-build',
    label: 'dotnet build',
    category: 'Build',
    icon: '🔷',
    description: 'Build .NET project',
    run: 'dotnet build --configuration Release',
  },
  {
    id: 'gradle-build',
    label: 'Gradle build',
    category: 'Build',
    icon: '🐘',
    description: 'Build with Gradle',
    run: './gradlew build',
  },
  {
    id: 'maven-build',
    label: 'Maven build',
    category: 'Build',
    icon: '🪶',
    description: 'Build with Maven',
    run: 'mvn -B package --file pom.xml',
  },
  {
    id: 'cargo-build',
    label: 'Cargo build',
    category: 'Build',
    icon: '🦀',
    description: 'Build Rust project',
    run: 'cargo build --release',
  },

  // Test
  {
    id: 'npm-test',
    label: 'npm test',
    category: 'Test',
    icon: '🧪',
    description: 'Run tests with npm',
    run: 'npm test',
  },
  {
    id: 'pytest',
    label: 'pytest',
    category: 'Test',
    icon: '🧪',
    description: 'Run Python tests with pytest',
    run: 'pytest',
  },
  {
    id: 'dotnet-test',
    label: 'dotnet test',
    category: 'Test',
    icon: '🧪',
    description: 'Run .NET tests',
    run: 'dotnet test --configuration Release --no-build',
  },
  {
    id: 'go-test',
    label: 'go test',
    category: 'Test',
    icon: '🧪',
    description: 'Run Go tests',
    run: 'go test ./...',
  },
  {
    id: 'cargo-test',
    label: 'cargo test',
    category: 'Test',
    icon: '🧪',
    description: 'Run Rust tests',
    run: 'cargo test',
  },

  // Deploy
  {
    id: 'docker-build-push',
    label: 'Docker Build & Push',
    category: 'Deploy',
    icon: '🐳',
    description: 'Build and push Docker image',
    uses: 'docker/build-push-action@v5',
    defaultWith: { push: 'true', tags: 'user/app:latest' },
    withOptions: {
      push: { label: 'Push', placeholder: 'true' },
      tags: { label: 'Tags', placeholder: 'user/app:latest', required: true },
      context: { label: 'Context', placeholder: '.' },
      file: { label: 'Dockerfile', placeholder: './Dockerfile' },
    },
  },
  {
    id: 'docker-login',
    label: 'Docker Login',
    category: 'Deploy',
    icon: '🔑',
    description: 'Login to Docker registry',
    uses: 'docker/login-action@v3',
    withOptions: {
      registry: { label: 'Registry', placeholder: 'ghcr.io' },
      username: { label: 'Username', placeholder: '${{ github.actor }}' },
      password: { label: 'Password', placeholder: '${{ secrets.GITHUB_TOKEN }}' },
    },
  },
  {
    id: 'gh-pages',
    label: 'Deploy to GitHub Pages',
    category: 'Deploy',
    icon: '🌐',
    description: 'Deploy static site to GitHub Pages',
    uses: 'peaceiris/actions-gh-pages@v4',
    defaultWith: { github_token: '${{ secrets.GITHUB_TOKEN }}', publish_dir: './dist' },
    withOptions: {
      github_token: { label: 'GitHub Token', placeholder: '${{ secrets.GITHUB_TOKEN }}', required: true },
      publish_dir: { label: 'Publish Dir', placeholder: './dist', required: true },
    },
  },

  // Utility
  {
    id: 'cache',
    label: 'Cache',
    category: 'Utility',
    icon: '💾',
    description: 'Cache dependencies and build outputs',
    uses: 'actions/cache@v4',
    withOptions: {
      path: { label: 'Path', placeholder: 'node_modules', required: true },
      key: { label: 'Cache Key', placeholder: '${{ runner.os }}-node-${{ hashFiles(\'**/package-lock.json\') }}', required: true },
      'restore-keys': { label: 'Restore Keys', placeholder: '${{ runner.os }}-node-' },
    },
  },
  {
    id: 'upload-artifact',
    label: 'Upload Artifact',
    category: 'Utility',
    icon: '📤',
    description: 'Upload build artifacts',
    uses: 'actions/upload-artifact@v4',
    withOptions: {
      name: { label: 'Name', placeholder: 'my-artifact', required: true },
      path: { label: 'Path', placeholder: 'dist/', required: true },
    },
  },
  {
    id: 'download-artifact',
    label: 'Download Artifact',
    category: 'Utility',
    icon: '📥',
    description: 'Download build artifacts',
    uses: 'actions/download-artifact@v4',
    withOptions: {
      name: { label: 'Name', placeholder: 'my-artifact', required: true },
    },
  },
  {
    id: 'custom-run',
    label: 'Custom Shell Command',
    category: 'Custom',
    icon: '⌨️',
    description: 'Run a custom shell command',
    run: '',
  },
]

export interface RunnerOption {
  value: string
  label: string
  billing: 'free' | 'paid'
  note?: string
  preInstalled?: { name: string; versions: string[] }[]
}

export const runsOnOptions: RunnerOption[] = [
  // Linux — free for public repos, $0.006/min private
  { value: 'ubuntu-latest', label: 'Ubuntu (latest)', billing: 'free' },
  { value: 'ubuntu-24.04', label: 'Ubuntu 24.04', billing: 'free' },
  { value: 'ubuntu-22.04', label: 'Ubuntu 22.04', billing: 'free' },

  // Windows — free for public repos, $0.010/min private (~2x Linux)
  { value: 'windows-latest', label: 'Windows (latest)', billing: 'free', note: '2x Linux cost on private repos' },
  { value: 'windows-2022', label: 'Windows 2022', billing: 'free', note: '2x Linux cost on private repos' },

  // macOS — free for public repos, $0.062/min private (~10x Linux)
  { value: 'macos-latest', label: 'macOS (latest)', billing: 'free', note: '10x Linux cost on private repos' },
  { value: 'macos-15', label: 'macOS 15 (ARM)', billing: 'free', note: '10x Linux cost on private repos' },
  { value: 'macos-14', label: 'macOS 14 (ARM)', billing: 'free', note: '10x Linux cost on private repos' },
  { value: 'macos-13', label: 'macOS 13 (Intel)', billing: 'free', note: '10x Linux cost on private repos' },

  // Larger runners — always paid, even on public repos
  { value: 'ubuntu-latest-4-cores', label: 'Ubuntu 4-core', billing: 'paid', note: '$0.012/min — requires Team/Enterprise' },
  { value: 'ubuntu-latest-8-cores', label: 'Ubuntu 8-core', billing: 'paid', note: '$0.022/min — requires Team/Enterprise' },
  { value: 'ubuntu-latest-16-cores', label: 'Ubuntu 16-core', billing: 'paid', note: '$0.042/min — requires Team/Enterprise' },
  { value: 'windows-latest-8-cores', label: 'Windows 8-core', billing: 'paid', note: '$0.042/min — requires Team/Enterprise' },
  { value: 'macos-latest-xlarge', label: 'macOS 12-core (Apple Silicon)', billing: 'paid', note: '$0.077/min — requires Team/Enterprise' },

  // Self-hosted
  { value: 'self-hosted', label: 'Self-hosted', billing: 'free', note: 'Your own infrastructure' },
]

export interface TriggerOption {
  value: string
  label: string
  activityTypes?: string[]
}

export const triggerOptions: TriggerOption[] = [
  { value: 'push', label: 'Push' },
  {
    value: 'pull_request',
    label: 'Pull Request',
    activityTypes: [
      'opened', 'synchronize', 'reopened', 'closed',
      'edited', 'ready_for_review', 'converted_to_draft',
      'labeled', 'unlabeled', 'assigned', 'unassigned',
      'review_requested', 'review_request_removed',
    ],
  },
  { value: 'workflow_dispatch', label: 'Manual (workflow_dispatch)' },
  { value: 'schedule', label: 'Schedule (cron)' },
  {
    value: 'release',
    label: 'Release',
    activityTypes: [
      'published', 'unpublished', 'created', 'edited',
      'deleted', 'prereleased', 'released',
    ],
  },
  {
    value: 'issue_comment',
    label: 'Issue Comment',
    activityTypes: ['created', 'edited', 'deleted'],
  },
]

export interface ContainerImage {
  value: string
  label: string
  preInstalled?: (string | { name: string; versions?: string[] })[]
  lastUpdated?: string | null
  size?: number | null
}

export interface ContainerType {
  id: string
  label: string
  icon: string
  images: ContainerImage[]
}

export const containerTypes: ContainerType[] = [
  {
    id: 'none',
    label: 'No Container',
    icon: '',
    images: [],
  },
  {
    id: 'ubuntu',
    label: 'Ubuntu',
    icon: '🐧',
    images: [
      {
        value: 'ubuntu:24.04',
        label: 'Ubuntu 24.04 (Noble)',
        preInstalled: ['Python 3.12', 'Perl 5.38', 'GCC 13', 'Git 2.43', 'curl', 'wget'],
      },
      {
        value: 'ubuntu:22.04',
        label: 'Ubuntu 22.04 (Jammy)',
        preInstalled: ['Python 3.10', 'Perl 5.34', 'GCC 11', 'Git 2.34', 'curl', 'wget'],
      },
      {
        value: 'ubuntu:20.04',
        label: 'Ubuntu 20.04 (Focal)',
        preInstalled: ['Python 3.8', 'Perl 5.30', 'GCC 9', 'Git 2.25', 'curl', 'wget'],
      },
    ],
  },
  {
    id: 'alpine',
    label: 'Alpine',
    icon: '🏔️',
    images: [
      {
        value: 'alpine:3.20',
        label: 'Alpine 3.20',
        preInstalled: ['busybox', 'musl libc', 'apk package manager'],
      },
      {
        value: 'alpine:3.19',
        label: 'Alpine 3.19',
        preInstalled: ['busybox', 'musl libc', 'apk package manager'],
      },
      {
        value: 'alpine:3.18',
        label: 'Alpine 3.18',
        preInstalled: ['busybox', 'musl libc', 'apk package manager'],
      },
    ],
  },
  {
    id: 'debian',
    label: 'Debian',
    icon: '🌀',
    images: [
      {
        value: 'debian:bookworm',
        label: 'Debian 12 (Bookworm)',
        preInstalled: ['Python 3.11', 'Perl 5.36', 'GCC 12', 'Git 2.39', 'curl', 'apt'],
      },
      {
        value: 'debian:bullseye',
        label: 'Debian 11 (Bullseye)',
        preInstalled: ['Python 3.9', 'Perl 5.32', 'GCC 10', 'Git 2.30', 'curl', 'apt'],
      },
    ],
  },
  {
    id: 'node',
    label: 'Node.js',
    icon: '🟢',
    images: [
      {
        value: 'node:22',
        label: 'Node.js 22 (LTS)',
        preInstalled: ['Node.js 22', 'npm 10', 'yarn 1.22', 'Python 3.11', 'Git'],
      },
      {
        value: 'node:20',
        label: 'Node.js 20 (LTS)',
        preInstalled: ['Node.js 20', 'npm 10', 'yarn 1.22', 'Python 3.11', 'Git'],
      },
      {
        value: 'node:18',
        label: 'Node.js 18',
        preInstalled: ['Node.js 18', 'npm 9', 'yarn 1.22', 'Python 3.11', 'Git'],
      },
      {
        value: 'node:22-alpine',
        label: 'Node.js 22 (Alpine)',
        preInstalled: ['Node.js 22', 'npm 10', 'yarn 1.22'],
      },
      {
        value: 'node:20-alpine',
        label: 'Node.js 20 (Alpine)',
        preInstalled: ['Node.js 20', 'npm 10', 'yarn 1.22'],
      },
    ],
  },
  {
    id: 'python',
    label: 'Python',
    icon: '🐍',
    images: [
      {
        value: 'python:3.13',
        label: 'Python 3.13',
        preInstalled: ['Python 3.13', 'pip', 'setuptools', 'Git', 'GCC'],
      },
      {
        value: 'python:3.12',
        label: 'Python 3.12',
        preInstalled: ['Python 3.12', 'pip', 'setuptools', 'Git', 'GCC'],
      },
      {
        value: 'python:3.11',
        label: 'Python 3.11',
        preInstalled: ['Python 3.11', 'pip', 'setuptools', 'Git', 'GCC'],
      },
      {
        value: 'python:3.12-alpine',
        label: 'Python 3.12 (Alpine)',
        preInstalled: ['Python 3.12', 'pip', 'setuptools'],
      },
    ],
  },
  {
    id: 'php',
    label: 'PHP',
    icon: '🐘',
    images: [
      {
        value: 'php:8.3',
        label: 'PHP 8.3',
        preInstalled: ['PHP 8.3', 'Composer (via install)', 'Git', 'GCC'],
      },
      {
        value: 'php:8.2',
        label: 'PHP 8.2',
        preInstalled: ['PHP 8.2', 'Composer (via install)', 'Git', 'GCC'],
      },
      {
        value: 'php:8.1',
        label: 'PHP 8.1',
        preInstalled: ['PHP 8.1', 'Composer (via install)', 'Git', 'GCC'],
      },
      {
        value: 'php:8.3-alpine',
        label: 'PHP 8.3 (Alpine)',
        preInstalled: ['PHP 8.3'],
      },
    ],
  },
  {
    id: 'golang',
    label: 'Go',
    icon: '🔵',
    images: [
      {
        value: 'golang:1.22',
        label: 'Go 1.22',
        preInstalled: ['Go 1.22', 'Git', 'GCC', 'ca-certificates'],
      },
      {
        value: 'golang:1.21',
        label: 'Go 1.21',
        preInstalled: ['Go 1.21', 'Git', 'GCC', 'ca-certificates'],
      },
      {
        value: 'golang:1.22-alpine',
        label: 'Go 1.22 (Alpine)',
        preInstalled: ['Go 1.22', 'Git', 'ca-certificates'],
      },
    ],
  },
  {
    id: 'rust',
    label: 'Rust',
    icon: '🦀',
    images: [
      {
        value: 'rust:1.77',
        label: 'Rust 1.77',
        preInstalled: ['Rust 1.77', 'Cargo', 'rustfmt', 'clippy', 'GCC', 'Git'],
      },
      {
        value: 'rust:1.76',
        label: 'Rust 1.76',
        preInstalled: ['Rust 1.76', 'Cargo', 'rustfmt', 'clippy', 'GCC', 'Git'],
      },
      {
        value: 'rust:1.77-alpine',
        label: 'Rust 1.77 (Alpine)',
        preInstalled: ['Rust 1.77', 'Cargo', 'rustfmt', 'clippy'],
      },
    ],
  },
  {
    id: 'dotnet',
    label: '.NET',
    icon: '🔷',
    images: [
      {
        value: 'mcr.microsoft.com/dotnet/sdk:8.0',
        label: '.NET 8.0 SDK',
        preInstalled: ['.NET SDK 8.0', 'dotnet CLI', 'NuGet', 'PowerShell', 'Git'],
      },
      {
        value: 'mcr.microsoft.com/dotnet/sdk:7.0',
        label: '.NET 7.0 SDK',
        preInstalled: ['.NET SDK 7.0', 'dotnet CLI', 'NuGet', 'PowerShell', 'Git'],
      },
      {
        value: 'mcr.microsoft.com/dotnet/sdk:6.0',
        label: '.NET 6.0 SDK',
        preInstalled: ['.NET SDK 6.0', 'dotnet CLI', 'NuGet', 'Git'],
      },
    ],
  },
  {
    id: 'java',
    label: 'Java',
    icon: '☕',
    images: [
      {
        value: 'eclipse-temurin:21',
        label: 'Java 21 (Temurin)',
        preInstalled: ['Java 21 JDK', 'jlink', 'jshell'],
      },
      {
        value: 'eclipse-temurin:17',
        label: 'Java 17 (Temurin)',
        preInstalled: ['Java 17 JDK', 'jlink', 'jshell'],
      },
      {
        value: 'maven:3.9-eclipse-temurin-21',
        label: 'Maven 3.9 + Java 21',
        preInstalled: ['Java 21 JDK', 'Maven 3.9', 'Git'],
      },
      {
        value: 'gradle:8-jdk21',
        label: 'Gradle 8 + Java 21',
        preInstalled: ['Java 21 JDK', 'Gradle 8', 'Git'],
      },
    ],
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: '⚙️',
    images: [],
  },
]
