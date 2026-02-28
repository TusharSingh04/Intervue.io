import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { IPollOption } from '../../types';

interface PollResultsProps {
  question: string;
  options: IPollOption[];
  userVoteOptionId?: string;
  showVotes?: boolean;
  title?: string;
  showCorrectAnswer?: boolean;
}

export function PollResults({
  question,
  options,
  userVoteOptionId,
  showVotes = true,
  title = 'Question',
  showCorrectAnswer = false
}: PollResultsProps) {
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  const getPercentage = (votes: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  // Keep original order (don't sort)
  const displayOptions = [...options];

  return (
    <div>
      {/* Title */}
      <h2 className="text-lg font-bold text-gray-700 mb-4">{title}</h2>

      {/* Poll Card */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
        {/* Purple Header with Question */}
        <div className="bg-primary-500 text-white px-6 py-4">
          <p className="text-sm">{question}</p>
        </div>

        {/* Options */}
        <div className="p-4 space-y-3">
          {displayOptions.map((option, index) => {
            const percentage = getPercentage(option.votes);
            const isSelected = option.id === userVoteOptionId;
            const isCorrect = showCorrectAnswer && option.isCorrect;
            
            return (
              <div key={option.id} className="relative">
                <div className={`relative flex items-center rounded-lg overflow-hidden ${
                  isCorrect ? 'ring-2 ring-green-500' : isSelected ? 'ring-2 ring-primary-500' : ''
                }`}>
                  {/* Progress Bar Background */}
                  <div 
                    className={`absolute inset-0 transition-all duration-500 ${
                      isCorrect ? 'bg-green-400' : 'bg-primary-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  
                  {/* Content */}
                  <div className="relative flex items-center w-full px-4 py-3">
                    {/* Option Number or Checkmark */}
                    {isCorrect ? (
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center mr-3">
                        <CheckCircle2 size={16} />
                      </span>
                    ) : (
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-medium mr-3">
                        {index + 1}
                      </span>
                    )}
                    
                    {/* Option Text */}
                    <span className={`flex-1 text-sm font-medium ${
                      percentage > 50 ? 'text-white' : isCorrect ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {option.text}
                      {isCorrect && <span className="ml-2 text-green-600 font-semibold">(Correct)</span>}
                    </span>
                    
                    {/* Percentage */}
                    <span className={`text-sm font-semibold ml-4 ${
                      isCorrect ? 'text-green-700' : 'text-gray-700'
                    }`}>
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
}
