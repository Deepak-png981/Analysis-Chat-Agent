'use client';

import { Plus, MessageSquare, Sparkles, FileText, Clock, ChevronLeft, Trash2 } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { sessions, currentSessionId, createNewSession, switchSession, deleteSession } = useChatContext();

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent the session from being switched when deleting
    if (window.confirm('Are you sure you want to delete this chat?')) {
      deleteSession(sessionId);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`bg-gradient-surface border-r border-dark-border flex flex-col h-full relative overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'w-72' : 'w-0'
      }`}>
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 via-transparent to-accent-purple/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-accent-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-accent-purple/10 rounded-full blur-2xl"></div>

        {/* Header */}
        <div className="p-6 border-b border-dark-border/50 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center glow-effect">
                <Sparkles size={20} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-cyan rounded-full animate-pulse-glow"></div>
            </div>
            <div className="flex-1">
              <span className="text-dark-text font-bold text-lg">AI Chat</span>
              {/* <p className="text-dark-text-secondary text-xs">Interface v2.0</p> */}
            </div>
            {/* Collapse Button */}
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-lg bg-dark-surface-hover/50 hover:bg-dark-surface-hover border border-dark-border/50 hover:border-accent-blue/50 text-dark-text-secondary hover:text-accent-blue transition-all duration-300 flex items-center justify-center group"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} className="group-hover:transform group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>
          
          <button
            onClick={createNewSession}
            className="w-full group relative overflow-hidden btn-primary text-white rounded-xl py-3 px-4 font-medium transition-all duration-300 hover:shadow-glow-lg glow-hover"
          >
            <div className="flex items-center justify-center gap-2 relative z-10">
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Add new chat</span>
            </div>
            <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 relative z-10">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mb-4">
                <MessageSquare size={48} className="text-dark-text-secondary mx-auto opacity-50" />
              </div>
              <p className="text-dark-text-secondary text-sm leading-relaxed">
                No conversations yet.<br />
                <span className="text-accent-blue">Create your first chat</span> to get started with AI-powered visualizations.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Clock size={14} className="text-dark-text-secondary" />
                <span className="text-dark-text-secondary text-xs uppercase tracking-wider font-medium">Recent Chats</span>
              </div>
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className="slide-in card-hover group/item relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <button
                    onClick={() => switchSession(session.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      currentSessionId === session.id
                        ? 'bg-gradient-primary shadow-glow text-white'
                        : 'bg-dark-surface/50 hover:bg-dark-surface-hover/70 glass-morphism'
                    }`}
                  >
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                    
                    <div className="flex items-start gap-3 relative z-10">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        currentSessionId === session.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gradient-primary text-white'
                      }`}>
                        <MessageSquare size={16} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate mb-1 ${
                          currentSessionId === session.id ? 'text-white' : 'text-dark-text'
                        }`}>
                          {session.title}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`flex items-center gap-1 ${
                            currentSessionId === session.id ? 'text-white/70' : 'text-dark-text-secondary'
                          }`}>
                            <MessageSquare size={12} />
                            {session.messages.length} messages
                          </span>
                          
                          {session.fileUploaded && (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                              currentSessionId === session.id 
                                ? 'bg-white/20 text-white' 
                                : 'bg-accent-blue/20 text-accent-blue'
                            }`}>
                              <FileText size={10} />
                              {session.fileName?.split('.').pop()?.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {currentSessionId === session.id && (
                        <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="absolute top-1/2 -translate-y-1/2 right-4 z-10 w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-white transition-all duration-300 flex items-center justify-center opacity-0 group-hover/item:opacity-100"
                    title="Delete chat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
} 