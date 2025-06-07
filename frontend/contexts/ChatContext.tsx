'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, ChatContextType, GraphStateResponse } from '@/types';
import { loadSessions, saveSessions } from '@/lib/storage';
import { sendChatMessage } from '@/lib/api';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadedSessions = loadSessions();
    setSessions(loadedSessions);
    
    if (loadedSessions.length > 0) {
      setCurrentSessionId(loadedSessions[0].id);
    }
  }, []);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const updateSessionTitle = (sessionId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title }
          : session
      )
    );
  };

  const sendMessage = async (content: string, file?: File) => {
    if (!currentSessionId) {
      createNewSession();
      return;
    }

    setIsLoading(true);

    const userMessage: Message = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    // Add user message immediately
    setSessions(prev => 
      prev.map(session => 
        session.id === currentSessionId
          ? {
              ...session,
              messages: [...session.messages, userMessage],
              updatedAt: new Date(),
              fileUploaded: file ? true : session.fileUploaded,
              fileName: file ? file.name : session.fileName,
            }
          : session
      )
    );

    // Update title if it's the first message
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && currentSession.messages.length === 0) {
      updateSessionTitle(currentSessionId, content);
    }

    try {
      // Prepare state for follow-up requests
      let stateJson: string | undefined;
      if (currentSession && currentSession.messages.length > 0) {
        const sessionState = {
          file_path: currentSession.fileUploaded ? `/uploads/${currentSession.fileName}` : undefined,
          chat_history: currentSession.messages.map(msg => [msg.role, msg.content] as [string, string]),
        };
        stateJson = JSON.stringify(sessionState);
      }

      const response: GraphStateResponse = await sendChatMessage(content, file, stateJson);

      const assistantMessage: Message = {
        id: uuidv4(),
        content: response.generation || response.clarification_question || 'No response received',
        role: 'assistant',
        timestamp: new Date(),
        image: response.images && response.images.length > 0 ? response.images[0] : undefined,
        error: response.error,
      };

      setSessions(prev => 
        prev.map(session => 
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...session.messages, assistantMessage],
                updatedAt: new Date(),
              }
            : session
        )
      );

    } catch (error) {
      const errorMessage: Message = {
        id: uuidv4(),
        content: error instanceof Error ? error.message : 'An error occurred',
        role: 'assistant',
        timestamp: new Date(),
        error: 'API Error',
      };

      setSessions(prev => 
        prev.map(session => 
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...session.messages, errorMessage],
                updatedAt: new Date(),
              }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const value: ChatContextType = {
    sessions,
    currentSessionId,
    createNewSession,
    switchSession,
    sendMessage,
    isLoading,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 