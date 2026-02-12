import { parseISO, differenceInDays, addDays, format, isBefore, isAfter, isEqual, startOfDay } from 'date-fns';
import { Trip, DayStatus, ComplianceResult } from '../types';
import { MAX_STAY_DAYS, WINDOW_DAYS } from '../constants/countries';

/**
 * Parse a YYYY-MM-DD string into a UTC Date at midnight.
 * All calculations use UTC to avoid timezone issues.
 */
function toUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addUTCDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Check if a given UTC date falls within a trip (inclusive of entry and exit dates).
 */
function isDateInTrip(date: Date, trip: Trip): boolean {
  const entry = toUTCDate(trip.entryDate);
  const exit = toUTCDate(trip.exitDate);
  return date.getTime() >= entry.getTime() && date.getTime() <= exit.getTime();
}

/**
 * Check if a given UTC date falls within any of the provided trips.
 */
function isDateInSchengen(date: Date, trips: Trip[]): boolean {
  return trips.some((trip) => isDateInTrip(date, trip));
}

/**
 * Calculate the number of days the user was present in the Schengen Area
 * within the 180-day window ending on `date` (i.e., from date-179 to date inclusive).
 */
export function getDaysUsed(trips: Trip[], date: Date): number {
  const windowStart = addUTCDays(date, -(WINDOW_DAYS - 1)); // 180-day window: date-179 to date inclusive
  let count = 0;

  for (let i = 0; i < WINDOW_DAYS; i++) {
    const checkDate = addUTCDays(windowStart, i);
    if (isDateInSchengen(checkDate, trips)) {
      count++;
    }
  }

  return count;
}

/**
 * Calculate remaining days of allowance on a given date.
 */
export function getDaysRemaining(trips: Trip[], date: Date): number {
  return MAX_STAY_DAYS - getDaysUsed(trips, date);
}

/**
 * Check if a proposed new trip would be compliant for every day of the trip.
 * Returns compliance status, the maximum number of days the user could stay,
 * and how many days of overstay would occur.
 */
export function isTripCompliant(
  existingTrips: Trip[],
  newTrip: Trip
): ComplianceResult {
  const allTrips = [...existingTrips, newTrip];
  const entry = toUTCDate(newTrip.entryDate);
  const exit = toUTCDate(newTrip.exitDate);
  const tripDays = differenceInDays(exit, entry) + 1;

  let compliant = true;
  let maxCompliantDays = 0;
  let maxOverstay = 0;

  for (let i = 0; i < tripDays; i++) {
    const checkDate = addUTCDays(entry, i);
    const used = getDaysUsed(allTrips, checkDate);
    const remaining = MAX_STAY_DAYS - used;

    if (remaining >= 0) {
      maxCompliantDays = i + 1;
    } else {
      compliant = false;
      maxOverstay = Math.max(maxOverstay, -remaining);
    }
  }

  return {
    compliant,
    maxDays: maxCompliantDays,
    overstayDays: maxOverstay,
  };
}

/**
 * Find the maximum number of consecutive days you could stay in the Schengen Area
 * starting from `startDate`, given existing trips.
 */
export function getMaxStayFrom(trips: Trip[], startDate: Date): number {
  let maxDays = 0;

  for (let i = 0; i < MAX_STAY_DAYS; i++) {
    const checkDate = addUTCDays(startDate, i);
    // Create a temporary trip from startDate to checkDate
    const tempTrip: Trip = {
      id: 'temp',
      country: 'France', // doesn't matter for calculation
      entryDate: formatDate(startDate),
      exitDate: formatDate(checkDate),
      isPlanned: false,
      createdAt: '',
      updatedAt: '',
    };

    const allTrips = [...trips, tempTrip];
    const used = getDaysUsed(allTrips, checkDate);

    if (used <= MAX_STAY_DAYS) {
      maxDays = i + 1;
    } else {
      break;
    }
  }

  return maxDays;
}

/**
 * Find the earliest date on or after `searchFrom` where `requiredDays`
 * consecutive days of stay are available.
 * Searches up to 365 days into the future.
 */
export function getEarliestAvailableDate(
  trips: Trip[],
  requiredDays: number,
  searchFrom: Date
): Date | null {
  const maxSearch = 365;

  for (let offset = 0; offset < maxSearch; offset++) {
    const candidateStart = addUTCDays(searchFrom, offset);
    const maxStay = getMaxStayFrom(trips, candidateStart);

    if (maxStay >= requiredDays) {
      return candidateStart;
    }
  }

  return null; // Not found within search range
}

/**
 * For each day of a date range, calculate the running Schengen allowance status.
 * This includes existing trips in the calculation.
 */
export function getDailyBreakdown(
  trips: Trip[],
  startDate: Date,
  endDate: Date
): DayStatus[] {
  const days: DayStatus[] = [];
  const totalDays = differenceInDays(endDate, startDate) + 1;

  for (let i = 0; i < totalDays; i++) {
    const checkDate = addUTCDays(startDate, i);
    const daysUsedInWindow = getDaysUsed(trips, checkDate);
    const daysRemaining = MAX_STAY_DAYS - daysUsedInWindow;

    days.push({
      date: formatDate(checkDate),
      daysUsedInWindow,
      daysRemaining,
      isCompliant: daysRemaining >= 0,
      isInSchengen: isDateInSchengen(checkDate, trips),
    });
  }

  return days;
}

/**
 * Get the number of days in a trip (inclusive of both entry and exit dates).
 */
export function getTripDuration(trip: Trip): number {
  const entry = toUTCDate(trip.entryDate);
  const exit = toUTCDate(trip.exitDate);
  return differenceInDays(exit, entry) + 1;
}

/**
 * Calculate the date when 90 days would run out if entering today and staying continuously.
 * Returns the last compliant date.
 */
export function getRunOutDate(trips: Trip[], enterDate: Date): Date | null {
  const maxStay = getMaxStayFrom(trips, enterDate);
  if (maxStay <= 0) return null;
  return addUTCDays(enterDate, maxStay - 1);
}

/**
 * Get the status color based on remaining days.
 */
export function getStatusColor(daysRemaining: number): 'green' | 'amber' | 'red' | 'flashing-red' {
  if (daysRemaining <= 0) return 'flashing-red';
  if (daysRemaining < 30) return 'red';
  if (daysRemaining < 60) return 'amber';
  return 'green';
}

// Re-export helpers for use in other modules
export { toUTCDate, formatDate, addUTCDays, isDateInTrip, isDateInSchengen };
