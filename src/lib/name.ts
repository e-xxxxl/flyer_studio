/**
 * Turns "Pastor" + "Daniel Bentley" into stacked lines:
 * ["PASTOR", "DANIEL", "BENTLEY"].
 * Names with more than 3 words are balanced into 3 lines so the block stays compact.
 */
export function splitNameLines(title: string, fullName: string, maxNameLines = 3): string[] {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  let lines = words
  if (words.length > maxNameLines) {
    lines = []
    const total = words.join(' ').length
    const target = total / maxNameLines
    let cur: string[] = []
    for (let i = 0; i < words.length; i++) {
      cur.push(words[i])
      const remainingWords = words.length - i - 1
      const remainingLines = maxNameLines - lines.length - 1
      const curLen = cur.join(' ').length
      if (remainingLines > 0 && (curLen >= target || remainingWords <= remainingLines)) {
        lines.push(cur.join(' '))
        cur = []
      }
    }
    if (cur.length) lines.push(cur.join(' '))
  }
  const t = title.trim()
  return [...(t ? [t] : []), ...lines].map((l) => l.toUpperCase())
}

/** Splits the headline into at most two lines, balancing by length. */
export function splitHeadline(text: string): string[] {
  const words = text.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean)
  if (words.length <= 1) return words.map((w) => w.toUpperCase())
  if (words.length === 2) return words.map((w) => w.toUpperCase())
  let best = 1
  let bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ').length
    const b = words.slice(i).join(' ').length
    if (Math.abs(a - b) < bestDiff) {
      bestDiff = Math.abs(a - b)
      best = i
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')].map((l) => l.toUpperCase())
}
