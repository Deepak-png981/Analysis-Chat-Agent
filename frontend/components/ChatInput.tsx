'use client';

import { useState, useRef } from 'react';
import { Send, Paperclip, X, Upload, Zap } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';

interface ChatInputProps {
  isCentered?: boolean;
}

export default function ChatInput({ isCentered = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isLoading, currentSessionId, createNewSession } = useChatContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedFile) return;
    if (isLoading) return;

    // Auto-create session if none exists
    if (!currentSessionId) {
      createNewSession();
      // Wait a bit for the session to be created
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await sendMessage(message, selectedFile || undefined);
    setMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedExtensions = ['csv', 'json', 'xls', 'xlsx'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension && allowedExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        // Auto-create session when file is selected
        if (!currentSessionId) {
          createNewSession();
        }
      } else {
        alert('Please select a valid file (CSV, JSON, XLS, XLSX)');
        e.target.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const allowedExtensions = ['csv', 'json', 'xls', 'xlsx'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension && allowedExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        // Auto-create session when file is dropped
        if (!currentSessionId) {
          createNewSession();
        }
      } else {
        alert('Please select a valid file (CSV, JSON, XLS, XLSX)');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputFocus = () => {
    // Auto-create session when user focuses on input (for better UX)
    if (!currentSessionId && isCentered) {
      createNewSession();
    }
  };

  if (isCentered) {
    // Centered input for empty state (ChatGPT style)
    return (
      <div className="w-full max-w-3xl mx-auto px-4">
        {/* File Upload Preview */}
        {selectedFile && (
          <div className="mb-4 relative">
            <div className="bg-dark-surface/70 backdrop-blur-sm border border-dark-border/50 rounded-xl p-3 glass-morphism">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Paperclip size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-dark-text text-sm font-medium truncate">{selectedFile.name}</div>
                  <div className="text-dark-text-secondary text-xs">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.split('.').pop()?.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div 
          className={`relative transition-all duration-300 ${
            isDragOver ? 'transform scale-105' : ''
          }`}
          onDrop={handleDrop}
          onDragOver={handleDrag}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {/* Drag Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-accent-blue/20 border-2 border-dashed border-accent-blue rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <Upload size={24} className="text-accent-blue mx-auto mb-2" />
                <p className="text-accent-blue font-medium">Drop your file here</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".csv,.json,.xls,.xlsx"
            />
            
            <div className="bg-dark-surface/70 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-2 glass-morphism glow-effect">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-xl bg-dark-surface-hover/70 hover:bg-dark-surface-hover text-dark-text-secondary hover:text-accent-blue transition-all duration-300 flex items-center justify-center group"
                  title="Upload file"
                >
                  <Paperclip size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                </button>

                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputFocus}
                    placeholder="Ask anything..."
                    className="w-full p-3 bg-transparent text-dark-text placeholder-dark-text-secondary resize-none focus:outline-none min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                </div>

                <button
                  type="submit"
                  disabled={(!message.trim() && !selectedFile) || isLoading}
                  className="w-10 h-10 rounded-xl bg-gradient-primary hover:bg-gradient-secondary disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white transition-all duration-300 flex items-center justify-center group glow-effect"
                  title="Send message"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* File format indicators */}
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-dark-text-secondary">
            <span>Supported:</span>
            {['CSV', 'JSON', 'XLS', 'XLSX'].map((format) => (
              <span 
                key={format} 
                className="px-2 py-1 bg-accent-blue/20 text-accent-blue rounded text-xs font-medium"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Bottom input for active conversations
  return (
    <div 
      className={`border-t border-dark-border/50 bg-dark-surface/30 backdrop-blur-xl p-4 relative transition-all duration-300 ${
        isDragOver ? 'bg-accent-blue/10 border-accent-blue/50' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDrag}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/5 via-transparent to-accent-purple/5 pointer-events-none"></div>
      
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-accent-blue/20 border-2 border-dashed border-accent-blue rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <Upload size={32} className="text-accent-blue mx-auto mb-2" />
            <p className="text-accent-blue font-medium">Drop your file here</p>
          </div>
        </div>
      )}

      {/* File Upload Preview */}
      {selectedFile && (
        <div className="mb-4 relative max-w-4xl mx-auto">
          <div className="bg-dark-surface/70 backdrop-blur-sm border border-dark-border/50 rounded-xl p-3 glass-morphism">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Paperclip size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-dark-text text-sm font-medium truncate">{selectedFile.name}</div>
                <div className="text-dark-text-secondary text-xs">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.split('.').pop()?.toUpperCase()}
                </div>
              </div>
              <button
                onClick={removeFile}
                className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-3 relative z-10">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".csv,.json,.xls,.xlsx"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-xl bg-dark-surface-hover/70 hover:bg-dark-surface-hover border border-dark-border/50 hover:border-accent-blue/50 text-dark-text-secondary hover:text-accent-blue transition-all duration-300 flex items-center justify-center group glow-hover"
            title="Upload file"
          >
            <Paperclip size={20} className="group-hover:rotate-12 transition-transform duration-300" />
          </button>

          <div className="flex-1 relative">
            <div className="bg-dark-surface/70 backdrop-blur-sm border border-dark-border/50 rounded-xl glass-morphism">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={currentSessionId ? "Type your message..." : "Create a new chat to start"}
                className="w-full p-4 bg-transparent text-dark-text placeholder-dark-text-secondary resize-none focus:outline-none min-h-[48px] max-h-[120px]"
                rows={1}
                disabled={!currentSessionId}
              />
            </div>
            
            {/* Character counter for long messages */}
            {message.length > 500 && (
              <div className="absolute -top-6 right-2 text-xs text-dark-text-secondary">
                {message.length}/2000
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={(!message.trim() && !selectedFile) || isLoading || !currentSessionId}
            className="w-12 h-12 rounded-xl bg-gradient-primary hover:bg-gradient-secondary disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white transition-all duration-300 flex items-center justify-center group glow-effect"
            title="Send message"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            )}
          </button>
        </form>
        
        <div className="flex items-center justify-between mt-3 text-xs text-dark-text-secondary">
          {!currentSessionId ? (
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-accent-blue" />
              <span>Create a new chat session to start chatting</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>AI Online</span>
              </div>
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span>Supported:</span>
            <div className="flex gap-1">
              {['CSV', 'JSON', 'XLS', 'XLSX'].map((format) => (
                <span 
                  key={format} 
                  className="px-2 py-1 bg-accent-blue/20 text-accent-blue rounded text-xs font-medium"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 