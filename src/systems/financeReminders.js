/**
 * Gentle, in-app bill reminders — pure client-side, no permissions, works offline.
 *
 * Reads the existing Trackers state (irj-trackers) and, for each unpaid monthly
 * bill that has a numeric dueDay, works out how many days until (or past) its due
 * date this month. Returns two soft buckets the Finance hub can surface kindly:
 *
 *   { overdue:  [ { ...bill, dueDate, daysAway } ],   // due date already passed, still unpaid
 *     dueSoon:  [ { ...bill, dueDate, daysAway } ] }   // due within the next few days
 *
 * daysAway: 0 = due today, positive = days remaining, negative = days overdue.
 */
const DUE_SOON_WINDOW = 5; // days ahead to flag as "coming up"

// Last calendar day of the month that `date` falls in.
function lastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function computeBillReminders(trackers, today = new Date()) {
  const empty = { overdue: [], dueSoon: [] };
  if (!trackers || !Array.isArray(trackers.bills)) return empty;

  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // strip time
  const monthLast = lastDayOfMonth(t);
  const overdue = [];
  const dueSoon = [];

  for (const bill of trackers.bills) {
    if (!bill || bill.paid || bill.autoPay) continue; // paid or hands-off bills don't nag
    const day = Number(bill.dueDay);
    if (!Number.isFinite(day) || day < 1 || day > 31) continue; // non-monthly (e.g. weekly groceries)

    const clampedDay = Math.min(day, monthLast); // handle "31" in short months
    const dueDate = new Date(t.getFullYear(), t.getMonth(), clampedDay);
    const daysAway = Math.round((dueDate - t) / 86400000);

    const entry = { ...bill, dueDate: dueDate.toISOString().slice(0, 10), daysAway };

    if (daysAway < 0) overdue.push(entry);
    else if (daysAway <= DUE_SOON_WINDOW) dueSoon.push(entry);
  }

  overdue.sort((a, b) => a.daysAway - b.daysAway);
  dueSoon.sort((a, b) => a.daysAway - b.daysAway);
  return { overdue, dueSoon };
}

// Total count of reminders — handy for a small badge/dot on the menu entry.
export function reminderCount(reminders) {
  if (!reminders) return 0;
  return (reminders.overdue?.length || 0) + (reminders.dueSoon?.length || 0);
}
