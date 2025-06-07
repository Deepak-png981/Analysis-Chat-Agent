export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  image?: string;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  fileUploaded?: boolean;
  fileName?: string;
}

export interface GraphStateResponse {
  file_path?: string;
  prompt?: string;
  chat_history: [string, string][];
  clarification_needed: boolean;
  clarification_question?: string;
  generation?: string;
  images: string[];
  error?: string;
}

export interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  createNewSession: () => void;
  switchSession: (sessionId: string) => void;
  sendMessage: (content: string, file?: File) => Promise<void>;
  isLoading: boolean;
} 