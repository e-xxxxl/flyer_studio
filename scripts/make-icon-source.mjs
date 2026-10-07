// Builds public/brand/icon-source.png: the church logo centred on a solid brand-colour square.
// Run through `npm run icons` (which then runs the PWA assets generator).
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BG = '#1f0606'
const SIZE = 1024

const logo = await sharp(path.join(root, 'public/brand/logo.png')).trim().toBuffer()
const resized = await sharp(logo).resize({ width: Math.round(SIZE * 0.62) }).toBuffer()

await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: BG } })
  .composite([{ input: resized, gravity: 'center' }])
  .png()
  .toFile(path.join(root, 'public/brand/icon-source.png'))

console.log('wrote public/brand/icon-source.png')
