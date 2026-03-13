import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  apiErrorSchema,
  deleteResponseSchema,
  patchMeRequestSchema,
  playerListResponseSchema,
  playerSchema,
  playerStatsSchema
} from '../../lib/api-schemas';
import { readHeavyRateLimitMiddleware } from '../../middleware/rate-limit';
import { playersHandlers } from './players.handlers';

export function registerPlayersRoutes(app: OpenAPIHono<any>) {
  app.use('/api/v1/players', readHeavyRateLimitMiddleware);

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/players',
      responses: {
        200: {
          description: 'List players',
          content: {
            'application/json': {
              schema: playerListResponseSchema
            }
          }
        }
      }
    }),
    playersHandlers.listPlayers
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/players/{id}',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: {
          description: 'Get player',
          content: {
            'application/json': {
              schema: playerSchema
            }
          }
        },
        404: {
          description: 'Player not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    playersHandlers.getPlayer
  );

  app.openapi(
    createRoute({
      method: 'delete',
      path: '/api/v1/players/{id}',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: {
          description: 'Delete player',
          content: {
            'application/json': {
              schema: deleteResponseSchema
            }
          }
        },
        404: {
          description: 'Player not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    playersHandlers.deletePlayer
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/me/stats',
      responses: {
        200: {
          description: 'Player stats',
          content: {
            'application/json': {
              schema: playerStatsSchema
            }
          }
        }
      }
    }),
    playersHandlers.myStats
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/v1/me',
      request: {
        body: {
          content: {
            'application/json': {
              schema: patchMeRequestSchema
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Player patched',
          content: {
            'application/json': {
              schema: playerSchema
            }
          }
        },
        404: {
          description: 'Player not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    playersHandlers.patchMe
  );
}
