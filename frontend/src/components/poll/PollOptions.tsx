import React, { useState } from 'react';
import { Card, CardHeader, Button } from '../common';
import { IPollOption } from '../../types';
import { Check } from 'lucide-react';

interface PollOptionsProps {
  question: string;
  options: IPollOption[];
  onVote: (optionId: string) => void;
  disabled?: boolean;
  selectedOptionId?: string;
}

export function PollOptions({
  question,
  options,
  onVote,
  disabled = false,
  selectedOptionId
}: PollOptionsProps) {
  const [selected, setSelected] = useState<string | null>(selectedOptionId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (optionId: string) => {
    if (!disabled && !selectedOptionId) {
      setSelected(optionId);
    }
  };

  const handleSubmit = async () => {
    if (selected && !disabled) {
      setIsSubmitting(true);
      onVote(selected);
      // The socket will handle the response
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  const hasVoted = !!selectedOptionId;

  return (
    <Card>
      <CardHeader title="Question" />
      
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-gray-800">{question}</h4>
      </div>

      <div className="space-y-3 mb-6">
        {options.map((option, index) => {
          const isSelected = selected === option.id || selectedOptionId === option.id;
          const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
          
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={disabled || hasVoted}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all duration-200
                flex items-center gap-4
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }
                ${(disabled || hasVoted) && !isSelected ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold
                ${isSelected 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {isSelected ? <Check size={20} /> : optionLetter}
              </span>
              <span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                {option.text}
              </span>
            </button>
          );
        })}
      </div>

      {!hasVoted && (
        <Button
          onClick={handleSubmit}
          disabled={!selected || disabled}
          isLoading={isSubmitting}
          fullWidth
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </Button>
      )}

      {hasVoted && (
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <span className="text-green-700 font-medium">
            ✓ Your vote has been recorded
          </span>
        </div>
      )}
    </Card>
  );
}
