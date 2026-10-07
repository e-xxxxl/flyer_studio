/**
 * Layout tables. Every value is relative to the canvas:
 *  - x positions and widths / font sizes are fractions of the canvas WIDTH
 *  - y positions and heights are fractions of the canvas HEIGHT
 * The canvas is always 1080 px wide internally; the height follows the aspect.
 */
export type Aspect = '4:5' | '1:1' | '9:16'

export const CANVAS_WIDTH = 1080

export interface Layout {
  width: number
  height: number
  headline: {
    top: number // y of the first line's top
    maxWidth: number // widest line, as fraction of W
    maxSize: number // font size cap, fraction of W
    maxBlock: number // tallest the whole headline may be, fraction of H (keeps tall fonts clear of the photo)
    gap: number // space between lines as a fraction of the cap height
    scaleY: number // vertical stretch for a taller, more condensed look
  }
  panel: {
    left: number
    right: number
    top: number // top edge of the tall (left) block
    stepX: number // x where the panel steps down
    stepTop: number // top edge of the short (right) block
  }
  photo: {
    centerX: number
    widthFrac: number // width of the cut-out at scale 1
    overlap: number // how far the head rises into the headline, fraction of H
    fadeStart: number // y where the torso starts fading out
    fadeEnd: number
  }
  name: { left: number; top: number; width: number; height: number; maxSize: number }
  date: { left: number; top: number; width: number; height: number; maxSize: number }
  logo: { bottom: number; markWidth: number; nameSize: number }
  glowY: number
}

const W = CANVAS_WIDTH

export const layouts: Record<Aspect, Layout> = {
  '4:5': {
    width: W,
    height: 1350,
    headline: { top: 0.077, maxWidth: 0.82, maxSize: 0.6, maxBlock: 0.27, gap: 0.07, scaleY: 1.25 },
    panel: { left: 0.09, right: 0.91, top: 0.381, stepX: 0.62, stepTop: 0.489 },
    photo: { centerX: 0.5, widthFrac: 0.8, overlap: 0.047, fadeStart: 0.8, fadeEnd: 0.96 },
    name: { left: 0.13, top: 0.505, width: 0.27, height: 0.125, maxSize: 0.068 },
    date: { left: 0.75, top: 0.53, width: 0.155, height: 0.095, maxSize: 0.03 },
    logo: { bottom: 0.062, markWidth: 0.1, nameSize: 0.022 },
    glowY: 0.62,
  },
  '1:1': {
    width: W,
    height: 1080,
    headline: { top: 0.045, maxWidth: 0.74, maxSize: 0.6, maxBlock: 0.32, gap: 0.07, scaleY: 1.2 },
    panel: { left: 0.09, right: 0.91, top: 0.37, stepX: 0.62, stepTop: 0.5 },
    photo: { centerX: 0.5, widthFrac: 0.66, overlap: 0.05, fadeStart: 0.78, fadeEnd: 0.96 },
    name: { left: 0.12, top: 0.5, width: 0.27, height: 0.17, maxSize: 0.066 },
    date: { left: 0.75, top: 0.53, width: 0.155, height: 0.12, maxSize: 0.03 },
    logo: { bottom: 0.05, markWidth: 0.09, nameSize: 0.02 },
    glowY: 0.62,
  },
  '9:16': {
    width: W,
    height: 1920,
    headline: { top: 0.115, maxWidth: 0.82, maxSize: 0.6, maxBlock: 0.19, gap: 0.07, scaleY: 1.25 },
    panel: { left: 0.09, right: 0.91, top: 0.4, stepX: 0.62, stepTop: 0.5 },
    photo: { centerX: 0.5, widthFrac: 0.84, overlap: 0.032, fadeStart: 0.8, fadeEnd: 0.94 },
    name: { left: 0.13, top: 0.52, width: 0.27, height: 0.09, maxSize: 0.068 },
    date: { left: 0.75, top: 0.535, width: 0.155, height: 0.07, maxSize: 0.03 },
    logo: { bottom: 0.14, markWidth: 0.1, nameSize: 0.022 },
    glowY: 0.6,
  },
}

export const aspectLabels: Record<Aspect, string> = {
  '4:5': 'Post 4:5',
  '1:1': 'Square 1:1',
  '9:16': 'Story 9:16',
}
