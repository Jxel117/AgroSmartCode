import * as service from './admin.service.js';

export async function dashboard(req, res) {
  const data = await service.dashboardData(req.user);
  res.json(data);
}
