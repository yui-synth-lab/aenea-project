/**
 * API Routes: Stimulus-Response System
 *
 * POST /api/stimulus - Submit external stimulus
 * GET /api/response/:cycleId - Get observable response
 * GET /api/dialogue/history - Get dialogue history
 */

import { Router, Request, Response } from 'express';
import ConsciousnessBackend from '../consciousness-backend.js';

export function createStimulusRoutes(consciousnessBackend: ConsciousnessBackend): Router {
  const router = Router();

  /**
   * POST /api/stimulus
   * Submit external stimulus (human question, environmental trigger, etc.)
   */
  router.post('/stimulus', async (req: Request, res: Response) => {
    try {
      const { content, source = 'human', metadata = {} } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Content is required and must be a string'
        });
      }

      // Process stimulus through consciousness backend
      const result = await consciousnessBackend.processStimulus({
        source,
        content,
        metadata
      });

      res.json({
        success: true,
        stimulusId: result.stimulusId,
        thoughtCycleId: result.thoughtCycleId,
        message: '刺激を受容しました。処理を開始します。'
      });
    } catch (error: any) {
      console.error('Stimulus processing error:', error);
      res.status(500).json({
        error: 'Processing failed',
        message: error.message
      });
    }
  });

  /**
   * GET /api/response/:cycleId
   * Get observable response for a thought cycle
   */
  router.get('/response/:cycleId', async (req: Request, res: Response) => {
    try {
      const { cycleId } = req.params;

      const observableResponse = await consciousnessBackend.getObservableResponse(cycleId);

      if (!observableResponse) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Observable response not found for this cycle ID'
        });
      }

      res.json({
        success: true,
        response: observableResponse
      });
    } catch (error: any) {
      console.error('Response retrieval error:', error);
      res.status(500).json({
        error: 'Retrieval failed',
        message: error.message
      });
    }
  });

  /**
   * GET /api/dialogue/history
   * Get dialogue history (interactions with human)
   */
  router.get('/dialogue/history', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await consciousnessBackend.getDialogueHistory(limit, offset);

      res.json({
        success: true,
        history,
        count: history.length,
        limit,
        offset
      });
    } catch (error: any) {
      console.error('History retrieval error:', error);
      res.status(500).json({
        error: 'Retrieval failed',
        message: error.message
      });
    }
  });

  /**
   * GET /api/dialogue/latest
   * Get latest observable response (for polling)
   */
  router.get('/dialogue/latest', async (req: Request, res: Response) => {
    try {
      const latest = await consciousnessBackend.getLatestObservableResponse();

      if (!latest) {
        return res.status(404).json({
          error: 'Not found',
          message: 'No observable responses yet'
        });
      }

      res.json({
        success: true,
        response: latest
      });
    } catch (error: any) {
      console.error('Latest response retrieval error:', error);
      res.status(500).json({
        error: 'Retrieval failed',
        message: error.message
      });
    }
  });

  return router;
}

export default createStimulusRoutes;
