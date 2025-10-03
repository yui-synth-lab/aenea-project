/**
 * API Routes: Dialogue System
 *
 * POST /api/dialogue - Submit human message and get Aenea's response
 * GET /api/dialogue/history - Get dialogue history
 * GET /api/dialogue/memories - Get dialogue memories
 */

import { Router, Request, Response } from 'express';
import { DialogueHandler } from '../dialogue-handler.js';
import { DatabaseManager } from '../database-manager.js';
import { createAIExecutor } from '../ai-executor.js';
import { aeneaConfig } from '../../aenea/agents/aenea.js';

let dialogueHandler: DialogueHandler | null = null;

export function initializeDialogueRoutes(db: DatabaseManager): void {
  // Use Aenea agent configuration for dialogue
  const aiExecutor = createAIExecutor(
    aeneaConfig.id,
    {
      provider: aeneaConfig.provider as any,
      model: aeneaConfig.model
    }
  );
  dialogueHandler = new DialogueHandler(db, aiExecutor);
}

export function createDialogueRoutes(): Router {
  const router = Router();

  /**
   * POST /api/dialogue
   * Submit human message and get Aenea's response
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Message is required and must be a string'
        });
      }

      if (!dialogueHandler) {
        return res.status(500).json({
          success: false,
          error: 'Dialogue handler not initialized'
        });
      }

      // Process dialogue
      const response = await dialogueHandler.handleDialogue(message);

      res.json({
        success: true,
        dialogue: {
          humanMessage: message,
          immediateReaction: response.immediate,
          response: response.main,
          newQuestion: response.newQuestion,
          emotionalState: response.emotionalState,
          timestamp: Date.now()
        }
      });
    } catch (error: any) {
      console.error('Dialogue processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Processing failed',
        message: error.message
      });
    }
  });

  /**
   * GET /api/dialogue/history
   * Get dialogue history
   */
  router.get('/history', async (req: Request, res: Response) => {
    try {
      if (!dialogueHandler) {
        return res.status(500).json({
          success: false,
          error: 'Dialogue handler not initialized'
        });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Get dialogues from database via dialogue handler's db
      const db = (dialogueHandler as any).db as DatabaseManager;
      const dialogues = db.getRecentDialogues(limit, offset);
      const total = db.countDialogues();

      res.json({
        success: true,
        dialogues: dialogues.map(d => ({
          id: d.id,
          humanMessage: d.human_message,
          aeneaResponse: d.aenea_response,
          immediateReaction: d.immediate_reaction,
          newQuestion: d.new_question,
          emotionalState: d.emotional_state,
          timestamp: d.timestamp
        })),
        total,
        hasMore: (offset + dialogues.length) < total
      });
    } catch (error: any) {
      console.error('History retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Retrieval failed',
        message: error.message
      });
    }
  });

  /**
   * GET /api/dialogue/memories
   * Get dialogue memories (summarized)
   */
  router.get('/memories', async (req: Request, res: Response) => {
    try {
      if (!dialogueHandler) {
        return res.status(500).json({
          success: false,
          error: 'Dialogue handler not initialized'
        });
      }

      const limit = parseInt(req.query.limit as string) || 10;

      // Get memories from database
      const db = (dialogueHandler as any).db as DatabaseManager;
      const memories = db.getRecentDialogueMemories(limit);

      res.json({
        success: true,
        memories: memories.map(m => ({
          id: m.id,
          dialogueId: m.dialogue_id,
          memorySummary: m.memory_summary,
          topics: m.topics ? JSON.parse(m.topics) : [],
          importance: m.importance,
          timestamp: m.timestamp
        }))
      });
    } catch (error: any) {
      console.error('Memories retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Retrieval failed',
        message: error.message
      });
    }
  });

  return router;
}

export default createDialogueRoutes;
