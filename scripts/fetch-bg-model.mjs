// Downloads the background-removal model and WASM runtime into public/bgdata/ so the app serves
// them from its own origin (faster, works offline, no dependency on a third-party CDN at runtime).
// Runs automatically before `npm run dev` and `npm run build`. Skips files that already exist.
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(await readFile(path.join(root, 'node_modules/@imgly/background-removal/package.json'), 'utf8'))
const BASE = `https://staticimgly.com/@imgly/background-removal-data/${version}/dist/`
const OUT = path.join(root, 'public', 'bgdata')
// The fp16 model is the quality/size sweet spot; the non-jsep runtime is what the CPU (wasm) path uses.
const KEYS = ['/models/isnet_fp16', '/onnxruntime-web/ort-wasm-simd-threaded.wasm', '/onnxruntime-web/ort-wasm-simd-threaded.mjs']

async function get(url, tries = 6) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (e) {
      if (i === tries) throw new Error(`${url}: ${e.message}`)
      await new Promise((r) => setTimeout(r, 1500 * i))
    }
  }
}

const exists = (p) => stat(p).then(() => true, () => false)

await mkdir(OUT, { recursive: true })
const marker = path.join(OUT, 'resources.json')
const stamp = path.join(OUT, `.complete-${version}`)
if (await exists(stamp)) process.exit(0)

console.log(`Fetching background-removal data ${version} (about 100 MB, one time)...`)
const all = JSON.parse((await get(BASE + 'resources.json')).toString())
const wanted = Object.fromEntries(KEYS.map((k) => [k, all[k]]))
if (KEYS.some((k) => !wanted[k])) throw new Error('Unexpected resources.json layout')

const names = [...new Set(Object.values(wanted).flatMap((e) => e.chunks.map((c) => c.name)))]
let done = 0
const queue = [...names]
async function worker() {
  while (queue.length) {
    const name = queue.shift()
    const file = path.join(OUT, name)
    if (!(await exists(file))) await writeFile(file, await get(BASE + name))
    done++
    if (done % 5 === 0 || done === names.length) console.log(`  ${done}/${names.length}`)
  }
}
await Promise.all([worker(), worker(), worker()])
await writeFile(marker, JSON.stringify(wanted))
await writeFile(stamp, '')
console.log('Background-removal data ready.')
