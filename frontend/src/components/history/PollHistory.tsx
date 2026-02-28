import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { IPoll, IPollOption } from '../../types';

interface PollHistoryProps {
  onFetchHistory?: () => Promise<IPoll[]>;
  isOpen: boolean;
  onClose: () => void;
}

export function PollHistory({ onFetchHistory, isOpen, onClose }: PollHistoryProps) {
  const [polls, setPolls] = useState<IPoll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (onFetchHistory) {
        const data = await onFetchHistory();
        setPolls(data);
      } else {
        const response = await fetch('/api/polls/history');
        const result = await response.json();
        if (result.success) {
          setPolls(result.data);
        } else {
          setError('Failed to load poll history');
        }
      }
    } catch (err) {
      setError('Failed to load poll history');
      console.error('Error fetching poll history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalVotes = (options: IPollOption[]) => {
    return options.reduce((sum, opt) => sum + opt.votes, 0);
  };

  const getPercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-normal text-gray-700">
            View <span className="font-bold">Poll History</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
              <button 
                onClick={fetchHistory}
                className="mt-2 text-primary-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No polls have been conducted yet</p>
            </div>
          ) : (
            <div className="space-y-8">
              {polls.map((poll, pollIndex) => {
                const totalVotes = getTotalVotes(poll.options);

                return (
                  <div key={poll.id}>
                    {/* Question Label */}
                    <h3 className="text-base font-bold text-gray-700 mb-3">
                      Question {pollIndex + 1}
                    </h3>

                    {/* Poll Card */}
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                      {/* Purple Header */}
                      <div className="bg-primary-500 text-white px-6 py-4">
                        <p className="text-sm">{poll.question}</p>
                      </div>

                      {/* Options */}
                      <div className="p-4 space-y-3">
                        {poll.options.map((option, index) => {
                          const percentage = getPercentage(option.votes, totalVotes);
                          
                          return (
                            <div key={option.id} className="relative">
                              <div className="relative flex items-center rounded-lg overflow-hidden">
                                {/* Progress Bar Background */}
                                <div 
                                  className="absolute inset-0 bg-primary-400 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                                
                                {/* Content */}
                                <div className="relative flex items-center w-full px-4 py-3">
                                  {/* Option Number */}
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-medium mr-3">
                                    {index + 1}
                                  </span>
                                  
                                  {/* Option Text */}
                                  <span className={`flex-1 text-sm font-medium ${
                                    percentage > 50 ? 'text-white' : 'text-gray-700'
                                  }`}>
                                    {option.text}
                                  </span>
                                  
                                  {/* Percentage */}
                                  <span className="text-sm font-semibold text-gray-700 ml-4">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
