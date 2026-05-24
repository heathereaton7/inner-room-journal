/**
 * Fertility / TTC (trying-to-conceive) helpers.
 *
 * Storage shape (state key "fertility" / "irj-fertility"):
 *   {
 *     periodStarts: string[]      // ISO local YYYY-MM-DD of cycle day 1
 *     cycleLength: number         // user-set or computed average (default 28)
 *     periodLength: number        // typical period length in days (default 5)
 *     notes: {                    // optional per-day symptom log
 *       [YYYY-MM-DD]: {
 *         mood?: string,
 *         symptoms?: string[],
 *         mucus?: 'dry'|'sticky'|'creamy'|'watery'|'eggwhite',
 *         bbt?: number,           // basal body temperature
 *         intimacy?: boolean,
 *         test?: 'positive'|'negative'|null,  // pregnancy test result
 *         notes?: string,
 *       }
 *     }
 *   }
 *
 * Cycle math (Standard Days Method):
 *   - cycle day 1            = first day of period
 *   - ovulation day          = cycleLength - 14  (~day 14 in a 28-day cycle)
 *   - fertile window         = ovulation - 5 ... ovulation + 1
 *   - peak fertility (best)  = ovulation - 2 ... ovulation
 *   - next period            = lastStart + cycleLength
 */

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
export const MIN_CYCLE = 21;
export const MAX_CYCLE = 45;

/** Format Date → "YYYY-MM-DD" (local time). */
export function toISO(d) {
  if (typeof d === 'string') return d;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" → Date at local midnight. */
export function fromISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Days between two ISO dates (b - a). */
export function daysBetween(aISO, bISO) {
  const a = fromISO(aISO).getTime();
  const b = fromISO(bISO).getTime();
  return Math.round((b - a) / 86400000);
}

/** Add N days to an ISO date, return ISO. */
export function addDays(iso, n) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Today as ISO local. */
export function todayISO() {
  return toISO(new Date());
}

/** Compute the user's average cycle length from history (capped to [MIN,MAX]). */
export function averageCycleLength(periodStarts, fallback = DEFAULT_CYCLE_LENGTH) {
  if (!periodStarts || periodStarts.length < 2) return fallback;
  const sorted = [...periodStarts].sort();
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const g = daysBetween(sorted[i - 1], sorted[i]);
    if (g >= MIN_CYCLE && g <= MAX_CYCLE) gaps.push(g);
  }
  if (gaps.length === 0) return fallback;
  const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  return Math.max(MIN_CYCLE, Math.min(MAX_CYCLE, avg));
}

/**
 * Compute the active cycle around `dateISO` (defaults to today).
 *
 * Returns null if the user hasn't logged any periods yet, or if `dateISO`
 * is before the earliest logged period start.
 */
export function cycleAt(fertility, dateISO) {
  const date = dateISO || todayISO();
  const starts = (fertility?.periodStarts || []).slice().sort();
  if (starts.length === 0) return null;

  // Find the latest period start that is on or before `date`
  let lastStart = null;
  for (const s of starts) {
    if (s <= date) lastStart = s; else break;
  }
  if (!lastStart) return null;

  const cycleLength = fertility?.cycleLength
    || averageCycleLength(starts)
    || DEFAULT_CYCLE_LENGTH;
  const periodLength = fertility?.periodLength || DEFAULT_PERIOD_LENGTH;

  const cycleDay = daysBetween(lastStart, date) + 1;
  const ovulationDay = Math.max(8, cycleLength - 14);
  const fertileStart = ovulationDay - 5;
  const fertileEnd = ovulationDay + 1;
  const peakStart = ovulationDay - 2;
  const peakEnd = ovulationDay;
  const nextPeriodStart = addDays(lastStart, cycleLength);
  const ovulationDate = addDays(lastStart, ovulationDay - 1);
  const fertileWindowStart = addDays(lastStart, fertileStart - 1);
  const fertileWindowEnd = addDays(lastStart, fertileEnd - 1);

  // Fertility status
  let status = 'low';
  let statusLabel = 'Low chance';
  if (cycleDay <= periodLength) {
    status = 'period';
    statusLabel = 'Period';
  } else if (cycleDay >= peakStart && cycleDay <= peakEnd) {
    status = 'peak';
    statusLabel = 'Peak fertility';
  } else if (cycleDay >= fertileStart && cycleDay <= fertileEnd) {
    status = 'fertile';
    statusLabel = 'Fertile window';
  } else if (cycleDay > fertileEnd && cycleDay < cycleLength - 2) {
    status = 'luteal';
    statusLabel = 'Luteal phase';
  } else if (cycleDay >= cycleLength - 2) {
    status = 'pre-period';
    statusLabel = 'Period due soon';
  }

  return {
    lastStart,
    cycleDay,
    cycleLength,
    periodLength,
    ovulationDay,
    ovulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    peakStart, peakEnd,
    nextPeriodStart,
    status,
    statusLabel,
    daysUntilNextPeriod: Math.max(0, daysBetween(date, nextPeriodStart)),
    daysUntilOvulation: daysBetween(date, ovulationDate),
  };
}

/**
 * Classify a single date for calendar rendering.
 * Returns 'period' | 'fertile' | 'peak' | 'ovulation' | 'predicted-period' | null
 */
export function classifyDate(fertility, dateISO) {
  const cyc = cycleAt(fertility, dateISO);
  if (!cyc) return null;
  if (dateISO === cyc.ovulationDate) return 'ovulation';
  if (cyc.cycleDay <= cyc.periodLength) return 'period';
  if (cyc.cycleDay >= cyc.peakStart && cyc.cycleDay <= cyc.peakEnd) return 'peak';
  if (dateISO >= cyc.fertileWindowStart && dateISO <= cyc.fertileWindowEnd) return 'fertile';
  // Predicted period for future dates beyond the last known cycle:
  const starts = (fertility?.periodStarts || []).slice().sort();
  const last = starts[starts.length - 1];
  const cycleLength = fertility?.cycleLength || averageCycleLength(starts) || DEFAULT_CYCLE_LENGTH;
  const periodLength = fertility?.periodLength || DEFAULT_PERIOD_LENGTH;
  if (last && dateISO > last) {
    // Find next predicted period start at lastStart + k * cycleLength
    let predicted = addDays(last, cycleLength);
    while (predicted < dateISO) predicted = addDays(predicted, cycleLength);
    const offset = daysBetween(predicted, dateISO);
    if (offset >= 0 && offset < periodLength) return 'predicted-period';
  }
  return null;
}

/** Add a period start, normalizing & deduping (returns next fertility state). */
export function addPeriodStart(fertility, dateISO) {
  const cur = new Set(fertility?.periodStarts || []);
  cur.add(dateISO);
  return {
    ...(fertility || {}),
    periodStarts: Array.from(cur).sort(),
  };
}

/** Remove a period start. */
export function removePeriodStart(fertility, dateISO) {
  const cur = new Set(fertility?.periodStarts || []);
  cur.delete(dateISO);
  return {
    ...(fertility || {}),
    periodStarts: Array.from(cur).sort(),
  };
}

/** Toggle a period start (add if missing, remove if present). */
export function togglePeriodStart(fertility, dateISO) {
  const has = (fertility?.periodStarts || []).includes(dateISO);
  return has ? removePeriodStart(fertility, dateISO) : addPeriodStart(fertility, dateISO);
}

/** Update / merge note for a date. Empty note removes the entry. */
export function updateNote(fertility, dateISO, patch) {
  const notes = { ...(fertility?.notes || {}) };
  const cur = notes[dateISO] || {};
  const next = { ...cur, ...patch };
  // Strip empty values so we don't store junk
  const cleaned = {};
  for (const k in next) {
    const v = next[k];
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    cleaned[k] = v;
  }
  if (Object.keys(cleaned).length === 0) {
    delete notes[dateISO];
  } else {
    notes[dateISO] = cleaned;
  }
  return { ...(fertility || {}), notes };
}

/** Build a month calendar grid (6 rows × 7 cols) for the given year+month (0-indexed). */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const firstDow = first.getDay(); // 0=Sun
  const start = new Date(year, month, 1 - firstDow);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      iso: toISO(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}
