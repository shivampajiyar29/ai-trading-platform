/**
 * Future payment adapter boundary. T013 does not verify any payment provider.
 * MOCK / UNIMPLEMENTED.
 */
export interface PaymentProvider {
  readonly name: string;
}

export class UnimplementedPaymentProvider implements PaymentProvider {
  readonly name = 'unimplemented';
}
