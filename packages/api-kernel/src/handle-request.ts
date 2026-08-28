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
  body?: unknown;
};

export type GatewayResponse = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
};

export type GatewayPrincipal = {
  id: string;
  role: 'anonymous' | 'user' | 'admin';
};

export type GatewayPermission = 'public:read' | 'account:read' | 'account:write' | 'admin:read';

export type GatewayUsers = {
  getProfile(userId: string): unknown;
  updateProfile(userId: string, patch: unknown): unknown;
  getSettings(userId: string): unknown;
  updateSettings(userId: string, patch: unknown): unknown;
};

export type GatewayEntitlements = {
  getEntitlements(userId: string): unknown;
};

export type GatewayAuth = {
  authenticate(authorizationHeader: string | undefined): GatewayPrincipal;
  can(principal: GatewayPrincipal, permission: GatewayPermission): boolean;
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

function requiredPermission(method: string, path: string): GatewayPermission | undefined {
  if (
    method === 'GET' &&
    (path === '/v1/me' || path === '/v1/profile' || path === '/v1/settings' || path === '/v1/entitlements')
  ) {
    return 'account:read';
  }
  if (method === 'PATCH' && (path === '/v1/profile' || path === '/v1/settings')) {
    return 'account:write';
  }
  if (
    (method === 'PATCH' || method === 'POST' || method === 'PUT') &&
    (path === '/v1/entitlements' || path === '/v1/subscription')
  ) {
    return 'account:write';
  }
  if (method === 'GET' && path === '/v1/admin/status') {
    return 'admin:read';
  }
  return undefined;
}

function authErrorBody(
  err: unknown,
  fallbackCode: string,
  fallbackMessage: string,
  fallbackStatus: number,
): { status: number; code: string; message: string } {
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    'status' in err &&
    'message' in err &&
    typeof (err as { code: unknown }).code === 'string' &&
    typeof (err as { status: unknown }).status === 'number' &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return {
      status: (err as { status: number }).status,
      code: (err as { code: string }).code,
      message: (err as { message: string }).message,
    };
  }
  return { status: fallbackStatus, code: fallbackCode, message: fallbackMessage };
}

/**
 * Minimal API kernel. No broker, market-data, or order routes.
 * Protected routes require an injected GatewayAuth port.
 */
export function handleRequest(
  req: GatewayRequest,
  config: GatewayConfig,
  auth?: GatewayAuth,
  users?: GatewayUsers,
  entitlements?: GatewayEntitlements,
): GatewayResponse {
  const correlationId = correlationIdFrom(req);
  const method = req.method.toUpperCase();
  const path = req.path.split('?')[0] ?? req.path;
  const permission = requiredPermission(method, path);

  let principal: GatewayPrincipal = { id: 'anonymous', role: 'anonymous' };
  if (permission) {
    if (!auth) {
      return json(
        401,
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        correlationId,
      );
    }
    try {
      principal = auth.authenticate(header(req.headers, 'authorization'));
    } catch (err) {
      const parsed = authErrorBody(err, 'UNAUTHORIZED', 'Authentication required', 401);
      return json(parsed.status, { error: { code: parsed.code, message: parsed.message } }, correlationId);
    }
    if (principal.role === 'anonymous') {
      return json(
        401,
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        correlationId,
      );
    }
    if (!auth.can(principal, permission)) {
      return json(
        403,
        {
          error: {
            code: 'FORBIDDEN',
            message: `Missing permission: ${permission}`,
          },
        },
        correlationId,
      );
    }
  }

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

  if (method === 'GET' && path === '/v1/me') {
    return json(
      200,
      {
        id: principal.id,
        role: principal.role,
      },
      correlationId,
    );
  }

  if (path === '/v1/profile' || path === '/v1/settings') {
    if (!users) {
      return json(
        500,
        { error: { code: 'PERSISTENCE_FAILURE', message: 'User directory is not configured' } },
        correlationId,
      );
    }
    try {
      if (method === 'GET' && path === '/v1/profile') {
        return json(200, users.getProfile(principal.id), correlationId);
      }
      if (method === 'PATCH' && path === '/v1/profile') {
        return json(200, users.updateProfile(principal.id, req.body), correlationId);
      }
      if (method === 'GET' && path === '/v1/settings') {
        return json(200, users.getSettings(principal.id), correlationId);
      }
      if (method === 'PATCH' && path === '/v1/settings') {
        return json(200, users.updateSettings(principal.id, req.body), correlationId);
      }
    } catch (err) {
      const parsed = authErrorBody(err, 'INVALID_INPUT', 'Invalid request', 400);
      return json(parsed.status, { error: { code: parsed.code, message: parsed.message } }, correlationId);
    }
  }

  if (path === '/v1/entitlements' || path === '/v1/subscription') {
    if (method === 'PATCH' || method === 'POST' || method === 'PUT') {
      return json(
        405,
        {
          error: {
            code: 'NOT_WRITABLE',
            message: 'Subscription and entitlements cannot be changed through this API',
          },
        },
        correlationId,
      );
    }
    if (method === 'GET' && path === '/v1/entitlements') {
      if (!entitlements) {
        return json(
          500,
          { error: { code: 'PERSISTENCE_FAILURE', message: 'Entitlement directory is not configured' } },
          correlationId,
        );
      }
      try {
        return json(200, entitlements.getEntitlements(principal.id), correlationId);
      } catch (err) {
        const parsed = authErrorBody(err, 'INVALID_INPUT', 'Invalid request', 400);
        return json(parsed.status, { error: { code: parsed.code, message: parsed.message } }, correlationId);
      }
    }
  }

  if (method === 'GET' && path === '/v1/admin/status') {
    return json(
      200,
      {
        service: config.serviceName,
        role: principal.role,
        liveTradingEnabled: config.liveTradingEnabled,
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
