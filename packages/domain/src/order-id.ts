/**
 * Strongly-typed order identifier.
 * Prevents accidental mixing of order IDs with other string identifiers.
 */
export class OrderId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('OrderId cannot be empty');
    }
  }

  static create(value: string): OrderId {
    return new OrderId(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }
}
