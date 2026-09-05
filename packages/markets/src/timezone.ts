/**
 * Timezone utilities for converting between UTC and market timezone.
 * Uses Intl API for proper DST handling.
 */

import type { IanaTimezone } from './types.js';
import { MarketCalendarError } from './types.js';

/**
 * Format a date in a specific timezone.
 * Returns object with year, month, day, hour, minute, second, millisecond.
 */
export function formatDateInTimezone(date: Date, timezone: IanaTimezone): {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number;
  readonly hour: number; // 0-23
  readonly minute: number; // 0-59
  readonly second: number; // 0-59
  readonly dayOfWeek: number; // 0-6 (0=Sunday)
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = new Map<string, string>();
    formatter.formatToParts(date).forEach((part) => {
      if (part.type !== 'literal') {
        parts.set(part.type, part.value);
      }
    });

    return {
      year: parseInt(parts.get('year') || '1970', 10),
      month: parseInt(parts.get('month') || '01', 10),
      day: parseInt(parts.get('day') || '01', 10),
      hour: parseInt(parts.get('hour') || '00', 10),
      minute: parseInt(parts.get('minute') || '00', 10),
      second: parseInt(parts.get('second') || '00', 10),
      dayOfWeek: date.getUTCDay(), // Note: getUTCDay is consistent
    };
  } catch (error) {
    throw new MarketCalendarError(
      `Failed to format date in timezone "${timezone}": ${error instanceof Error ? error.message : String(error)}`,
      'INVALID_TIMEZONE',
    );
  }
}

/**
 * Convert a local time (as HH:mm) in a timezone to a UTC Date.
 * Used for determining session boundaries.
 *
 * @param dateStr Date in YYYY-MM-DD format (in market timezone)
 * @param timeStr Time in HH:mm format (in market timezone)
 * @param timezone IANA timezone
 */
export function localTimeToUtc(
  dateStr: string,
  timeStr: string,
  timezone: IanaTimezone,
): Date {
  // Parse input
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const [hourStr, minuteStr] = timeStr.split(':');

  const year = parseInt(yearStr || '1970', 10);
  const month = parseInt(monthStr || '01', 10);
  const day = parseInt(dayStr || '01', 10);
  const hour = parseInt(hourStr || '00', 10);
  const minute = parseInt(minuteStr || '00', 10);

  if (
    isNaN(year) || isNaN(month) || isNaN(day) ||
    isNaN(hour) || isNaN(minute) ||
    month < 1 || month > 12 || day < 1 || day > 31 ||
    hour < 0 || hour > 23 || minute < 0 || minute > 59
  ) {
    throw new MarketCalendarError(
      `Invalid date/time format: ${dateStr} ${timeStr}`,
      'INVALID_DATE',
    );
  }

  // Create a trial date and format it to find the UTC offset
  const trial = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = new Map<string, string>();
  formatter.formatToParts(trial).forEach((part) => {
    if (part.type !== 'literal') {
      parts.set(part.type, part.value);
    }
  });

  const trialYear = parseInt(parts.get('year') || '1970', 10);
  const trialMonth = parseInt(parts.get('month') || '01', 10);
  const trialDay = parseInt(parts.get('day') || '01', 10);
  const trialHour = parseInt(parts.get('hour') || '00', 10);
  const trialMinute = parseInt(parts.get('minute') || '00', 10);

  // Calculate offset
  const offsetMs = trial.getTime() - new Date(trialYear, trialMonth - 1, trialDay, trialHour, trialMinute, 0).getTime();

  // Adjust the trial to account for timezone offset
  return new Date(trial.getTime() - offsetMs);
}

/**
 * Format a Date as YYYY-MM-DD in a given timezone.
 */
export function formatDateAsString(date: Date, timezone: IanaTimezone): string {
  const parts = formatDateInTimezone(date, timezone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

/**
 * Parse a time string (HH:mm) into hour and minute.
 */
export function parseTimeString(timeStr: string): { readonly hour: number; readonly minute: number } {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new MarketCalendarError(
      `Invalid time format: "${timeStr}" (expected HH:mm or H:mm)`,
      'INVALID_DATE',
    );
  }
  const hour = parseInt(match[1]!, 10);
  const minute = parseInt(match[2]!, 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new MarketCalendarError(
      `Time out of range: ${hour}:${minute}`,
      'INVALID_DATE',
    );
  }
  return { hour, minute };
}

/**
 * Format hour and minute as HH:mm string.
 */
export function formatTimeString(hour: number, minute: number): string {
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new MarketCalendarError(
      `Time out of range: ${hour}:${minute}`,
      'INVALID_DATE',
    );
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
