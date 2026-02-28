import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useSocket, usePollTimer } from '../hooks';
import {
  Button,
  CreatePoll,
  PollResults,
  PollHistory,
  Chat
} from '../components';

export function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, resetState } = useAppContext();
  const { join, createPoll, kickStudent, sendMessage, isConnected } = useSocket();
  const { isExpired } = usePollTimer();
  const [showHistory, setShowHistory] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(true);

  // Join on mount
  useEffect(() => {
    const storedName = sessionStorage.getItem('participantName');
    const storedRole = sessionStorage.getItem('participantRole');
    const storedId = sessionStorage.getItem('participantId');
    const locationName = location.state?.name;

    const name = locationName || storedName;

    if (!name || storedRole !== 'teacher') {
      navigate('/');
      return;
    }

    if (isConnected && !state.isJoined) {
      join({ 
        name, 
        role: 'teacher',
        participantId: storedId || undefined 
      });
    }
  }, [isConnected, state.isJoined, navigate, location.state, join]);

  // Show results when poll is created
  useEffect(() => {
    if (state.poll) {
      setShowCreatePoll(false);
    }
  }, [state.poll]);

  const handleLogout = () => {
    sessionStorage.clear();
    resetState();
    navigate('/');
  };

  const handleCreatePoll = (payload: any) => {
    createPoll(payload);
    setShowCreatePoll(false);
  };

  const handleAskNewQuestion = () => {
    setShowCreatePoll(true);
  };

  const canCreatePoll = !state.poll || !state.poll.isActive || isExpired;

  // Show CreatePoll view
  if (showCreatePoll && canCreatePoll) {
    return (
      <div className="min-h-screen bg-white">
        <CreatePoll
          onCreatePoll={handleCreatePoll}
          disabled={!isConnected}
        />
        <Chat 
          onSendMessage={sendMessage} 
          onKickStudent={kickStudent}
          isTeacher={true}
        />
      </div>
    );
  }

  // Show Poll Results view
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header with View Poll History button */}
        <div className="flex justify-end mb-8">
          <Button
            onClick={() => setShowHistory(true)}
            variant="outline"
            className="border-primary-500 text-primary-600 hover:bg-primary-50"
          >
            <PlayCircle size={18} className="mr-2" />
            View Poll history
          </Button>
        </div>

        {/* Poll Results */}
        {state.poll && (
          <PollResults
            question={state.poll.question}
            options={state.poll.options}
            showVotes={true}
            title="Question"
          />
        )}

        {/* Ask New Question Button */}
        {canCreatePoll && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleAskNewQuestion}
              size="lg"
              className="px-8"
            >
              + Ask a new question
            </Button>
          </div>
        )}
      </div>

      {/* Poll History Modal */}
      <PollHistory 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
      />

      {/* Chat with Participants Tab */}
      <Chat 
        onSendMessage={sendMessage} 
        onKickStudent={kickStudent}
        isTeacher={true}
      />
    </div>
  );
}