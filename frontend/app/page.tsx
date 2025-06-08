'use client';

import { useState } from 'react';
import { ChatProvider } from '@/contexts/ChatContext';
import { useChatContext } from '@/contexts/ChatContext';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';

function MainContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { sessions, currentSessionId } = useChatContext();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const showBottomInput = currentSession && currentSession.messages.length > 0;

  return (
    <div className="flex h-screen bg-gradient-dark relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-accent-purple/5 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/2 w-64 h-64 bg-accent-cyan/5 rounded-full blur-2xl float-animation" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="flex w-full relative z-10">
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className="flex-1 flex flex-col min-w-0">
          <ChatArea isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
        </div>
      </div>
      
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(79, 70, 229, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79, 70, 229, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      ></div>
    </div>
  );
}

export default function Home() {
  return (
    <ChatProvider>
      <MainContent />
    </ChatProvider>
  );
} 