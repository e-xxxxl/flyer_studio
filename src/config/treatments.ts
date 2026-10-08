/**
 * Photo treatments: how the celebrant's portrait blends into the flyer.
 * Every template (theme) points at one treatment; the operator can override it in the Photo tab.
 *
 * All fractions are relative to the portrait's own box (width for left/right, height for top/bottom),
 * so the blend scales with the photo. Fades use a cosine ease so no edge line is ever visible.
 */
export interface PhotoTreatment {
  id: string
  label: string
  note: string
  /** Edge feathering of the portrait box. top is normally 0 so the head stays crisp. */
  feather: { top: number; right: number; bottom: number; left: number }
  /** Angle of the bottom fade in degrees (180 = straight down). Used for the geometric treatment. */
  bottomAngle: number
  /** Extra feathering (all sides + soft oval) when the photo has no transparency, e.g. background removal was skipped. */
  rect: { feather: number; oval: number }
  /** Where the torso starts / finishes dissolving into the flyer, as a fraction of canvas height. null = layout default. */
  canvasFade: { start: number; end: number } | null
  /** Soft contact shadow behind the portrait. */
  shadow: { y: number; blur: number; opacity: number } | null
  /** How strongly the warm bottom haze reaches up over the chest (1 = default). */
  haze: number
}

export const treatments: PhotoTreatment[] = [
  {
    id: 'editorial',
    label: 'Editorial',
    note: 'Soft bottom fade, gentle side blending and a warm haze over the chest.',
    feather: { top: 0, right: 0.035, bottom: 0.22, left: 0.035 },
    bottomAngle: 180,
    rect: { feather: 0.16, oval: 0.12 },
    canvasFade: null,
    shadow: null,
    haze: 1,
  },
  {
    id: 'royal',
    label: 'Royal',
    note: 'Cleaner portrait edge with a subtle shadow and a controlled fade.',
    feather: { top: 0, right: 0.02, bottom: 0.14, left: 0.02 },
    bottomAngle: 180,
    rect: { feather: 0.14, oval: 0.1 },
    canvasFade: { start: 0.84, end: 0.98 },
    shadow: { y: 18, blur: 30, opacity: 0.5 },
    haze: 0.7,
  },
  {
    id: 'elegant',
    label: 'Elegant',
    note: 'Feathered edges all round, minimal and quiet.',
    feather: { top: 0.02, right: 0.1, bottom: 0.24, left: 0.1 },
    bottomAngle: 180,
    rect: { feather: 0.2, oval: 0.18 },
    canvasFade: { start: 0.82, end: 0.97 },
    shadow: null,
    haze: 0.85,
  },
  {
    id: 'modern',
    label: 'Modern',
    note: 'A crisp angled cut at the base instead of a soft fade.',
    feather: { top: 0, right: 0, bottom: 0.1, left: 0 },
    bottomAngle: 166,
    rect: { feather: 0.1, oval: 0.06 },
    canvasFade: { start: 0.88, end: 0.97 },
    shadow: null,
    haze: 0.35,
  },
]

export const DEFAULT_TREATMENT = 'editorial'

export const pickTreatment = (id: string | undefined) => treatments.find((t) => t.id === id) ?? treatments[0]
