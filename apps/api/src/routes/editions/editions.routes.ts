import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  apiErrorSchema,
  createEditionRequestSchema,
  createEditionResponseSchema,
  deleteResponseSchema,
  editionDetailSchema,
  editionListResponseSchema,
  editionSchema,
  optionSchema,
  patchEditionRequestSchema,
  roundAdminSchema,
  roundPatchRequestSchema
} from '../../lib/api-schemas';
import { editionsHandlers } from './editions.handlers';

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
              schema: createEditionRequestSchema
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Edition created',
          content: {
            'application/json': {
              schema: createEditionResponseSchema
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
        },
        409: {
          description: 'Edition already exists for this game and date',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        },
        422: {
          description: 'Edition payload violates game invariants',
          content: {
            'application/json': {
              schema: apiErrorSchema
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
              schema: editionListResponseSchema
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
              schema: editionDetailSchema
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
              schema: patchEditionRequestSchema
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Edition patched',
          content: {
            'application/json': {
              schema: editionSchema
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
              schema: editionSchema
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
              schema: editionSchema
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
              schema: z.object({ rounds: z.array(roundAdminSchema) })
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
              schema: roundPatchRequestSchema
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Round patched',
          content: {
            'application/json': {
              schema: roundAdminSchema
            }
          }
        },
        404: {
          description: 'Round not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        },
        409: {
          description: 'Round can only be changed while edition is in draft',
          content: {
            'application/json': {
              schema: apiErrorSchema
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
              schema: deleteResponseSchema
            }
          }
        },
        404: {
          description: 'Round not found',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        },
        409: {
          description: 'Round can only be changed while edition is in draft',
          content: {
            'application/json': {
              schema: apiErrorSchema
            }
          }
        }
      }
    }),
    editionsHandlers.deleteRound
  );
}
