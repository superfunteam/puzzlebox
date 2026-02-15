import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { editionsHandlers } from './editions.handlers';

const optionSchema = z.object({ key: z.string(), label: z.string() });

const roundPayloadSchema = z.object({
  position: z.number().int().min(1),
  prompt: z.string(),
  options: z.array(optionSchema).min(2),
  correct_answer: z.record(z.unknown()).nullable(),
  metadata: z.record(z.unknown()).nullable().optional()
});

export function registerEditionsRoutes(app: OpenAPIHono<any>) {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/games/{slug}/editions',
      request: {
        params: z.object({ slug: z.string() }),
        body: {
          content: {
            'application/json': {
              schema: z.object({
                edition_date: z.string(),
                status: z.enum(['draft', 'scheduled', 'active', 'archived']),
                publish_at: z.string().nullable().optional(),
                metadata: z.record(z.unknown()).nullable().optional(),
                rounds: z.array(roundPayloadSchema)
              })
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Edition created',
          content: {
            'application/json': {
              schema: z.any()
            }
          }
        }
      }
    }),
    editionsHandlers.createEdition
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/games/{slug}/editions',
      request: {
        params: z.object({ slug: z.string() })
      },
      responses: {
        200: {
          description: 'Edition list',
          content: {
            'application/json': {
              schema: z.object({ editions: z.array(z.any()) })
            }
          }
        }
      }
    }),
    editionsHandlers.listEditions
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/editions/{id}',
      request: {
        params: z.object({ id: z.string().uuid() })
      },
      responses: {
        200: {
          description: 'Edition detail',
          content: {
            'application/json': {
              schema: z.any()
            }
          }
        }
      }
    }),
    editionsHandlers.getEdition
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/v1/editions/{id}',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: {
          content: {
            'application/json': {
              schema: z.object({
                status: z.enum(['draft', 'scheduled', 'active', 'archived']).optional(),
                publish_at: z.string().nullable().optional(),
                metadata: z.record(z.unknown()).nullable().optional()
              })
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Edition patched',
          content: {
            'application/json': {
              schema: z.any()
            }
          }
        }
      }
    }),
    editionsHandlers.patchEdition
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/editions/{id}/publish',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: {
          description: 'Edition published',
          content: {
            'application/json': {
              schema: z.any()
            }
          }
        }
      }
    }),
    editionsHandlers.publishEdition
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/v1/editions/{id}/archive',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: {
          description: 'Edition archived',
          content: {
            'application/json': {
              schema: z.any()
            }
          }
        }
      }
    }),
    editionsHandlers.archiveEdition
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/v1/editions/{id}/rounds',
      request: {
        params: z.object({ id: z.string().uuid() })
      },
      responses: {
        200: {
          description: 'Round list',
          content: {
            'application/json': {
              schema: z.object({ rounds: z.array(z.any()) })
            }
          }
        }
      }
    }),
    editionsHandlers.listRounds
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/v1/rounds/{id}',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: {
          content: {
            'application/json': {
              schema: z.object({
                prompt: z.string().optional(),
                options: z.array(optionSchema).optional(),
                correct_answer: z.record(z.unknown()).nullable().optional(),
                metadata: z.record(z.unknown()).nullable().optional()
              })
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Round patched',
          content: {
            'application/json': {
              schema: z.any()
            }
          }
        }
      }
    }),
    editionsHandlers.patchRound
  );

  app.openapi(
    createRoute({
      method: 'delete',
      path: '/api/v1/rounds/{id}',
      request: {
        params: z.object({ id: z.string().uuid() })
      },
      responses: {
        200: {
          description: 'Round deleted',
          content: {
            'application/json': {
              schema: z.object({ id: z.string().uuid(), deleted: z.boolean() })
            }
          }
        }
      }
    }),
    editionsHandlers.deleteRound
  );
}
