import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Money } from './money.js';

describe('Money', () => {
  it('creates from minor units', () => {
    const m = Money.fromMinorUnits(10050n, 'USD');
    assert.equal(m.amountMinor, 10050n);
    assert.equal(m.currency, 'USD');
  });

  it('normalizes currency to uppercase', () => {
    const m = Money.fromMinorUnits(100n, 'usd');
    assert.equal(m.currency, 'USD');
  });

  it('rejects invalid currency length', () => {
    assert.throws(() => Money.fromMinorUnits(0n, 'US'), /Invalid currency/);
  });

  it('adds same-currency amounts', () => {
    const a = Money.fromMinorUnits(100n, 'USD');
    const b = Money.fromMinorUnits(50n, 'USD');
    const sum = a.add(b);
    assert.equal(sum.amountMinor, 150n);
    assert.equal(sum.currency, 'USD');
  });

  it('rejects currency mismatch on add', () => {
    const a = Money.fromMinorUnits(100n, 'USD');
    const b = Money.fromMinorUnits(50n, 'EUR');
    assert.throws(() => a.add(b), /Currency mismatch/);
  });

  it('subtracts correctly', () => {
    const a = Money.fromMinorUnits(100n, 'USD');
    const b = Money.fromMinorUnits(30n, 'USD');
    assert.equal(a.subtract(b).amountMinor, 70n);
  });

  it('detects zero / positive / negative', () => {
    assert.equal(Money.zero('USD').isZero(), true);
    assert.equal(Money.fromMinorUnits(1n, 'USD').isPositive(), true);
    assert.equal(Money.fromMinorUnits(-1n, 'USD').isNegative(), true);
  });

  it('equals compares value and currency', () => {
    const a = Money.fromMinorUnits(100n, 'USD');
    const b = Money.fromMinorUnits(100n, 'USD');
    const c = Money.fromMinorUnits(100n, 'EUR');
    assert.equal(a.equals(b), true);
    assert.equal(a.equals(c), false);
  });
});
