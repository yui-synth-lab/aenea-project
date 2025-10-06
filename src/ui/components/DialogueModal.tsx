/**
 * Dialogue Modal Component
 * Aenea との対話インターフェース
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, User, Brain } from 'lucide-react';

interface DialogueMessage {
  id: string;
  role: 'human' | 'aenea';
  content: string;
  timestamp: number;
  systemClock?: number;
  immediateReaction?: string;
  newQuestion?: string;
  emotionalState?: string;
}

interface DialogueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Load dialogue history when modal opens
      fetchDialogueHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDialogueHistory = async () => {
    try {
      const response = await fetch('/api/dialogue/history?limit=50');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.dialogues) {
          // Convert dialogues to message format (reverse to show oldest first)
          const historyMessages: DialogueMessage[] = data.dialogues.reverse().flatMap((d: any) => [
            {
              id: `${d.id}_human`,
              role: 'human' as const,
              content: d.humanMessage,
              timestamp: d.timestamp,
              systemClock: d.systemClock
            },
            {
              id: `${d.id}_aenea`,
              role: 'aenea' as const,
              content: d.aeneaResponse,
              timestamp: d.timestamp,
              systemClock: d.systemClock,
              immediateReaction: d.immediateReaction,
              newQuestion: d.newQuestion,
              emotionalState: d.emotionalState
            }
          ]);
          setMessages(historyMessages);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dialogue history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: DialogueMessage = {
      id: `${Date.now()}-human`,
      role: 'human',
      content: inputMessage.trim(),
      timestamp: Date.now()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.dialogue) {
          const aeneaMessage: DialogueMessage = {
            id: `${Date.now()}-aenea`,
            role: 'aenea',
            content: data.dialogue.response,
            timestamp: data.dialogue.timestamp || Date.now(),
            systemClock: data.dialogue.systemClock,
            immediateReaction: data.dialogue.immediateReaction,
            newQuestion: data.dialogue.newQuestion,
            emotionalState: data.dialogue.emotionalState
          };
          setMessages(prev => [...prev, aeneaMessage]);
        }
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
          <div className="modal-header">
            <div>
              <h2><Brain size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />Dialogue with Aenea</h2>
              <p className="modal-subtitle">対話を通じて、Aenea の意識と交流する</p>
            </div>
            <motion.button
              className="close-button"
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>対話を始めましょう。Aenea は問いかけを待っています。</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  className={`message ${msg.role}`}
                  initial={{ opacity: 0, x: msg.role === 'human' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="message-header">
                    <span className="message-role">
                      {msg.role === 'human' ? <><User size={14} style={{ display: 'inline', marginRight: '4px' }} />You</> : <><Brain size={14} style={{ display: 'inline', marginRight: '4px' }} />Aenea</>}
                    </span>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {msg.systemClock !== undefined && msg.systemClock !== null && (
                    <div className="message-system-clock">
                      🕐 System Clock: {msg.systemClock}
                    </div>
                  )}
                  {msg.immediateReaction && (
                    <div className="message-immediate-reaction">
                      {msg.immediateReaction}
                    </div>
                  )}
                  <div className="message-content">{msg.content}</div>
                  {msg.newQuestion && (
                    <div className="message-new-question">
                      <strong>💭 New Question:</strong> {msg.newQuestion}
                    </div>
                  )}
                  {msg.emotionalState && (
                    <div className="message-emotional-state">
                      <strong>❤️ Emotional State:</strong> {msg.emotionalState}
                    </div>
                  )}
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <textarea
              className="message-input"
              placeholder="Type your message... (Shift+Enter for new line)"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={3}
              disabled={isLoading}
            />
            <motion.button
              className="send-button"
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send size={16} />
              {isLoading ? 'Sending...' : 'Send'}
            </motion.button>
          </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 16px;
        }

        .modal-container {
          background: var(--cyber-bg-secondary);
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 30px var(--cyber-glow-cyan), 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          border: 2px solid var(--cyber-neon-cyan);
          clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);
          position: relative;
        }

        .modal-container::before,
        .modal-container::after {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          background: var(--cyber-neon-cyan);
          box-shadow: 0 0 10px var(--cyber-glow-cyan);
        }

        .modal-container::before {
          top: 0;
          left: 0;
        }

        .modal-container::after {
          bottom: 0;
          right: 0;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px;
          border-bottom: 2px solid var(--cyber-border);
          background: linear-gradient(135deg, var(--cyber-bg-secondary) 0%, var(--cyber-bg-tertiary) 100%);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: var(--cyber-neon-cyan);
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 10px var(--cyber-glow-cyan);
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .modal-subtitle {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: var(--cyber-text-secondary);
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .close-button {
          background: var(--cyber-bg-tertiary);
          border: 2px solid var(--cyber-neon-pink);
          color: var(--cyber-neon-pink);
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          box-shadow: 0 0 8px rgba(255, 20, 147, 0.3);
        }

        .close-button:hover {
          box-shadow: 0 0 15px rgba(255, 20, 147, 0.5);
          transform: rotate(90deg);
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6b7280;
          font-style: italic;
        }

        .message {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          max-width: 80%;
          position: relative;
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .message.human {
          align-self: flex-end;
          background: var(--cyber-bg-tertiary);
          border: 2px solid var(--cyber-neon-cyan);
          border-left: 4px solid var(--cyber-neon-cyan);
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.2), inset 0 0 10px rgba(0, 255, 255, 0.1);
        }

        .message.aenea {
          align-self: flex-start;
          background: var(--cyber-bg-tertiary);
          border: 2px solid var(--cyber-neon-lime);
          border-left: 4px solid var(--cyber-neon-lime);
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
          box-shadow: 0 0 15px rgba(0, 255, 65, 0.2), inset 0 0 10px rgba(0, 255, 65, 0.1);
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .message-role {
          font-weight: 600;
          color: #f9fafb;
        }

        .message-time {
          color: #9ca3af;
        }

        .message-system-clock {
          font-family: monospace;
          font-size: 11px;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .message-immediate-reaction {
          font-style: italic;
          color: #d1d5db;
          font-size: 13px;
          margin-bottom: 8px;
          opacity: 0.9;
        }

        .message-content {
          color: #e5e7eb;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .message-new-question {
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(59, 130, 246, 0.15);
          border-left: 3px solid #3b82f6;
          border-radius: 4px;
          font-size: 13px;
          color: #dbeafe;
        }

        .message-new-question strong {
          display: block;
          margin-bottom: 4px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .message-emotional-state {
          margin-top: 8px;
          padding: 6px 10px;
          background: rgba(236, 72, 153, 0.15);
          border-left: 3px solid #ec4899;
          border-radius: 4px;
          font-size: 12px;
          color: #fbcfe8;
        }

        .message-emotional-state strong {
          display: block;
          margin-bottom: 2px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-container {
          padding: 24px;
          border-top: 1px solid #374151;
          display: flex;
          gap: 12px;
          flex-direction: column;
        }

        .message-input {
          background: var(--cyber-bg-tertiary);
          border: 2px solid var(--cyber-border);
          padding: 12px;
          color: var(--cyber-text-primary);
          font-family: 'Courier New', 'Consolas', monospace;
          font-size: 14px;
          resize: none;
          width: 100%;
          box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.1);
        }

        .message-input:focus {
          outline: none;
          border-color: var(--cyber-neon-cyan);
          box-shadow: 0 0 10px var(--cyber-glow-cyan), inset 0 0 15px rgba(0, 255, 255, 0.15);
        }

        .message-input::placeholder {
          color: var(--cyber-text-dim);
        }

        .message-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-button {
          background: var(--cyber-bg-tertiary);
          border: 2px solid var(--cyber-neon-lime);
          padding: 12px 24px;
          color: var(--cyber-neon-lime);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          align-self: flex-end;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
          box-shadow: 0 0 10px var(--cyber-glow-lime);
          font-family: 'Courier New', 'Consolas', monospace;
        }

        .send-button:hover:not(:disabled) {
          box-shadow: 0 0 20px var(--cyber-glow-lime);
          transform: translateY(-2px);
        }

        .send-button:disabled {
          border-color: var(--cyber-text-dim);
          color: var(--cyber-text-dim);
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 640px) {
          .modal-container {
            max-height: 100vh;
            height: 100vh;
            border-radius: 0;
          }

          .modal-header {
            padding: 16px;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .messages-container {
            padding: 16px;
          }

          .message {
            max-width: 90%;
          }

          .input-container {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default DialogueModal;
