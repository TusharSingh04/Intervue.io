import React from 'react';
import { Sparkles } from 'lucide-react';

export function KickedOut() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
        <Sparkles size={16} />
        <span>Intervue Poll</span>
      </div>

      {/* Heading */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center">
        You've been Kicked out !
      </h1>

      {/* Description */}
      <p className="text-gray-500 text-center max-w-md">
        Looks like the teacher had removed you from the poll system .Please
        <br />
        Try again sometime.
      </p>
    </div>
  );
}
