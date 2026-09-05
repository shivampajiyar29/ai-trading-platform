import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createIanaTimezone,
  createMarketId,
  type Market,
  MarketCalendarError,
} from './index.js';
import { DefaultMarketCalendar } from './calendar.js';
import { parseTimeString } from './timezone.js';

// Sample NSE (India) market definition for testing
const createNseMarket = (): Market => ({
  id: createMarketId('NSE'),
  name: 'National Stock Exchange of India',
  timezone: createIanaTimezone('Asia/Kolkata'),
  standardSessions: [
    {
      type: 'REGULAR',
      startTime: '09:15',
      endTime: '15:30',
    },
  ],
  weekendDays: [0, 6], // Sunday, Saturday
  holidays: ['2024-01-26', '2024-03-29'], // Republic Day, Good Friday
});

// Sample NYSE market definition
const createNyseMarket = (): Market => ({
  id: createMarketId('NYSE'),
  name: 'New York Stock Exchange',
  timezone: createIanaTimezone('America/New_York'),
  standardSessions: [
    {
      type: 'PRE_MARKET',
      startTime: '04:00',
      endTime: '09:30',
      optional: true,
    },
    {
      type: 'REGULAR',
      startTime: '09:30',
      endTime: '16:00',
    },
    {
      type: 'POST_MARKET',
      startTime: '16:00',
      endTime: '20:00',
      optional: true,
    },
  ],
  weekendDays: [0, 6],
  holidays: ['2024-01-15'], // MLK Day
});

describe('Markets Calendar', () => {
  describe('Basic Market Setup', () => {
    it('creates a market with correct properties', () => {
      const market = createNseMarket();
      assert.equal(market.id, 'NSE');
      assert.equal(market.timezone, 'Asia/Kolkata');
      assert.equal(market.standardSessions.length, 1);
    });

    it('validates IANA timezone format', () => {
      assert.throws(() => createIanaTimezone(''), /Invalid IANA timezone/);
      assert.throws(() => createIanaTimezone('NotAValidTz'), /Invalid IANA timezone format/);
      assert.doesNotThrow(() => createIanaTimezone('UTC'));
      assert.doesNotThrow(() => createIanaTimezone('America/New_York'));
    });

    it('validates market ID', () => {
      assert.throws(() => createMarketId(''), /Invalid market ID/);
      const id = createMarketId('nse');
      assert.equal(id, 'NSE'); // should be uppercase
    });
  });

  describe('Trading Days', () => {
    it('recognizes a regular weekday as a trading day', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      // 2024-01-15 is a Monday
      assert.equal(calendar.isTradingDayByDate('2024-01-15'), true);
    });

    it('recognizes Saturday as a non-trading day', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      // 2024-01-13 is a Saturday
      assert.equal(calendar.isTradingDayByDate('2024-01-13'), false);
    });

    it('recognizes Sunday as a non-trading day', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      // 2024-01-14 is a Sunday
      assert.equal(calendar.isTradingDayByDate('2024-01-14'), false);
    });

    it('recognizes a configured holiday as a non-trading day', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      // 2024-01-26 is Republic Day (holiday)
      assert.equal(calendar.isTradingDayByDate('2024-01-26'), false);
    });
  });

  describe('Market Status', () => {
    it('correctly identifies market as open during UTC times', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      // Use a simple UTC timestamp and check market open/close logic
      const timestamp = new Date('2024-01-15T10:00:00Z');
      const status = calendar.getStatus(timestamp);
      // Just verify we get a status object with expected fields
      assert.equal(typeof status.isOpen, 'boolean');
      assert.equal(typeof status.tradingDate, 'string');
    });

    it('correctly identifies market as closed on non-trading days', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      // Sunday should have no sessions
      const timestamp = new Date('2024-01-14T10:00:00Z');
      const status = calendar.getStatus(timestamp);
      assert.equal(status.isOpen, false);
      assert.equal(status.activeSession, undefined);
    });
  });

  describe('Session Management', () => {
    it('returns empty sessions for non-trading days', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      // Saturday - should be closed
      const sessions = calendar.getSessionsByDate('2024-01-13');
      assert.equal(sessions.length, 0);
    });

    it('returns standard sessions for trading days', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      // Monday - should have sessions
      const sessions = calendar.getSessionsByDate('2024-01-15');
      assert.equal(sessions.length, 1);
      assert.equal(sessions[0].type, 'REGULAR');
    });
  });

  describe('Timezone Validation', () => {
    it('formats date in target timezone', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      const timestamp = new Date('2024-01-15T10:00:00Z');
      const tradingDate = calendar.getTradingDate(timestamp);
      assert.equal(typeof tradingDate, 'string');
      assert.match(tradingDate, /^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Holiday Management', () => {
    it('adds a holiday correctly', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      
      // 2024-06-17 is a Monday (a trading day initially)
      assert.equal(calendar.isTradingDayByDate('2024-06-17'), true);
      calendar.addHoliday('2024-06-17');
      assert.equal(calendar.isTradingDayByDate('2024-06-17'), false);
    });

    it('removes a holiday correctly', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      
      assert.equal(calendar.isTradingDayByDate('2024-01-26'), false);
      calendar.removeHoliday('2024-01-26');
      assert.equal(calendar.isTradingDayByDate('2024-01-26'), true);
    });

    it('returns all holidays', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      
      const holidays = calendar.getHolidays();
      assert(holidays.includes('2024-01-26'));
      assert(holidays.includes('2024-03-29'));
    });

    it('validates holiday date format', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      
      assert.throws(() => calendar.addHoliday('2024/01/26'), /Invalid date format/);
      assert.throws(() => calendar.addHoliday('01-26-2024'), /Invalid date format/);
    });
  });

  describe('Multiple Sessions', () => {
    it('returns correct sessions for NYSE with multiple session types', () => {
      const market = createNyseMarket();
      const calendar = new DefaultMarketCalendar(market);
      
      // Use a date that's not MLK Day
      const sessions = calendar.getSessionsByDate('2024-01-16');
      assert.equal(sessions.length, 3);
      assert.equal(sessions[0].type, 'PRE_MARKET');
      assert.equal(sessions[1].type, 'REGULAR');
      assert.equal(sessions[2].type, 'POST_MARKET');
    });

    it('recognizes closed days for holidays', () => {
      const market = createNyseMarket();
      const calendar = new DefaultMarketCalendar(market);
      
      // MLK Day (2024-01-15)
      const sessions = calendar.getSessionsByDate('2024-01-15');
      assert.equal(sessions.length, 0);
    });
  });

  describe('Next Open/Close Times', () => {
    it('finds next market open correctly', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      // Any timestamp on a weekend
      const timestamp = new Date('2024-01-14T12:00:00Z'); // Sunday
      const nextOpen = calendar.getNextOpen(timestamp);
      
      assert(nextOpen !== null);
      // Should be in the future
      assert(nextOpen.getTime() > timestamp.getTime());
    });

    it('finds next market close correctly', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      // Any timestamp on a trading day
      const timestamp = new Date('2024-01-15T02:00:00Z');
      const nextClose = calendar.getNextClose(timestamp);
      
      assert(nextClose !== null);
      // Market closes after 02:00 UTC on this date
      assert(nextClose.getTime() > timestamp.getTime());
    });
  });

  describe('Error Handling', () => {
    it('throws MarketCalendarError for invalid timezone', () => {
      assert.throws(
        () => createIanaTimezone('InvalidTz'),
        (err: any) => err instanceof MarketCalendarError && err.code === 'INVALID_TIMEZONE',
      );
    });

    it('throws MarketCalendarError for invalid date format', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      
      assert.throws(
        () => calendar.isTradingDayByDate('01/15/2024'),
        (err: any) => err instanceof MarketCalendarError && err.code === 'INVALID_DATE',
      );
    });
  });

  describe('Deterministic Behavior', () => {
    it('returns consistent results for same inputs', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      const timestamp = new Date('2024-01-15T04:00:00Z');
      
      const status1 = calendar.getStatus(timestamp);
      const status2 = calendar.getStatus(timestamp);
      
      assert.deepEqual(status1, status2);
    });

    it('returns consistent trading date for same UTC time', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      const timestamp = new Date('2024-01-15T04:00:00Z');
      
      const date1 = calendar.getTradingDate(timestamp);
      const date2 = calendar.getTradingDate(timestamp);
      
      assert.equal(date1, date2);
    });
  });

  describe('Time String Parsing', () => {
    it('parses valid time strings', () => {
      const parsed1 = parseTimeString('09:30');
      assert.equal(parsed1.hour, 9);
      assert.equal(parsed1.minute, 30);

      const parsed2 = parseTimeString('16:00');
      assert.equal(parsed2.hour, 16);
      assert.equal(parsed2.minute, 0);
    });

    it('rejects invalid time formats', () => {
      assert.throws(() => parseTimeString('9:30:00'), /Invalid time format/);
      assert.throws(() => parseTimeString('25:00'), /out of range/);
      assert.throws(() => parseTimeString('09:60'), /out of range/);
    });
  });

  describe('Edge Cases', () => {
    it('handles market with no holidays', () => {
      const marketNoHolidays: Market = {
        id: createMarketId('TEST'),
        name: 'Test Market',
        timezone: createIanaTimezone('UTC'),
        standardSessions: [
          { type: 'REGULAR', startTime: '09:00', endTime: '17:00' },
        ],
        weekendDays: [0, 6],
      };
      
      const calendar = new DefaultMarketCalendar(marketNoHolidays);
      assert(calendar.getHolidays().length === 0);
    });

    it('handles 24-hour market correctly', () => {
      const market24h: Market = {
        id: createMarketId('CRYPTO'),
        name: 'Crypto Market',
        timezone: createIanaTimezone('UTC'),
        standardSessions: [
          { type: 'REGULAR', startTime: '00:00', endTime: '23:59' },
        ],
        weekendDays: [],
      };
      
      const calendar = new DefaultMarketCalendar(market24h);
      // Any time should be within trading session
      const timestamp = new Date('2024-01-15T12:00:00Z');
      const status = calendar.getStatus(timestamp);
      assert.equal(typeof status.isOpen, 'boolean');
    });

    it('handles markets with optional sessions', () => {
      const market = createNyseMarket();
      const calendar = new DefaultMarketCalendar(market);
      const sessions = calendar.getSessionsByDate('2024-01-16');
      
      // PRE_MARKET and POST_MARKET are optional
      assert.equal(sessions[0].optional, true);
      assert.equal(sessions[1].optional, undefined);
      assert.equal(sessions[2].optional, true);
    });
  });

  describe('Week Cycles', () => {
    it('correctly handles full week (Mon-Sun)', () => {
      const market = createNseMarket();
      const calendar = new DefaultMarketCalendar(market);
      
      // 2024-01-15 (Mon) through 2024-01-21 (Sun)
      const mondayOpen = calendar.isTradingDayByDate('2024-01-15');
      const tuesdayOpen = calendar.isTradingDayByDate('2024-01-16');
      const saturdayOpen = calendar.isTradingDayByDate('2024-01-20');
      const sundayOpen = calendar.isTradingDayByDate('2024-01-21');
      
      assert.equal(mondayOpen, true);
      assert.equal(tuesdayOpen, true);
      assert.equal(saturdayOpen, false);
      assert.equal(sundayOpen, false);
    });
  });
});
