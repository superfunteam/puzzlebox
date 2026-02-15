import { createRouter } from './lib/create-router';
import { configureOpenApi } from './lib/configure-openapi';
import { tenantMiddleware } from './middleware/tenant';
import { registerAnalyticsRoutes } from './routes/analytics/analytics.routes';
import { registerAuthRoutes } from './routes/auth/auth.routes';
import { registerEditionsRoutes } from './routes/editions/editions.routes';
import { registerGamesRoutes } from './routes/games/games.routes';
import { registerPlayersRoutes } from './routes/players/players.routes';
import { registerSessionsRoutes } from './routes/sessions/sessions.routes';

export function buildApp() {
  const app = createRouter();

  app.get('/healthz', (c) => c.json({ ok: true }));

  app.use('/api/v1/*', tenantMiddleware);

  registerAuthRoutes(app);
  registerGamesRoutes(app);
  registerEditionsRoutes(app);
  registerSessionsRoutes(app);
  registerPlayersRoutes(app);
  registerAnalyticsRoutes(app);

  configureOpenApi(app);

  return app;
}
