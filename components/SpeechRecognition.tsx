'use client';

import { useEffect } from 'react';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';

interface SpeechRecognitionProps {
  onTaskCreated: (text: string) => void;
}

export default function SpeechRecognition({ onTaskCreated }: SpeechRecognitionProps) {
  const { transcript, isListening, startListening, stopListening, error } =
    useSpeechRecognition(onTaskCreated);

  // Auto-initialize speech recognition on mount (priority loading)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Pre-warm the speech recognition API
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        // API is available, ready to use
        console.log('Speech recognition API ready');
      }
    }
  }, []);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="mb-4 flex flex-col items-center">
      <button
        onClick={handleToggle}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all min-h-[80px] min-w-[80px] ${
          isListening
            ? 'bg-red-500 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
      >
        <svg
          className="w-10 h-10 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {isListening ? (
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          ) : (
            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
          )}
        </svg>
      </button>
      {isListening && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">Listening...</p>
      )}
      {transcript && (
        <p className="mt-2 text-sm text-gray-700 max-w-md text-center">
          {transcript}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

