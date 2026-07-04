// Generates a practically-unique ID: timestamp (base36) + random suffix.
// Replaces the old `Math.floor(100000 + Math.random() * 900000)` pattern,
// which only had ~900,000 possible values and could realistically collide
// on a table where `id` is the primary key (causing a confusing insert error).
export function generateUniqueId(prefix: string): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${time}-${rand}`;
}
