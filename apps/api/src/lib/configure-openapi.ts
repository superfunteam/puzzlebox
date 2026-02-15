import { apiReference } from '@scalar/hono-api-reference';
import type { OpenAPIHono } from '@hono/zod-openapi';

export function configureOpenApi(app: OpenAPIHono<any>) {
  app.doc('/doc', {
    openapi: '3.1.0',
    info: {
      title: 'Puzzlebox API',
      version: '0.1.0'
    }
  });

  app.get('/reference', apiReference({
    theme: 'elysiajs',
    url: '/doc'
  }));
}
