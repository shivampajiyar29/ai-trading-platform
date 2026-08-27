export type GatewayConfig = {
  serviceName: string;
  version: string;
  tradingMode: 'paper' | 'live';
  liveTradingEnabled: boolean;
  killSwitchActive: boolean;
};

export type GatewayRequest = {
  method: string;
  path: string;
  headers?: Record<string, string | undefined>;
};

export type GatewayResponse = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
};

function header(headers: Record<string, string | undefined> | undefined, name: string): string | undefined {
  if (!headers) {
    return undefined;
  }
  const direct = headers[name];
  if (direct !== undefined) {
    return direct;
  }
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }
  return undefined;
}

function correlationIdFrom(req: GatewayRequest): string {
  const incoming = header(req.headers, 'x-correlation-id')?.trim();
  if (incoming) {
    return incoming;
  }
  return `corr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function json(
  status: number,
  body: unknown,
  correlationId: string,
): GatewayResponse {
  return {
    status,
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': correlationId,
    },
    body,
  };
}

/**
 * Minimal API kernel. No broker, market-data, or order routes.
 */
export function handleRequest(req: GatewayRequest, config: GatewayConfig): GatewayResponse {
  const correlationId = correlationIdFrom(req);
  const method = req.method.toUpperCase();
  const path = req.path.split('?')[0] ?? req.path;

  if (method === 'GET' && path === '/health') {
    return json(
      200,
      {
        status: 'ok',
        service: config.serviceName,
        version: config.version,
        liveTradingEnabled: config.liveTradingEnabled,
      },
      correlationId,
    );
  }

  if (method === 'GET' && path === '/ready') {
    return json(
      200,
      {
        status: 'ok',
        tradingMode: config.tradingMode,
        liveTradingEnabled: config.liveTradingEnabled,
        killSwitchActive: config.killSwitchActive,
      },
      correlationId,
    );
  }

  if (method === 'GET' && path === '/v1/execution/policy') {
    return json(
      200,
      {
        requestedMode: config.tradingMode,
        liveTradingEnabled: config.liveTradingEnabled,
        killSwitchActive: config.killSwitchActive,
        paperIsolatedFromLive: true,
      },
      correlationId,
    );
  }

  return json(
    404,
    {
      error: {
        code: 'NOT_FOUND',
        message: `No route for ${method} ${path}`,
      },
    },
    correlationId,
  );
}
