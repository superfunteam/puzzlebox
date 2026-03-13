import { apiReference } from '@scalar/hono-api-reference';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { openApiDocument } from './openapi-document';

export function configureOpenApi(app: OpenAPIHono<any>) {
  app.doc31('/doc', openApiDocument);

  app.get('/reference', apiReference({
    theme: 'elysiajs',
    url: '/doc'
  }));
}
