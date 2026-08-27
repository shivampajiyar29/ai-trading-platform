/**
 * Immutable money value object.
 * Amounts are stored as integer minor units (e.g. cents) to avoid floating-point drift
 * in financial calculations.
 */
export class Money {
  private constructor(
    private readonly minorUnits: bigint,
    private readonly currencyCode: string,
  ) {
    if (currencyCode.length !== 3) {
      throw new Error(`Invalid currency code: ${currencyCode}`);
    }
  }

  static fromMinorUnits(minorUnits: bigint | number, currency: string): Money {
    return new Money(BigInt(minorUnits), currency.toUpperCase());
  }

  static zero(currency: string): Money {
    return Money.fromMinorUnits(0n, currency);
  }

  get amountMinor(): bigint {
    return this.minorUnits;
  }

  get currency(): string {
    return this.currencyCode;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits + other.minorUnits, this.currencyCode);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits - other.minorUnits, this.currencyCode);
  }

  isZero(): boolean {
    return this.minorUnits === 0n;
  }

  isPositive(): boolean {
    return this.minorUnits > 0n;
  }

  isNegative(): boolean {
    return this.minorUnits < 0n;
  }

  equals(other: Money): boolean {
    return this.minorUnits === other.minorUnits && this.currencyCode === other.currencyCode;
  }

  toString(): string {
    return `${this.minorUnits} ${this.currencyCode}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currencyCode !== other.currencyCode) {
      throw new Error(
        `Currency mismatch: ${this.currencyCode} vs ${other.currencyCode}`,
      );
    }
  }
}
