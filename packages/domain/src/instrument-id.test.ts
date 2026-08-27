import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InstrumentId } from './instrument-id.js';

describe('InstrumentId', () => {
  it('creates and trims a valid id', () => {
    const id = InstrumentId.create('  NSE:RELIANCE  ');
    assert.equal(id.toString(), 'NSE:RELIANCE');
  });

  it('rejects empty id', () => {
    assert.throws(() => InstrumentId.create(''), /cannot be empty/);
  });

  it('equals by value', () => {
    const a = InstrumentId.create('X');
    const b = InstrumentId.create('X');
    const c = InstrumentId.create('Y');
    assert.equal(a.equals(b), true);
    assert.equal(a.equals(c), false);
  });
});
