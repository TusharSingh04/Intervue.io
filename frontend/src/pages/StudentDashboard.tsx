import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, BarChart3, Clock, CheckCircle2, HelpCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useSocket, usePollTimer } from '../hooks';
import {
  Button,
  Card,
  ConnectionStatus,
  Timer,
  PollOptions,
  PollResults,
  Chat
} from '../components';

export function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, resetState } = useAppContext();
  const { join, vote, sendMessage, isConnected } = useSocket();
  const { isExpired, remainingTime } = usePollTimer();

  // Redirect to kicked page if kicked
  useEffect(() => {
    if (state.isKicked) {
      navigate('/kicked');
    }
  }, [state.isKicked, navigate]);

  // Join on mount
  useEffect(() => {
    const storedName = sessionStorage.getItem('participantName');
    const storedRole = sessionStorage.getItem('participantRole');
    const storedId = sessionStorage.getItem('participantId');
    const locationName = location.state?.name;

    const name = locationName || storedName;

    if (!name || storedRole !== 'student') {
      navigate('/');
      return;
    }

    if (isConnected && !state.isJoined) {
      join({
        name,
        role: 'student',
        participantId: storedId || undefined
      });
    }
  }, [isConnected, state.isJoined, navigate, location.state, join]);

  const handleLogout = () => {
    sessionStorage.clear();
    resetState();
    navigate('/');
  };

  const handleVote = (optionId: string) => {
    if (state.poll) {
      vote(state.poll.id, optionId);
    }
  };

  const showVotingUI = state.poll && state.poll.isActive && !isExpired && !state.hasVoted;
  const showResultsUI = state.poll && (state.hasVoted || isExpired || !state.poll.isActive);
  const showWaitingUI = !state.poll;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Poll</h1>
              <p className="text-sm text-gray-500">
                {state.participant?.name || 'Student'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ConnectionStatus />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut size={16} className="mr-1" />
              Leave
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Status Bar */}
        {state.poll && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {state.poll.isActive && !isExpired ? (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="text-sm font-medium text-green-600">Poll Active</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">Poll Ended</span>
                    </>
                  )}
                </div>

                {/* Timer */}
                {state.poll.isActive && !isExpired && (
                  <Timer size="md" showProgress={false} />
                )}

                {/* Vote Status */}
                {state.hasVoted && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 size={16} />
                    <span className="text-sm font-medium">Voted</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {state.poll.isActive && !isExpired && (
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        remainingTime <= 10 ? 'bg-red-500' :
                        remainingTime <= 30 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(remainingTime / state.poll.duration) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Waiting State */}
        {showWaitingUI && (
          <Card className="text-center py-12">
            <div className="animate-bounce-slow mb-4">
              <Clock size={64} className="mx-auto text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Waiting for Poll
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              The teacher hasn't started a poll yet. Please wait — 
              when a question is asked, it will appear here automatically.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Connected and waiting...
            </div>
          </Card>
        )}

        {/* Voting UI */}
        {showVotingUI && state.poll && (
          <PollOptions
            question={state.poll.question}
            options={state.poll.options}
            onVote={handleVote}
            disabled={!isConnected || isExpired}
            selectedOptionId={state.userVoteOptionId}
          />
        )}

        {/* Results UI */}
        {showResultsUI && state.poll && (
          <div className="space-y-6">
            {/* User's Vote Confirmation */}
            {state.hasVoted && (
              <Card className="bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Vote Recorded!</h3>
                    <p className="text-sm text-green-600">
                      Your answer: {state.poll.options.find(o => o.id === state.userVoteOptionId)?.text}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Results */}
            <PollResults
              question={state.poll.question}
              options={state.poll.options}
              userVoteOptionId={state.userVoteOptionId}
              showVotes={true}
              title={state.poll.isActive && !isExpired ? 'Live Results' : 'Final Results'}
              showCorrectAnswer={!state.poll.isActive || isExpired}
            />

            {/* Waiting for next poll */}
            {(!state.poll.isActive || isExpired) && (
              <Card className="text-center py-6 bg-gray-50">
                <HelpCircle size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">
                  Waiting for the next question...
                </p>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Chat */}
      <Chat onSendMessage={sendMessage} />
    </div>
  );
}
