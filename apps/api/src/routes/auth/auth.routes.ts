import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { authHandlers } from './auth.handlers';
import { loginRateLimitMiddleware } from '../../middleware/rate-limit';
import { tenantMiddleware } from '../../middleware/tenant';

export function registerAuthRoutes(app: OpenAPIHono<any>) {
  app.use('/api/v1/auth/*', tenantMiddleware);
  app.use('/api/v1/auth/magic-link', loginRateLimitMiddleware);
  app.use('/api/v1/auth/verify', loginRateLimitMiddleware);
  app.use('/api/v1/auth/anonymous', loginRateLimitMiddleware);

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/auth/magic-link',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({ email: z.string().email() })
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Magic link queued',
          content: {
            'application/json': {
              schema: z.object({
                message: z.string(),
                expires_in: z.number(),
                token_preview: z.string().uuid()
              })
            }
          }
        }
      }
    }),
    authHandlers.magicLink
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/auth/verify',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({ token: z.string().uuid() })
            }
          }
        }
      },
      responses: {
        200: {
          description: 'JWT issued',
          content: {
            'application/json': {
              schema: z.object({
                player_id: z.string().uuid(),
                jwt: z.string(),
                expires_at: z.string()
              })
            }
          }
        }
      }
    }),
    authHandlers.verify
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/auth/anonymous',
      request: {
        body: {
          required: false,
          content: {
            'application/json': {
              schema: z
                .object({
                  timezone: z.string().optional(),
                  device_fingerprint: z.string().optional()
                })
                .optional()
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Anonymous JWT issued',
          content: {
            'application/json': {
              schema: z.object({
                player_id: z.string().uuid(),
                jwt: z.string(),
                anonymous: z.boolean(),
                expires_at: z.string()
              })
            }
          }
        }
      }
    }),
    authHandlers.anonymous
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/auth/claim',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                anonymous_jwt: z.string(),
                authenticated_jwt: z.string()
              })
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Anonymous account merged',
          content: {
            'application/json': {
              schema: z.object({
                player_id: z.string().uuid(),
                sessions_merged: z.number().int()
              })
            }
          }
        }
      }
    }),
    authHandlers.claim
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/auth/external',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({ external_token: z.string().min(1) })
            }
          }
        }
      },
      responses: {
        200: {
          description: 'External auth JWT issued',
          content: {
            'application/json': {
              schema: z.object({
                player_id: z.string().uuid(),
                jwt: z.string(),
                expires_at: z.string()
              })
            }
          }
        }
      }
    }),
    authHandlers.external
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/auth/oauth/{provider}/start',
      request: {
        params: z.object({ provider: z.string().min(1) })
      },
      responses: {
        501: {
          description: 'OAuth start not enabled in baseline',
          content: {
            'application/json': {
              schema: z.object({ provider: z.string(), message: z.string() })
            }
          }
        }
      }
    }),
    authHandlers.oauthStart
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/auth/oauth/{provider}/callback',
      request: {
        params: z.object({ provider: z.string().min(1) })
      },
      responses: {
        501: {
          description: 'OAuth callback not enabled in baseline',
          content: {
            'application/json': {
              schema: z.object({ provider: z.string(), message: z.string() })
            }
          }
        }
      }
    }),
    authHandlers.oauthCallback
  );
}
