import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  apiErrorSchema,
  createGameRequestSchema,
  gameSchema,
  gamesListResponseSchema,
  patchGameRequestSchema,
  todayResponseSchema
} from '../../lib/api-schemas';
import { readHeavyRateLimitMiddleware } from '../../middleware/rate-limit';
import { gamesHandlers } from './games.handlers';

export function registerGamesRoutes(app: OpenAPIHono<any>) {
  app.use('/api/v1/games', readHeavyRateLimitMiddleware);

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/games',
      responses: {
        200: {
          description: 'List games',
          content: {
            'application/json': {
              schema: gamesListResponseSchema
            }
          }
        }
      }
    }),
    gamesHandlers.listGames
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/games',
      request: {
        body: {
          content: {
            'application/json': {
              schema: createGameRequestSchema
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Game created',
          content: {
            'application/json': {
              schema: gameSchema
            }
          }
        },
        409: {
          description: 'Game slug already exists for tenant',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    gamesHandlers.createGame
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/games/{slug}',
      request: {
        params: z.object({ slug: z.string() })
      },
      responses: {
        200: {
          description: 'Game detail',
          content: {
            'application/json': {
              schema: gameSchema
            }
          }
        },
        404: {
          description: 'Game not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    gamesHandlers.getGame
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/v1/games/{slug}',
      request: {
        params: z.object({ slug: z.string() }),
        body: {
          content: {
            'application/json': {
              schema: patchGameRequestSchema
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Game patched',
          content: {
            'application/json': {
              schema: gameSchema
            }
          }
        },
        404: {
          description: 'Game not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    gamesHandlers.patchGame
  );

  app.openapi(
    createRoute({
      method: 'delete',
      path: '/api/v1/games/{slug}',
      request: {
        params: z.object({ slug: z.string() })
      },
      responses: {
        200: {
          description: 'Game soft-deleted',
          content: {
            'application/json': {
              schema: z.object({ id: z.string().uuid(), active: z.boolean() })
            }
          }
        },
        404: {
          description: 'Game not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    gamesHandlers.deleteGame
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/games/{slug}/today',
      request: {
        params: z.object({ slug: z.string() })
      },
      responses: {
        200: {
          description: 'Today edition for a game',
          content: {
            'application/json': {
              schema: todayResponseSchema
            }
          }
        },
        404: {
          description: 'No active edition for today',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    gamesHandlers.today
  );
}
