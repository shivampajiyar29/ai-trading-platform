/**
 * Core market, session, and timezone types for the trading platform.
 * Provider-neutral and exchange-agnostic.
 */

/**
 * IANA timezone identifier.
 * Examples: 'America/New_York', 'Europe/London', 'Asia/Tokyo'
 */
export type IanaTimezone = string & { readonly __brand: 'IanaTimezone' };

/**
 * Create a branded IANA timezone identifier.
 * Basic validation ensures the string is non-empty and looks like an IANA identifier.
 */
export function createIanaTimezone(tz: string): IanaTimezone {
  if (!tz || typeof tz !== 'string' || tz.trim() === '') {
    throw new MarketCalendarError(`Invalid IANA timezone: "${tz}"`, 'INVALID_TIMEZONE');
  }
  // Basic IANA format check: should contain / or be UTC
  if (tz !== 'UTC' && !tz.includes('/')) {
    throw new MarketCalendarError(
      `Invalid IANA timezone format: "${tz}" (expected format like "America/New_York")`,
      'INVALID_TIMEZONE',
    );
  }
  return tz as IanaTimezone;
}

/**
 * Session types during a trading day.
 */
export type SessionType = 'REGULAR' | 'PRE_MARKET' | 'POST_MARKET' | 'CLOSED';

/**
 * A trading session with explicit boundaries.
 */
export interface Session {
  /** Type of session */
  readonly type: SessionType;

  /** Session start time in market timezone (HH:mm format, 24-hour) */
  readonly startTime: string; // e.g., "09:30"

  /** Session end time in market timezone (HH:mm format, 24-hour) */
  readonly endTime: string; // e.g., "16:00"

  /** Is this session optional/may not occur? (e.g., pre-market) */
  readonly optional?: boolean;
}

/**
 * Market identifier (e.g., "NSE", "NYSE", "NASDAQ").
 * Used to look up the appropriate calendar.
 */
export type MarketId = string & { readonly __brand: 'MarketId' };

export function createMarketId(id: string): MarketId {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error(`Invalid market ID: "${id}"`);
  }
  return id.toUpperCase() as MarketId;
}

/**
 * Represents a single trading day and its sessions.
 */
export interface TradingDay {
  /** The trading date in YYYY-MM-DD format */
  readonly date: string; // e.g., "2024-01-15"

  /** Sessions on this trading day (in order) */
  readonly sessions: readonly Session[];

  /** Is this a partial trading day (e.g., early close)? */
  readonly isEarlyClose?: boolean;

  /** Is this a non-trading day? */
  readonly isClosed?: boolean;
}

/**
 * Market status at a given point in time.
 */
export interface MarketStatus {
  /** Is the market currently open for trading? */
  readonly isOpen: boolean;

  /** Current active session, if any */
  readonly activeSession?: Session | undefined;

  /** Next upcoming session */
  readonly nextSession?: Session | undefined;

  /** Current trading date in market timezone (YYYY-MM-DD) */
  readonly tradingDate: string;

  /** Time until market opens (if closed), in milliseconds. undefined if already open. */
  readonly timeUntilOpen?: number | undefined;

  /** Time until market closes (if open), in milliseconds. undefined if closed. */
  readonly timeUntilClose?: number | undefined;
}

/**
 * Represents a trading market with its schedule and timezone.
 */
export interface Market {
  /** Unique identifier for this market */
  readonly id: MarketId;

  /** Human-readable name (e.g., "National Stock Exchange of India") */
  readonly name: string;

  /** IANA timezone for this market */
  readonly timezone: IanaTimezone;

  /** Standard session schedule for regular trading days */
  readonly standardSessions: readonly Session[];

  /** Weekends (0 = Sunday, 1 = Monday, ..., 6 = Saturday) */
  readonly weekendDays?: readonly number[]; // default: [0, 6]

  /** Holidays in YYYY-MM-DD format (can be extended by calendar) */
  readonly holidays?: readonly string[];
}

/**
 * Calendar abstraction for market trading schedules.
 * Allows future exchange-specific calendars without coupling to a single exchange.
 */
export interface MarketCalendar {
  /** Market definition */
  readonly market: Market;

  /**
   * Check if a date is a trading day.
   * Accounts for weekends and holidays.
   */
  isTradingDay(date: Date): boolean;

  /**
   * Check if a date string (YYYY-MM-DD) is a trading day.
   */
  isTradingDayByDate(dateStr: string): boolean;

  /**
   * Get sessions for a given trading day.
   * Returns standard sessions if not overridden.
   */
  getSessions(date: Date): readonly Session[];

  /**
   * Get sessions by date string (YYYY-MM-DD).
   */
  getSessionsByDate(dateStr: string): readonly Session[];

  /**
   * Get the market status at a given timestamp.
   */
  getStatus(timestamp: Date): MarketStatus;

  /**
   * Check if a timestamp falls within a valid trading session.
   */
  isWithinTradingSession(timestamp: Date): boolean;

  /**
   * Get the trading date (in market timezone) for a given timestamp.
   */
  getTradingDate(timestamp: Date): string;

  /**
   * Get the next market open time after a given timestamp.
   */
  getNextOpen(timestamp: Date): Date | null;

  /**
   * Get the next market close time after a given timestamp.
   */
  getNextClose(timestamp: Date): Date | null;

  /**
   * Add a holiday (date string in YYYY-MM-DD format).
   */
  addHoliday(dateStr: string): void;

  /**
   * Remove a holiday.
   */
  removeHoliday(dateStr: string): void;

  /**
   * Get all holidays.
   */
  getHolidays(): readonly string[];
}

/**
 * Error thrown by market/calendar operations.
 */
export class MarketCalendarError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_TIMEZONE'
      | 'INVALID_SESSION'
      | 'INVALID_DATE'
      | 'INVALID_MARKET'
      | 'INVALID_CONFIGURATION',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'MarketCalendarError';
  }
}
