import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings } from './types';

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: 'validation_error',
            details: result.error.issues
          },
          422
        );
      }
    }
  });
}
