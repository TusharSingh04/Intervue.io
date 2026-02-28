import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ChatMessage, IParticipant } from '../../types';

interface ChatProps {
  onSendMessage: (message: string) => void;
  onKickStudent?: (participantId: string) => void;
  isTeacher?: boolean;
}

export function Chat({ onSendMessage, onKickStudent, isTeacher = false }: ChatProps) {
  const { state } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [state.messages, isOpen, activeTab]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const students = state.participants.filter(p => p.role === 'student');

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-500 text-white rounded-2xl shadow-lg hover:bg-primary-600 transition-all duration-200 flex items-center justify-center z-50"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-xl shadow-2xl z-50 flex flex-col h-[400px] border border-gray-200">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'participants'
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Participants
            </button>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Chat Tab Content */}
      {activeTab === 'chat' && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {state.messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              state.messages.map((msg: ChatMessage) => {
                const isOwn = msg.senderId === state.participant?.id;
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    <span className={`text-xs font-medium mb-1 ${
                      isOwn ? 'text-primary-600' : 'text-gray-600'
                    }`}>
                      {isOwn ? 'You' : msg.senderName}
                    </span>
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                        isOwn
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Participants Tab Content */}
      {activeTab === 'participants' && (
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 text-xs font-medium text-gray-500">
            <span>Name</span>
            {isTeacher && <span>Action</span>}
          </div>

          {/* Participant List */}
          <div className="divide-y divide-gray-100">
            {students.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">No students yet</p>
              </div>
            ) : (
              students.map((student: IParticipant) => (
                <div key={student.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-700">{student.name}</span>
                  {isTeacher && onKickStudent && (
                    <button
                      onClick={() => onKickStudent(student.id)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Kick out
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
