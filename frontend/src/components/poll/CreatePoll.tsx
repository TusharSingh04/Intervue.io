import React, { useState } from 'react';
import { Sparkles, Plus, ChevronDown } from 'lucide-react';
import { Button } from '../common';
import { CreatePollPayload } from '../../types';

interface CreatePollProps {
  onCreatePoll: (payload: CreatePollPayload) => void;
  disabled?: boolean;
}

interface OptionItem {
  text: string;
  isCorrect: boolean;
}

const DEFAULT_DURATION = 60;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const MAX_QUESTION_LENGTH = 100;

export function CreatePoll({ onCreatePoll, disabled = false }: CreatePollProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<OptionItem[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const durationOptions = [15, 30, 45, 60, 90, 120];

  const addOption = () => {
    if (options.length < MAX_OPTIONS) {
      setOptions([...options, { text: '', isCorrect: false }]);
    }
  };

  const updateOptionText = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
    
    if (errors[`option${index}`]) {
      setErrors({ ...errors, [`option${index}`]: '' });
    }
  };

  const updateOptionCorrect = (index: number, isCorrect: boolean) => {
    const newOptions = [...options];
    newOptions[index].isCorrect = isCorrect;
    setOptions(newOptions);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!question.trim()) {
      newErrors.question = 'Question is required';
    }

    options.forEach((opt, index) => {
      if (!opt.text.trim()) {
        newErrors[`option${index}`] = 'Option cannot be empty';
      }
    });

    const trimmedOptions = options.map(o => o.text.trim().toLowerCase());
    const duplicates = trimmedOptions.filter((item, index) => 
      item && trimmedOptions.indexOf(item) !== index
    );
    if (duplicates.length > 0) {
      newErrors.options = 'Options must be unique';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const payload: CreatePollPayload = {
      question: question.trim(),
      options: options
        .filter(o => o.text.trim())
        .map(o => ({ text: o.text.trim(), isCorrect: o.isCorrect })),
      duration
    };

    onCreatePoll(payload);

    // Reset form
    setQuestion('');
    setOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]);
    setDuration(DEFAULT_DURATION);
    setErrors({});
  };

  return (
    <div className="bg-white rounded-xl p-6">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
        <Sparkles size={16} />
        <span>Intervue Poll</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-normal text-gray-700 mb-2">
        Let's <span className="font-bold">Get Started</span>
      </h1>

      {/* Subtitle */}
      <p className="text-gray-500 text-sm mb-8">
        you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Question Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Enter your question
            </label>
            {/* Duration Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {duration} seconds
                <ChevronDown size={16} />
              </button>
              {showDurationDropdown && (
                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  {durationOptions.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDuration(d);
                        setShowDurationDropdown(false);
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        duration === d ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                      }`}
                    >
                      {d} seconds
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Question Textarea */}
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => {
                if (e.target.value.length <= MAX_QUESTION_LENGTH) {
                  setQuestion(e.target.value);
                  if (errors.question) setErrors({ ...errors, question: '' });
                }
              }}
              placeholder="Type your question here..."
              rows={4}
              disabled={disabled}
              className={`w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.question ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            <span className="absolute bottom-3 right-3 text-xs text-gray-400">
              {question.length}/{MAX_QUESTION_LENGTH}
            </span>
          </div>
          {errors.question && (
            <p className="text-sm text-red-500 mt-1">{errors.question}</p>
          )}
        </div>

        {/* Options Section */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <span className="text-sm font-semibold text-gray-700 flex-1">Edit Options</span>
            <span className="text-sm font-semibold text-gray-700 w-32 text-center">Is it Correct?</span>
          </div>

          {errors.options && (
            <p className="text-sm text-red-500 mb-3">{errors.options}</p>
          )}

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-4">
                {/* Option Number */}
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>

                {/* Option Input */}
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOptionText(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  disabled={disabled}
                  className={`flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors[`option${index}`] ? 'border-red-500' : 'border-gray-200'
                  }`}
                />

                {/* Is Correct Radio Buttons */}
                <div className="flex items-center gap-4 w-32 justify-center">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={option.isCorrect === true}
                      onChange={() => updateOptionCorrect(index, true)}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">Yes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={option.isCorrect === false}
                      onChange={() => updateOptionCorrect(index, false)}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">No</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Option */}
          {options.length < MAX_OPTIONS && (
            <button
              type="button"
              onClick={addOption}
              disabled={disabled}
              className="mt-4 flex items-center gap-1 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus size={16} />
              Add More option
            </button>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={disabled}
            className="px-8"
          >
            Ask Question
          </Button>
        </div>
      </form>
    </div>
  );
}
