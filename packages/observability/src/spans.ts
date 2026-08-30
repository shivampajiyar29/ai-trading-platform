export type SpanEvent = {
  name: string;
  timestamp: string;
  attributes?: Record<string, string>;
};

export type Span = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startMs: number;
  endMs?: number;
  attributes: Record<string, string>;
  events: SpanEvent[];
  addTag(key: string, value: string): void;
  addEvent(name: string, attributes?: Record<string, string>): void;
  end(): void;
};

export class InMemorySpan implements Span {
  endMs?: number;
  parentSpanId?: string;
  readonly events: SpanEvent[] = [];

  constructor(
    readonly traceId: string,
    readonly spanId: string,
    readonly name: string,
    readonly startMs: number,
    readonly attributes: Record<string, string> = {},
    parentSpanId?: string,
    private readonly clock: () => number = Date.now,
    private readonly iso: () => string = () => new Date().toISOString(),
  ) {
    if (parentSpanId !== undefined) {
      this.parentSpanId = parentSpanId;
    }
  }

  addTag(key: string, value: string): void {
    this.attributes[key] = value;
  }

  addEvent(name: string, attributes?: Record<string, string>): void {
    const event: SpanEvent = { name, timestamp: this.iso() };
    if (attributes) {
      event.attributes = { ...attributes };
    }
    this.events.push(event);
  }

  end(): void {
    this.endMs = this.clock();
  }
}

export class TraceProvider {
  readonly spans: InMemorySpan[] = [];

  constructor(
    private readonly clock: () => number = Date.now,
    private readonly id: () => string = () => Math.random().toString(16).slice(2, 18),
  ) {}

  startSpan(name: string, parent?: Span, attributes: Record<string, string> = {}): InMemorySpan {
    const span = new InMemorySpan(
      parent?.traceId ?? this.id(),
      this.id(),
      name,
      this.clock(),
      { ...attributes },
      parent?.spanId,
      this.clock,
    );
    this.spans.push(span);
    return span;
  }
}
