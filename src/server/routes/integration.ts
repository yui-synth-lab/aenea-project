import { Router } from 'express';

const router = Router();

// GET /api/integration/bridge-status
router.get('/bridge-status', (_req, res) => {
	res.json({ status: 'initializing', lastCheck: Date.now() });
});

// GET /api/integration/yui-agents
router.get('/yui-agents', (_req, res) => {
	res.json({ agents: [], total: 0 });
});

export default router;




