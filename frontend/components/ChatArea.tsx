'use client';

import { useChatContext } from '@/contexts/ChatContext';
import { Message } from '@/types';
import { User, Bot, AlertCircle, Sparkles, Image as ImageIcon, MessageSquare, Menu } from 'lucide-react';
import ChatInput from '@/components/ChatInput';

interface MessageComponentProps {
  message: Message;
  index: number;
}

interface ChatAreaProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

function MessageComponent({ message, index }: MessageComponentProps) {
  const isUser = message.role === 'user';

  return (
    <div 
      className={`flex gap-4 p-6 slide-in relative ${
        isUser ? 'bg-transparent' : 'bg-gradient-to-r from-dark-surface/30 to-transparent'
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Background glow for assistant messages */}
      {!isUser && (
        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-primary rounded-r-full"></div>
      )}
      
      <div className={`relative ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden ${
          isUser 
            ? 'bg-gradient-primary glow-effect' 
            : 'bg-gradient-secondary glow-effect'
        }`}>
          {isUser ? (
            <User size={20} className="text-white" />
          ) : (
            <>
              <Bot size={20} className="text-white" />
              <div className="absolute inset-0 bg-gradient-accent opacity-0 animate-pulse"></div>
            </>
          )}
        </div>
        {/* Online indicator for AI */}
        {!isUser && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-dark-surface animate-pulse-glow"></div>
        )}
      </div>
      
      <div className={`flex-1 min-w-0 ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`flex items-center gap-3 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-dark-text font-semibold text-sm">
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            {!isUser && (
              <div className="flex items-center gap-1">
                <Sparkles size={12} className="text-accent-blue animate-pulse" />
                <span className="text-accent-blue text-xs font-medium">Online</span>
              </div>
            )}
          </div>
          <span className="text-dark-text-secondary text-xs">
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        
        {message.error && (
          <div className="flex items-center gap-2 mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">Error: {message.error}</span>
          </div>
        )}
        
        <div className={`relative group ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block max-w-4xl p-4 rounded-2xl relative overflow-hidden ${
            isUser 
              ? 'bg-gradient-primary text-white ml-auto' 
              : 'bg-dark-surface/70 text-dark-text glass-morphism'
          }`}>
            {/* Message background effects */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isUser 
                ? 'bg-gradient-secondary' 
                : 'bg-gradient-to-r from-accent-blue/5 to-accent-purple/5'
            }`}></div>
            
            <div className="relative z-10">
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </div>
            </div>
            
            {/* Message tail */}
            <div className={`absolute top-4 w-3 h-3 transform rotate-45 ${
              isUser 
                ? '-right-1 bg-gradient-primary' 
                : '-left-1 bg-dark-surface/70'
            }`}></div>
          </div>
        </div>
        
        {message.image && (
          <div className={`mt-4 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className="inline-block relative group">
              <div className="gradient-border glow-hover">
                <div className="gradient-border-inner p-2">
                  <img 
                    src={`data:image/png;base64,${message.image}`}
                    alt="Generated chart"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-dark-surface/80 backdrop-blur-sm rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ImageIcon size={16} className="text-accent-blue" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatArea({ isSidebarOpen, onToggleSidebar }: ChatAreaProps) {
  const { sessions, currentSessionId } = useChatContext();
  
  const currentSession = sessions.find(s => s.id === currentSessionId);

  if (!currentSession) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-dark relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-blue/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-purple/10 rounded-full blur-2xl float-animation" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accent-cyan/10 rounded-full blur-xl float-animation" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Toggle Button when sidebar is hidden */}
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="fixed top-6 left-6 z-50 w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center glow-effect hover:shadow-glow-lg transition-all duration-300 group"
            title="Open sidebar"
          >
            <Menu size={20} className="text-white group-hover:scale-110 transition-transform duration-300" />
          </button>
        )}
        
        {/* Centered Welcome Content */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
          <div className="text-center mb-8">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto glow-effect float-animation">
                <Bot size={40} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-cyan rounded-full flex items-center justify-center animate-bounce-soft">
                <Sparkles size={16} className="text-white" />
              </div>
            </div>
            
            <h1 className="text-dark-text text-4xl font-bold mb-4 text-gradient">
              What can I help with?
            </h1>
            <p className="text-dark-text-secondary text-lg max-w-2xl leading-relaxed">
              Upload your data files and I'll help you create beautiful charts and visualizations.
              <br />
              <span className="text-accent-blue font-medium">Let's turn your data into insights!</span>
            </p>
          </div>
          
          {/* Centered Input */}
          <div className="w-full max-w-4xl">
            <ChatInput isCentered={true} />
          </div>
          
          {/* Feature highlights */}
          <div className="mt-12 flex justify-center gap-8 text-dark-text-secondary text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse"></div>
              <span>Upload Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent-purple rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <span>Ask Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <span>Get Insights</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If there's no messages yet, show centered input with session header
  if (currentSession.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-dark relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-accent-purple/5 rounded-full blur-2xl"></div>
        </div>
        
        {/* Header */}
        <div className="border-b border-dark-border/50 bg-dark-surface/30 backdrop-blur-xl p-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* Toggle Button when sidebar is hidden */}
            {!isSidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center glow-effect hover:shadow-glow-lg transition-all duration-300 group mr-2"
                title="Open sidebar"
              >
                <Menu size={20} className="text-white group-hover:scale-110 transition-transform duration-300" />
              </button>
            )}
            
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center glow-effect">
              <MessageSquare size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-dark-text font-bold text-lg">{currentSession.title}</h1>
              {currentSession.fileUploaded ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-dark-text-secondary text-sm">
                    📎 File uploaded: <span className="text-accent-blue font-medium">{currentSession.fileName}</span>
                  </p>
                </div>
              ) : (
                <p className="text-dark-text-secondary text-sm mt-1">Ready for your first message</p>
              )}
            </div>
          </div>
        </div>

        {/* Centered Content for Empty Session */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
          <div className="text-center mb-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-secondary rounded-2xl flex items-center justify-center mx-auto glow-effect">
                <Bot size={32} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent-cyan rounded-full flex items-center justify-center animate-pulse">
                <Sparkles size={12} className="text-white" />
              </div>
            </div>
            <h3 className="text-dark-text text-2xl font-semibold mb-3">Start a conversation</h3>
            <p className="text-dark-text-secondary max-w-lg leading-relaxed">
              {currentSession.fileUploaded 
                ? `Your file "${currentSession.fileName}" is ready. Ask me to analyze it or create visualizations!`
                : "Upload a file and ask me to create charts or analyze your data"
              }
            </p>
          </div>
          
          {/* Centered Input */}
          <div className="w-full max-w-4xl">
            <ChatInput isCentered={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-dark relative overflow-hidden">
      {/* Header */}
      <div className="border-b border-dark-border/50 bg-dark-surface/30 backdrop-blur-xl p-6 relative z-10">
        <div className="flex items-center gap-4">
          {/* Toggle Button when sidebar is hidden */}
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center glow-effect hover:shadow-glow-lg transition-all duration-300 group mr-2"
              title="Open sidebar"
            >
              <Menu size={20} className="text-white group-hover:scale-110 transition-transform duration-300" />
            </button>
          )}
          
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center glow-effect">
            <MessageSquare size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-dark-text font-bold text-lg">{currentSession.title}</h1>
            <p className="text-dark-text-secondary text-sm mt-1">
              {currentSession.messages.length} messages
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-5xl mx-auto w-full">
          {currentSession.messages.map((message, index) => (
            <MessageComponent key={message.id} message={message} index={index} />
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-dark-border/50 bg-dark-surface/20">
        <div className="max-w-5xl mx-auto w-full">
          <ChatInput />
        </div>
      </div>
    </div>
  );
} 