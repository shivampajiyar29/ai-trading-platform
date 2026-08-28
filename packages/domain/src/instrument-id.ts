/**
 * Provider-neutral instrument identifier.
 * Do not embed a single-exchange symbol format here.
 */
export class InstrumentId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('InstrumentId cannot be empty');
    }
  }

  static create(value: string): InstrumentId {
    return new InstrumentId(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: InstrumentId): boolean {
    return this.value === other.value;
  }
}
