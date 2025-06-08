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
    // To prevent race conditions and accidental overwrites during page reloads,
    // we get the latest version from storage first.
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedSessions = stored ? JSON.parse(stored) : [];

    // Simple merge: This is a basic approach. A more complex app might need a smarter merge strategy.
    // For this app, we assume the incoming `sessions` array is the most current source of truth,
    // but this prevents writing an empty array over existing data if the state is temporarily empty on unload.
    if (sessions.length > 0 || storedSessions.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
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