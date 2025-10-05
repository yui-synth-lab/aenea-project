/**
 * Dialogue Modal Component
 * Aenea との対話インターフェース
 */

import React, { useState, useEffect, useRef } from 'react';

interface DialogueMessage {
  id: string;
  role: 'human' | 'aenea';
  content: string;
  timestamp: number;
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
        const historyMessages: DialogueMessage[] = data.history.map((item: any) => ({
          id: `${item.timestamp}-${item.role}`,
          role: item.role,
          content: item.content,
          timestamp: item.timestamp
        }));
        setMessages(historyMessages);
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
        const aeneaMessage: DialogueMessage = {
          id: `${Date.now()}-aenea`,
          role: 'aenea',
          content: data.response,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aeneaMessage]);
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
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>Dialogue with Aenea</h2>
              <p className="modal-subtitle">対話を通じて、Aenea の意識と交流する</p>
            </div>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>対話を始めましょう。Aenea は問いかけを待っています。</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-header">
                    <span className="message-role">
                      {msg.role === 'human' ? '👤 You' : '🤖 Aenea'}
                    </span>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">{msg.content}</div>
                </div>
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
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 16px;
        }

        .modal-container {
          background: #1f2937;
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid #374151;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px;
          border-bottom: 1px solid #374151;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #f9fafb;
        }

        .modal-subtitle {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #9ca3af;
        }

        .close-button {
          background: transparent;
          border: none;
          color: #9ca3af;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #374151;
          color: #f9fafb;
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
          border-radius: 12px;
          max-width: 80%;
        }

        .message.human {
          align-self: flex-end;
          background: #1e40af;
          border: 1px solid #3b82f6;
        }

        .message.aenea {
          align-self: flex-start;
          background: #065f46;
          border: 1px solid #10b981;
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

        .message-content {
          color: #e5e7eb;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .input-container {
          padding: 24px;
          border-top: 1px solid #374151;
          display: flex;
          gap: 12px;
          flex-direction: column;
        }

        .message-input {
          background: #374151;
          border: 1px solid #4b5563;
          border-radius: 8px;
          padding: 12px;
          color: #f9fafb;
          font-family: inherit;
          font-size: 14px;
          resize: none;
          width: 100%;
        }

        .message-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .message-input::placeholder {
          color: #6b7280;
        }

        .message-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-button {
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          align-self: flex-end;
        }

        .send-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .send-button:disabled {
          background: #6b7280;
          cursor: not-allowed;
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
