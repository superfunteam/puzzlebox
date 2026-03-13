import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  analyticsOverviewSchema,
  apiErrorSchema,
  editionAnalyticsSchema,
  gameAnalyticsSchema
} from '../../lib/api-schemas';
import { analyticsHandlers } from './analytics.handlers';

export function registerAnalyticsRoutes(app: OpenAPIHono<any>) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/analytics/overview',
      responses: {
        200: {
          description: 'Overview analytics',
          content: {
            'application/json': {
              schema: analyticsOverviewSchema
            }
          }
        }
      }
    }),
    analyticsHandlers.overview
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/games/{slug}/analytics',
      request: {
        params: z.object({ slug: z.string() })
      },
      responses: {
        200: {
          description: 'Game analytics',
          content: {
            'application/json': {
              schema: gameAnalyticsSchema
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
    analyticsHandlers.game
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/editions/{id}/analytics',
      request: {
        params: z.object({ id: z.string().uuid() })
      },
      responses: {
        200: {
          description: 'Edition analytics',
          content: {
            'application/json': {
              schema: editionAnalyticsSchema
            }
          }
        },
        404: {
          description: 'Edition not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    analyticsHandlers.edition
  );
}
