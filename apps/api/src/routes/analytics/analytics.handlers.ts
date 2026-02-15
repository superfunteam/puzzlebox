import { requireAdmin } from '../../lib/authz';
import { getEditionAnalytics, getGameAnalytics, getOverview } from '../../services/analytics';

export const analyticsHandlers = {
  overview(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    return c.json(getOverview(tenant.id));
  },

  game(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const slug = c.req.param('slug');
    const analytics = getGameAnalytics(tenant.id, slug);
    if (!analytics) return c.json({ error: 'not_found' }, 404);
    return c.json(analytics);
  },

  edition(c: any) {
    const admin = requireAdmin(c);
    if (!admin.ok) return admin.response;

    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const analytics = getEditionAnalytics(tenant.id, id);
    if (!analytics) return c.json({ error: 'not_found' }, 404);
    return c.json(analytics);
  }
};
