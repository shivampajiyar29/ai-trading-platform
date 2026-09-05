/**
 * Default MarketCalendar implementation.
 * Supports configurable holidays and standard sessions.
 */

import type { Market, MarketCalendar, Session, MarketStatus } from './types.js';
import { MarketCalendarError } from './types.js';
import { localTimeToUtc, formatDateAsString } from './timezone.js';

export class DefaultMarketCalendar implements MarketCalendar {
  readonly market: Market;
  private readonly holidays: Set<string>;
  private readonly sessionOverrides: Map<string, readonly Session[]>;

  constructor(market: Market) {
    this.market = market;
    this.holidays = new Set(market.holidays ?? []);
    this.sessionOverrides = new Map();
  }

  isTradingDay(date: Date): boolean {
    return this.isTradingDayByDate(formatDateAsString(date, this.market.timezone));
  }

  isTradingDayByDate(dateStr: string): boolean {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new MarketCalendarError(`Invalid date format: "${dateStr}" (expected YYYY-MM-DD)`, 'INVALID_DATE');
    }

    // Check if it's a holiday
    if (this.holidays.has(dateStr)) {
      return false;
    }

    // Check if it's a weekend
    const parts = dateStr.split('-');
    const year = parseInt(parts[0] || '1970', 10);
    const month = parseInt(parts[1] || '01', 10);
    const day = parseInt(parts[2] || '01', 10);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayOfWeek = date.getUTCDay();
    const weekendDays = this.market.weekendDays ?? [0, 6];
    if (weekendDays.includes(dayOfWeek)) {
      return false;
    }

    return true;
  }

  getSessions(date: Date): readonly Session[] {
    return this.getSessionsByDate(formatDateAsString(date, this.market.timezone));
  }

  getSessionsByDate(dateStr: string): readonly Session[] {
    // Check for overrides first
    if (this.sessionOverrides.has(dateStr)) {
      return this.sessionOverrides.get(dateStr) ?? [];
    }

    // Check if trading day
    if (!this.isTradingDayByDate(dateStr)) {
      return [];
    }

    return this.market.standardSessions;
  }

  getStatus(timestamp: Date): MarketStatus {
    const tradingDate = formatDateAsString(timestamp, this.market.timezone);
    const sessions = this.getSessionsByDate(tradingDate);

    // Find current and next sessions
    let activeSession: Session | undefined;
    let nextSession: Session | undefined;

    for (const session of sessions) {
      const sessionStart = localTimeToUtc(tradingDate, session.startTime, this.market.timezone);
      const sessionEnd = localTimeToUtc(tradingDate, session.endTime, this.market.timezone);

      if (timestamp >= sessionStart && timestamp < sessionEnd) {
        activeSession = session;
      } else if (timestamp < sessionStart && !nextSession) {
        nextSession = session;
      }
    }

    const isOpen = activeSession !== undefined;

    let timeUntilOpen: number | undefined;
    let timeUntilClose: number | undefined;

    if (isOpen && activeSession) {
      const sessionEnd = localTimeToUtc(tradingDate, activeSession.endTime, this.market.timezone);
      timeUntilClose = sessionEnd.getTime() - timestamp.getTime();
    } else if (nextSession) {
      const sessionStart = localTimeToUtc(tradingDate, nextSession.startTime, this.market.timezone);
      timeUntilOpen = sessionStart.getTime() - timestamp.getTime();
    } else {
      // Find next trading day
      const nextOpenDate = this.getNextOpen(timestamp);
      if (nextOpenDate) {
        timeUntilOpen = nextOpenDate.getTime() - timestamp.getTime();
      }
    }

    return {
      isOpen,
      activeSession,
      nextSession,
      tradingDate,
      timeUntilOpen,
      timeUntilClose,
    };
  }

  isWithinTradingSession(timestamp: Date): boolean {
    const status = this.getStatus(timestamp);
    return status.isOpen;
  }

  getTradingDate(timestamp: Date): string {
    return formatDateAsString(timestamp, this.market.timezone);
  }

  getNextOpen(timestamp: Date): Date | null {
    // Start checking from tomorrow
    let checkDate = new Date(timestamp);
    checkDate.setUTCDate(checkDate.getUTCDate() + 1);

    for (let i = 0; i < 365; i++) {
      const dateStr = formatDateAsString(checkDate, this.market.timezone);
      const sessions = this.getSessionsByDate(dateStr);

      if (sessions.length > 0) {
        const firstSession = sessions[0];
        if (firstSession) {
          const openTime = localTimeToUtc(dateStr, firstSession.startTime, this.market.timezone);
          if (openTime > timestamp) {
            return openTime;
          }
        }
      }

      checkDate.setUTCDate(checkDate.getUTCDate() + 1);
    }

    return null;
  }

  getNextClose(timestamp: Date): Date | null {
    const tradingDate = formatDateAsString(timestamp, this.market.timezone);
    const sessions = this.getSessionsByDate(tradingDate);

    // Check today first
    for (const session of sessions) {
      const closeTime = localTimeToUtc(tradingDate, session.endTime, this.market.timezone);
      if (closeTime > timestamp) {
        return closeTime;
      }
    }

    // Check future trading days
    let checkDate = new Date(timestamp);
    checkDate.setUTCDate(checkDate.getUTCDate() + 1);

    for (let i = 0; i < 365; i++) {
      const dateStr = formatDateAsString(checkDate, this.market.timezone);
      const futureSessions = this.getSessionsByDate(dateStr);

      if (futureSessions.length > 0) {
        const lastSession = futureSessions[futureSessions.length - 1];
        if (lastSession) {
          return localTimeToUtc(dateStr, lastSession.endTime, this.market.timezone);
        }
      }

      checkDate.setUTCDate(checkDate.getUTCDate() + 1);
    }

    return null;
  }

  addHoliday(dateStr: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new MarketCalendarError(`Invalid date format: "${dateStr}" (expected YYYY-MM-DD)`, 'INVALID_DATE');
    }
    this.holidays.add(dateStr);
  }

  removeHoliday(dateStr: string): void {
    this.holidays.delete(dateStr);
  }

  getHolidays(): readonly string[] {
    return Array.from(this.holidays).sort();
  }
}
