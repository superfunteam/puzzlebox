import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { readHeavyRateLimitMiddleware } from '../../middleware/rate-limit';
import { gamesHandlers } from './games.handlers';

const gameConfigSchema = z.object({
  rounds_per_edition: z.number().int().min(1).max(25),
  partial_credit: z.boolean(),
  share_emoji_correct: z.string(),
  share_emoji_incorrect: z.string(),
  share_emoji_game: z.string(),
  share_url_template: z.string(),
  allow_anonymous: z.boolean()
});

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
              schema: z.object({ games: z.array(z.any()) })
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
              schema: z.object({
                name: z.string(),
                slug: z.string(),
                mode: z.enum(['pick_one', 'ordered_sequence', 'survey']),
                config: gameConfigSchema
              })
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Game created',
          content: {
            'application/json': {
              schema: z.any()
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
              schema: z.any()
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
              schema: z.object({
                name: z.string().optional(),
                active: z.boolean().optional(),
                config: gameConfigSchema.partial().optional()
              })
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Game patched',
          content: {
            'application/json': {
              schema: z.any()
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
              schema: z.any()
            }
          }
        }
      }
    }),
    gamesHandlers.today
  );
}
