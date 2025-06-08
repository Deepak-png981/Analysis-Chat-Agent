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
    } else {
        createNewSession(true);
    }
  }, []);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const createNewSession = (switch_to_new = true) => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSessions(prev => [newSession, ...prev]);
    if(switch_to_new){
        setCurrentSessionId(newSession.id);
    }
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

  const deleteSession = (sessionId: string) => {
    setSessions(prev => {
      const remainingSessions = prev.filter(session => session.id !== sessionId);

      if (currentSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          createNewSession(true);
        }
      }
      return remainingSessions;
    });
  };

  const sendMessage = async (content: string, file?: File) => {
    let activeSessionId = currentSessionId;
    
    if (!activeSessionId) {
        const newSessionId = uuidv4();
        const newSession: ChatSession = {
            id: newSessionId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setSessions(prev => [newSession, ...prev]);
        activeSessionId = newSessionId;
        setCurrentSessionId(newSessionId);
    }

    setIsLoading(true);

    const userMessage: Message = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
    if (sessionIndex === -1) {
      console.error("Session not found");
      setIsLoading(false);
      return;
    }
    const currentSession = sessions[sessionIndex];
    const newMessages = [...currentSession.messages, userMessage];

    // Add user message immediately and reset clarification
    setSessions(prev => 
      prev.map(session => 
        session.id === activeSessionId
          ? {
              ...session,
              messages: newMessages,
              updatedAt: new Date(),
              clarificationNeeded: false, // Reset clarification flag on new user message
              // If a file is being sent with this message, mark it in the session
              ...(file && { fileUploaded: true, fileName: file.name }),
            }
          : session
      )
    );

    // Update title if it's the first message
    if (currentSession.messages.length === 0) {
      updateSessionTitle(activeSessionId, content);
    }

    try {
      let stateJson: string | undefined;

      // Only prepare state_json for follow-up requests that are NOT sending a new file.
      if (!file) {
        const sessionState = {
            file_path: currentSession.fileUploaded ? `uploads/${currentSession.fileName}` : undefined,
            chat_history: newMessages.map(msg => [msg.role, msg.content] as [string, string]),
            clarification_needed: currentSession.clarificationNeeded || false,
        };
        stateJson = JSON.stringify(sessionState);
      }

      console.log("Sending state to backend:", stateJson);

      const response: GraphStateResponse = await sendChatMessage(content, file, stateJson);

      const assistantMessage: Message = {
        id: uuidv4(),
        content: response.generation || response.clarification_question || 'No response received',
        role: 'assistant',
        timestamp: new Date(),
        image: response.images && response.images.length > 0 ? response.images[0] : undefined,
        error: response.error,
      };

      // Update the session with the assistant's message and the file_path from the backend
      setSessions(prev => 
        prev.map(session => 
          session.id === activeSessionId
            ? {
                ...session,
                messages: [...newMessages, assistantMessage],
                updatedAt: new Date(),
                // If the backend returns a file_path, it means a file is now associated with this session.
                ...(response.file_path && { fileUploaded: true, fileName: response.file_path.split(/[\\/]/).pop() }),
                clarificationNeeded: response.clarification_needed,
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
          session.id === activeSessionId
            ? {
                ...session,
                messages: [...newMessages, errorMessage],
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
    deleteSession,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 