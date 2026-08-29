import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderId } from './order-id.js';

describe('OrderId', () => {
  it('creates a valid id', () => {
    const id = OrderId.create('ord-123');
    assert.equal(id.toString(), 'ord-123');
  });

  it('trims whitespace', () => {
    const id = OrderId.create('  ord-456  ');
    assert.equal(id.toString(), 'ord-456');
  });

  it('rejects empty id', () => {
    assert.throws(() => OrderId.create(''), /cannot be empty/);
    assert.throws(() => OrderId.create('   '), /cannot be empty/);
  });

  it('equals compares value', () => {
    const a = OrderId.create('ord-1');
    const b = OrderId.create('ord-1');
    const c = OrderId.create('ord-2');
    assert.equal(a.equals(b), true);
    assert.equal(a.equals(c), false);
  });
});
