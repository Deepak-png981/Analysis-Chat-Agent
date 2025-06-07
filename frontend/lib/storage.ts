import { ChatSession } from '@/types';

const STORAGE_KEY = 'ai-chat-sessions';

export const loadSessions = (): ChatSession[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const sessions = JSON.parse(stored);
    return sessions.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
};

export const saveSessions = (sessions: ChatSession[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
};

export const clearSessions = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
}; 