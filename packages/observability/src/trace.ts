export type Span = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startMs: number;
  endMs?: number;
  attributes: Record<string, string>;
};

export class InMemoryTracer {
  readonly spans: Span[] = [];

  constructor(
    private readonly now: () => number = Date.now,
    private readonly id: () => string = () => Math.random().toString(16).slice(2, 10),
  ) {}

  startSpan(name: string, parent?: Span, attributes: Record<string, string> = {}): Span {
    const span: Span = {
      traceId: parent?.traceId ?? this.id(),
      spanId: this.id(),
      name,
      startMs: this.now(),
      attributes: { ...attributes },
    };
    if (parent?.spanId !== undefined) {
      span.parentSpanId = parent.spanId;
    }
    this.spans.push(span);
    return span;
  }

  endSpan(span: Span): void {
    span.endMs = this.now();
  }
}
