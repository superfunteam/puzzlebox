import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { respondRateLimitMiddleware } from '../../middleware/rate-limit';
import { sessionsHandlers } from './sessions.handlers';

export function registerSessionsRoutes(app: OpenAPIHono<any>) {
  app.use('/api/v1/sessions/*/respond', respondRateLimitMiddleware);

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/sessions',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({ edition_id: z.string().uuid() })
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Session created',
          content: {
            'application/json': {
              schema: z.object({ session_id: z.string().uuid(), started_at: z.string() })
            }
          }
        },
        409: {
          description: 'Session exists',
          content: {
            'application/json': {
              schema: z.object({ error: z.string(), existing_session: z.any() })
            }
          }
        }
      }
    }),
    sessionsHandlers.start
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/sessions/{id}',
      request: {
        params: z.object({ id: z.string().uuid() })
      },
      responses: {
        200: {
          description: 'Session detail',
          content: {
            'application/json': {
              schema: z.any()
            }
          }
        }
      }
    }),
    sessionsHandlers.getSession
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/sessions/{id}/respond',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: {
          content: {
            'application/json': {
              schema: z.object({
                round_id: z.string().uuid(),
                answer: z.record(z.string(), z.unknown())
              })
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Round response accepted',
          content: {
            'application/json': {
              schema: z.any()
            }
          }
        }
      }
    }),
    sessionsHandlers.respond
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/sessions/{id}/complete',
      request: {
        params: z.object({ id: z.string().uuid() })
      },
      responses: {
        200: {
          description: 'Session completed',
          content: {
            'application/json': {
              schema: z.any()
            }
          }
        }
      }
    }),
    sessionsHandlers.complete
  );
}
