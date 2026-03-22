/** Server-side input checks mirroring client GUARDRAIL_PATTERNS */
const PATTERNS = [
  'more money',
  'get more',
  'maximize inheritance',
  'hide assets',
  'cheat',
  'how much can i get',
  'take more',
  'claim more than',
  'get more from the will',
  'more from the will',
  'contest the will',
];

export function shouldBlockUserMessage(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return PATTERNS.some((p) => lower.includes(p));
}
