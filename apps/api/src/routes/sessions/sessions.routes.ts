import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  apiErrorSchema,
  completeSessionResponseSchema,
  editionNotPlayableSchema,
  playtestCapacitySchema,
  respondRequestSchema,
  respondResponseSchema,
  sessionExistsSchema,
  sessionStateSchema,
  startSessionRequestSchema,
  startSessionResponseSchema
} from '../../lib/api-schemas';
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
              schema: startSessionRequestSchema
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Session created',
          content: {
            'application/json': {
              schema: startSessionResponseSchema
            }
          }
        },
        409: {
          description: 'Session exists or edition is not currently playable',
          content: {
            'application/json': {
              schema: z.union([sessionExistsSchema, editionNotPlayableSchema])
            }
          }
        },
        403: {
          description: 'Playtest capacity reached',
          content: {
            'application/json': {
              schema: z.object({
                error: z.literal('playtest_capacity_reached'),
                max_unique_players: z.number().int(),
                current_unique_players: z.number().int()
              })
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
              schema: sessionStateSchema
            }
          }
        },
        404: {
          description: 'Session not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
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
              schema: respondRequestSchema
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Round response accepted',
          content: {
            'application/json': {
              schema: respondResponseSchema
            }
          }
        },
        404: {
          description: 'Session or edition not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        },
        422: {
          description: 'Answer or round validation failed',
          content: {
            'application/json': {
              schema: apiErrorSchema
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
              schema: completeSessionResponseSchema
            }
          }
        },
        404: {
          description: 'Session or player not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    sessionsHandlers.complete
  );
}
