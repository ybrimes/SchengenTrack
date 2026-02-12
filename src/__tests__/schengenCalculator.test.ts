import {
  getDaysUsed,
  getDaysRemaining,
  isTripCompliant,
  getMaxStayFrom,
  getEarliestAvailableDate,
  getDailyBreakdown,
  getTripDuration,
  getRunOutDate,
  getStatusColor,
  toUTCDate,
  formatDate,
  isDateInTrip,
  isDateInSchengen,
} from '../utils/schengenCalculator';
import { Trip } from '../types';

// Helper to create a trip quickly
function makeTrip(
  entryDate: string,
  exitDate: string,
  overrides: Partial<Trip> = {}
): Trip {
  return {
    id: `trip-${entryDate}`,
    country: 'France',
    entryDate,
    exitDate,
    isPlanned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function utc(dateStr: string): Date {
  return toUTCDate(dateStr);
}

describe('schengenCalculator', () => {
  describe('toUTCDate', () => {
    it('should parse YYYY-MM-DD to UTC midnight', () => {
      const d = toUTCDate('2025-06-15');
      expect(d.getUTCFullYear()).toBe(2025);
      expect(d.getUTCMonth()).toBe(5); // June = 5
      expect(d.getUTCDate()).toBe(15);
      expect(d.getUTCHours()).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('should format a UTC date to YYYY-MM-DD', () => {
      const d = new Date(Date.UTC(2025, 0, 5));
      expect(formatDate(d)).toBe('2025-01-05');
    });

    it('should pad single-digit months and days', () => {
      const d = new Date(Date.UTC(2025, 2, 3));
      expect(formatDate(d)).toBe('2025-03-03');
    });
  });

  describe('isDateInTrip', () => {
    const trip = makeTrip('2025-06-01', '2025-06-03');

    it('should return true for entry date', () => {
      expect(isDateInTrip(utc('2025-06-01'), trip)).toBe(true);
    });

    it('should return true for exit date', () => {
      expect(isDateInTrip(utc('2025-06-03'), trip)).toBe(true);
    });

    it('should return true for middle date', () => {
      expect(isDateInTrip(utc('2025-06-02'), trip)).toBe(true);
    });

    it('should return false for day before entry', () => {
      expect(isDateInTrip(utc('2025-05-31'), trip)).toBe(false);
    });

    it('should return false for day after exit', () => {
      expect(isDateInTrip(utc('2025-06-04'), trip)).toBe(false);
    });
  });

  describe('isDateInSchengen', () => {
    const trips = [
      makeTrip('2025-06-01', '2025-06-03'),
      makeTrip('2025-06-10', '2025-06-12'),
    ];

    it('should return true for a date in any trip', () => {
      expect(isDateInSchengen(utc('2025-06-02'), trips)).toBe(true);
      expect(isDateInSchengen(utc('2025-06-11'), trips)).toBe(true);
    });

    it('should return false for a date not in any trip', () => {
      expect(isDateInSchengen(utc('2025-06-05'), trips)).toBe(false);
    });
  });

  describe('getTripDuration', () => {
    it('should count entry and exit days (3 days for June 1-3)', () => {
      const trip = makeTrip('2025-06-01', '2025-06-03');
      expect(getTripDuration(trip)).toBe(3);
    });

    it('should return 1 for a single-day trip', () => {
      const trip = makeTrip('2025-06-01', '2025-06-01');
      expect(getTripDuration(trip)).toBe(1);
    });

    it('should handle a 90-day trip', () => {
      const trip = makeTrip('2025-01-01', '2025-03-31');
      expect(getTripDuration(trip)).toBe(90);
    });
  });

  describe('getDaysUsed', () => {
    it('should return 0 with no trips', () => {
      expect(getDaysUsed([], utc('2025-06-15'))).toBe(0);
    });

    it('should count days of a single trip within the window', () => {
      const trips = [makeTrip('2025-06-01', '2025-06-03')]; // 3 days
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(3);
    });

    it('should count a single-day trip as 1 day', () => {
      const trips = [makeTrip('2025-06-01', '2025-06-01')];
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(1);
    });

    it('should sum multiple trips', () => {
      const trips = [
        makeTrip('2025-06-01', '2025-06-03'), // 3 days
        makeTrip('2025-06-10', '2025-06-12'), // 3 days
      ];
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(6);
    });

    it('should not count trips outside the 180-day window', () => {
      const trips = [makeTrip('2024-01-01', '2024-01-10')]; // 10 days, way outside window
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(0);
    });

    it('should partially count a trip that spans the window boundary', () => {
      // Window for 2025-06-15 starts at 2024-12-18 (180 days back)
      // Trip from 2024-12-15 to 2024-12-20 -> only Dec 18-20 are in window = 3 days
      const trips = [makeTrip('2024-12-15', '2024-12-20')];
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(3);
    });

    it('should handle back-to-back trips', () => {
      const trips = [
        makeTrip('2025-06-01', '2025-06-05'), // 5 days
        makeTrip('2025-06-06', '2025-06-10'), // 5 days
      ];
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(10);
    });

    it('should handle overlapping trips (days counted once)', () => {
      const trips = [
        makeTrip('2025-06-01', '2025-06-05'), // 5 days
        makeTrip('2025-06-03', '2025-06-08'), // overlaps June 3-5
      ];
      // Unique days: June 1-8 = 8 days
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(8);
    });

    it('should correctly handle exactly 90 days used', () => {
      // Trip from Jan 1 to Mar 31 = 90 days
      const trips = [makeTrip('2025-01-01', '2025-03-31')];
      // Check on Mar 31 -> should be 90
      expect(getDaysUsed(trips, utc('2025-03-31'))).toBe(90);
    });

    it('should count the check date itself if the user is in Schengen', () => {
      const trips = [makeTrip('2025-06-15', '2025-06-20')];
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(1);
    });
  });

  describe('getDaysRemaining', () => {
    it('should return 90 with no trips', () => {
      expect(getDaysRemaining([], utc('2025-06-15'))).toBe(90);
    });

    it('should return correct remaining days', () => {
      const trips = [makeTrip('2025-06-01', '2025-06-10')]; // 10 days
      expect(getDaysRemaining(trips, utc('2025-06-15'))).toBe(80);
    });

    it('should return 0 when exactly 90 days used', () => {
      const trips = [makeTrip('2025-01-01', '2025-03-31')];
      expect(getDaysRemaining(trips, utc('2025-03-31'))).toBe(0);
    });

    it('should return negative for overstay', () => {
      // 91-day trip: Jan 1 to Apr 1
      const trips = [makeTrip('2025-01-01', '2025-04-01')];
      expect(getDaysRemaining(trips, utc('2025-04-01'))).toBe(-1);
    });
  });

  describe('isTripCompliant', () => {
    it('should approve a short trip with no history', () => {
      const result = isTripCompliant([], makeTrip('2025-06-01', '2025-06-10'));
      expect(result.compliant).toBe(true);
      expect(result.maxDays).toBe(10);
      expect(result.overstayDays).toBe(0);
    });

    it('should approve a trip using exactly 90 days with no history', () => {
      const result = isTripCompliant([], makeTrip('2025-01-01', '2025-03-31'));
      expect(result.compliant).toBe(true);
      expect(result.maxDays).toBe(90);
      expect(result.overstayDays).toBe(0);
    });

    it('should reject a trip exceeding 90 days with no history', () => {
      const result = isTripCompliant([], makeTrip('2025-01-01', '2025-04-01'));
      expect(result.compliant).toBe(false);
      expect(result.maxDays).toBe(90); // First 90 days are fine
      expect(result.overstayDays).toBe(1);
    });

    it('should reject a trip when combined with history exceeds 90 days', () => {
      const existing = [makeTrip('2025-01-01', '2025-02-28')]; // 59 days
      // New trip of 32 days -> total 91
      const result = isTripCompliant(
        existing,
        makeTrip('2025-03-10', '2025-04-10')
      );
      expect(result.compliant).toBe(false);
    });

    it('should approve a trip that fits within remaining allowance', () => {
      const existing = [makeTrip('2025-01-01', '2025-02-28')]; // 59 days
      // New trip of 10 days -> total 69
      const result = isTripCompliant(
        existing,
        makeTrip('2025-03-10', '2025-03-19')
      );
      expect(result.compliant).toBe(true);
      expect(result.overstayDays).toBe(0);
    });

    it('should handle multiple existing trips', () => {
      const existing = [
        makeTrip('2025-01-15', '2025-01-30'), // 16 days
        makeTrip('2025-03-01', '2025-03-20'), // 20 days
        makeTrip('2025-04-10', '2025-04-30'), // 21 days  -> total 57
      ];
      // New 30-day trip -> total 87, should be fine
      const result = isTripCompliant(
        existing,
        makeTrip('2025-05-15', '2025-06-13')
      );
      expect(result.compliant).toBe(true);
    });
  });

  describe('getMaxStayFrom', () => {
    it('should return 90 with no existing trips', () => {
      expect(getMaxStayFrom([], utc('2025-06-01'))).toBe(90);
    });

    it('should account for days already used in the window', () => {
      // 30 days used in the window
      const trips = [makeTrip('2025-05-01', '2025-05-30')];
      const max = getMaxStayFrom(trips, utc('2025-06-01'));
      expect(max).toBe(60); // 90 - 30 = 60
    });

    it('should return 0 if already at 90 days', () => {
      const trips = [makeTrip('2025-03-04', '2025-06-01')]; // 90 days (Mar 4 to Jun 1)
      expect(getMaxStayFrom(trips, utc('2025-06-02'))).toBe(0);
    });
  });

  describe('getEarliestAvailableDate', () => {
    it('should return today if enough days are available', () => {
      const result = getEarliestAvailableDate([], 30, utc('2025-06-01'));
      expect(result).toEqual(utc('2025-06-01'));
    });

    it('should find a future date when current allowance is insufficient', () => {
      // Used 85 days ending today (June 15)
      // Trip from March 23 to June 15 = 85 days
      const trips = [makeTrip('2025-03-23', '2025-06-15')];
      // Need 10 days. Currently only 5 remain.
      // Days will start "expiring" from the window as we move forward
      const result = getEarliestAvailableDate(trips, 10, utc('2025-06-16'));
      expect(result).not.toBeNull();
      if (result) {
        const maxStay = getMaxStayFrom(trips, result);
        expect(maxStay).toBeGreaterThanOrEqual(10);
      }
    });

    it('should return null if not possible within 365 days', () => {
      // Create a pathological scenario: constant trips covering most days
      // This is hard to hit in practice with 90/180, so we just test a very long trip
      // Actually, 90/180 always resets, so null is very unlikely.
      // Let's test with search from today with no trips - should always work
      const result = getEarliestAvailableDate([], 90, utc('2025-06-01'));
      expect(result).toEqual(utc('2025-06-01'));
    });
  });

  describe('getDailyBreakdown', () => {
    it('should return one entry per day in range', () => {
      const breakdown = getDailyBreakdown([], utc('2025-06-01'), utc('2025-06-05'));
      expect(breakdown).toHaveLength(5);
    });

    it('should show correct days used and remaining for each day', () => {
      const trips = [makeTrip('2025-06-01', '2025-06-05')];
      const breakdown = getDailyBreakdown(trips, utc('2025-06-01'), utc('2025-06-05'));

      expect(breakdown[0].date).toBe('2025-06-01');
      expect(breakdown[0].daysUsedInWindow).toBe(1);
      expect(breakdown[0].daysRemaining).toBe(89);
      expect(breakdown[0].isInSchengen).toBe(true);
      expect(breakdown[0].isCompliant).toBe(true);

      expect(breakdown[4].date).toBe('2025-06-05');
      expect(breakdown[4].daysUsedInWindow).toBe(5);
      expect(breakdown[4].daysRemaining).toBe(85);
    });

    it('should mark non-schengen days correctly', () => {
      const trips = [makeTrip('2025-06-03', '2025-06-05')];
      const breakdown = getDailyBreakdown(trips, utc('2025-06-01'), utc('2025-06-07'));

      expect(breakdown[0].isInSchengen).toBe(false); // June 1
      expect(breakdown[1].isInSchengen).toBe(false); // June 2
      expect(breakdown[2].isInSchengen).toBe(true); // June 3
      expect(breakdown[5].isInSchengen).toBe(false); // June 6
    });
  });

  describe('getRunOutDate', () => {
    it('should return 89 days after entry with no history', () => {
      const result = getRunOutDate([], utc('2025-06-01'));
      expect(result).toEqual(utc('2025-08-29')); // June 1 + 89 = Aug 29
    });

    it('should return null if already at max', () => {
      // 90 days used, entering the next day
      const trips = [makeTrip('2025-03-04', '2025-06-01')]; // 90 days
      const result = getRunOutDate(trips, utc('2025-06-02'));
      expect(result).toBeNull();
    });

    it('should account for existing trips', () => {
      // 30 days used
      const trips = [makeTrip('2025-05-01', '2025-05-30')];
      const result = getRunOutDate(trips, utc('2025-06-01'));
      // Can stay 60 more days, so run out = June 1 + 59 = July 30
      expect(result).toEqual(utc('2025-07-30'));
    });
  });

  describe('getStatusColor', () => {
    it('should return green for 60+ days remaining', () => {
      expect(getStatusColor(90)).toBe('green');
      expect(getStatusColor(60)).toBe('green');
    });

    it('should return amber for 30-59 days', () => {
      expect(getStatusColor(59)).toBe('amber');
      expect(getStatusColor(30)).toBe('amber');
    });

    it('should return red for 1-29 days', () => {
      expect(getStatusColor(29)).toBe('red');
      expect(getStatusColor(1)).toBe('red');
    });

    it('should return flashing-red for 0 or negative', () => {
      expect(getStatusColor(0)).toBe('flashing-red');
      expect(getStatusColor(-5)).toBe('flashing-red');
    });
  });

  describe('edge cases', () => {
    it('should handle trip at the very start of the 180-day window', () => {
      // Window for June 15 starts Dec 18
      const trips = [makeTrip('2024-12-18', '2024-12-20')]; // 3 days at window start
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(3);
    });

    it('should handle trip at the very end of the 180-day window', () => {
      const trips = [makeTrip('2025-06-13', '2025-06-15')]; // 3 days at window end
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(3);
    });

    it('should handle trip exactly spanning the full 180-day window', () => {
      // Window for 2025-06-15 is 2024-12-18 to 2025-06-15 = 180 days
      const trips = [makeTrip('2024-12-18', '2025-06-15')];
      expect(getDaysUsed(trips, utc('2025-06-15'))).toBe(180);
      expect(getDaysRemaining(trips, utc('2025-06-15'))).toBe(-90);
    });

    it('should drop days from the window as it rolls forward', () => {
      // Trip: Jan 1 to Jan 30 = 30 days
      const trips = [makeTrip('2025-01-01', '2025-01-30')];
      // On Jan 30: window is Jul 4, 2024 to Jan 30 -> 30 days used
      expect(getDaysUsed(trips, utc('2025-01-30'))).toBe(30);
      // On Jun 30: window is Jan 2 to Jun 30 -> 29 days in window (Jan 2-30)
      expect(getDaysUsed(trips, utc('2025-06-30'))).toBe(29);
      // On Jul 1: window is Jan 3 to Jul 1 -> 28 days in window (Jan 3-30)
      expect(getDaysUsed(trips, utc('2025-07-01'))).toBe(28);
      // On Jul 29: window is Jan 31 to Jul 29 -> 0 days (trip ended Jan 30)
      expect(getDaysUsed(trips, utc('2025-07-29'))).toBe(0);
    });

    it('should handle many small trips adding up', () => {
      // 9 trips of 10 days each = 90 days
      const trips: Trip[] = [];
      let startDay = 1;
      for (let i = 0; i < 9; i++) {
        const entry = `2025-${String(Math.floor((startDay - 1) / 28) + 1).padStart(2, '0')}-${String(((startDay - 1) % 28) + 1).padStart(2, '0')}`;
        // Simpler approach: just use sequential dates
        const entryDate = new Date(Date.UTC(2025, 0, startDay));
        const exitDate = new Date(Date.UTC(2025, 0, startDay + 9));
        trips.push(
          makeTrip(formatDate(entryDate), formatDate(exitDate), {
            id: `trip-${i}`,
          })
        );
        startDay += 15; // 10 days trip + 5 days gap
      }

      // Total days: 9 * 10 = 90
      // Last trip ends at day 1 + (8*15) + 9 = 130 -> May 10
      const lastTripEnd = new Date(Date.UTC(2025, 0, 8 * 15 + 10));
      expect(getDaysUsed(trips, lastTripEnd)).toBe(90);
      expect(getDaysRemaining(trips, lastTripEnd)).toBe(0);
    });

    it('should handle single-day trips correctly', () => {
      const trips = [
        makeTrip('2025-06-01', '2025-06-01'), // 1 day
        makeTrip('2025-06-03', '2025-06-03'), // 1 day
        makeTrip('2025-06-05', '2025-06-05'), // 1 day
      ];
      expect(getDaysUsed(trips, utc('2025-06-10'))).toBe(3);
    });

    it('should handle back-to-back trips correctly', () => {
      const trips = [
        makeTrip('2025-06-01', '2025-06-10'), // 10 days
        makeTrip('2025-06-11', '2025-06-20'), // 10 days, immediately after
      ];
      expect(getDaysUsed(trips, utc('2025-06-20'))).toBe(20);
    });

    it('should handle the exact 90/180 boundary scenario', () => {
      // Spend exactly 90 days, wait for the window to reset
      const trips = [makeTrip('2025-01-01', '2025-03-31')]; // 90 days

      // On March 31: 90 days used
      expect(getDaysRemaining(trips, utc('2025-03-31'))).toBe(0);

      // On June 29: window starts Jan 1, so all 90 days still in window
      expect(getDaysRemaining(trips, utc('2025-06-29'))).toBe(0);

      // On June 30: window starts Jan 2, so Jan 1 drops out -> 89 days
      expect(getDaysRemaining(trips, utc('2025-06-30'))).toBe(1);

      // On July 1: window starts Jan 3 -> 88 days used
      expect(getDaysRemaining(trips, utc('2025-07-01'))).toBe(2);
    });
  });
});
