import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button, Input } from '../components';

export function HomePage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Check if user has a stored session
  useEffect(() => {
    const storedName = sessionStorage.getItem('participantName');
    const storedRole = sessionStorage.getItem('participantRole') as 'teacher' | 'student';
    
    if (storedName && storedRole) {
      navigate(`/${storedRole}`);
    }
  }, [navigate]);

  const handleContinue = () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }
    setShowNameInput(true);
  };

  const handleJoin = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    // Store in session storage for recovery
    sessionStorage.setItem('participantName', name.trim());
    sessionStorage.setItem('participantRole', selectedRole!);

    navigate(`/${selectedRole}`, { state: { name: name.trim() } });
  };

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
          <Sparkles size={16} />
          <span>Intervue Poll</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-normal text-gray-700 text-center mb-3">
          Enter your name to continue
        </h1>
        <p className="text-gray-500 text-center mb-8 max-w-md">
          You're joining as a {selectedRole === 'teacher' ? 'Teacher' : 'Student'}
        </p>

        <div className="w-full max-w-md space-y-6">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Enter your name"
            error={error}
          />

          <Button
            onClick={handleJoin}
            fullWidth
            size="lg"
            disabled={!name.trim()}
          >
            Continue
          </Button>

          <button
            onClick={() => setShowNameInput(false)}
            className="w-full text-center text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to role selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
        <Sparkles size={16} />
        <span>Intervue Poll</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-normal text-gray-700 text-center mb-3">
        Welcome to the <span className="font-bold">Live Polling System</span>
      </h1>

      {/* Subtitle */}
      <p className="text-gray-500 text-center mb-12 max-w-lg">
        Please select the role that best describes you to begin using the live polling system
      </p>

      {/* Role Cards */}
      <div className="flex flex-col md:flex-row gap-6 mb-10 w-full max-w-2xl">
        {/* Student Card */}
        <button
          onClick={() => {
            setSelectedRole('student');
            setError('');
          }}
          className={`flex-1 p-6 rounded-xl border-2 text-left transition-all duration-200 ${
            selectedRole === 'student'
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-primary-400'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-2 ${
            selectedRole === 'student' ? 'text-primary-600' : 'text-gray-700'
          }`}>
            I'm a Student
          </h3>
          <p className="text-gray-500 text-sm">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry
          </p>
        </button>

        {/* Teacher Card */}
        <button
          onClick={() => {
            setSelectedRole('teacher');
            setError('');
          }}
          className={`flex-1 p-6 rounded-xl border-2 text-left transition-all duration-200 ${
            selectedRole === 'teacher'
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-primary-400'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-2 ${
            selectedRole === 'teacher' ? 'text-primary-600' : 'text-gray-700'
          }`}>
            I'm a Teacher
          </h3>
          <p className="text-gray-500 text-sm">
            Submit answers and view live poll results in real-time.
          </p>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        size="lg"
        disabled={!selectedRole}
        className="px-16"
      >
        Continue
      </Button>
    </div>
  );
}
