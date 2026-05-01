import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: root,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const c8 = resolve(root, 'node_modules', 'c8', 'bin', 'c8.js')
const tests = resolve(root, 'test', 'run-node-tests.mjs')

run(process.execPath, [
  c8,
  '--clean',
  '--100',
  '--per-file',
  '--reporter=lcov',
  '--reporter=text',
  '--reports-dir=coverage',
  process.execPath,
  tests,
])
