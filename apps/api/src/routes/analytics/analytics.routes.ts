import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
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
              schema: z.any()
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
              schema: z.any()
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
              schema: z.any()
            }
          }
        }
      }
    }),
    analyticsHandlers.edition
  );
}
