import { requireAdmin } from '../../lib/authz';
import { getEditionAnalytics, getGameAnalytics, getOverview } from '../../services/analytics';

export const analyticsHandlers = {
  async overview(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    return c.json(await getOverview(tenant.id));
  },

  async game(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const analytics = await getGameAnalytics(tenant.id, slug);
    if (!analytics) return c.json({ error: 'not_found' }, 404);
    return c.json(analytics);
  },

  async edition(c: any) {
    const admin = await requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const analytics = await getEditionAnalytics(tenant.id, id);
    if (!analytics) return c.json({ error: 'not_found' }, 404);
    return c.json(analytics);
  }
};
