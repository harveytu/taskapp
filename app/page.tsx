'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TaskListDropdown from '@/components/TaskListDropdown';
import SpeechRecognition from '@/components/SpeechRecognition';
import TaskInput from '@/components/TaskInput';
import TaskList from '@/components/TaskList';
import { useTasks } from '@/lib/hooks/useTasks';

export default function Home() {
  const [selectedTaskListId, setSelectedTaskListId] = useState<string | null>(null);
  const { createTask } = useTasks(selectedTaskListId);
  const router = useRouter();

  // Priority: Initialize speech recognition API immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        // Pre-warm the API
        console.log('Speech recognition API initialized');
      }
    }
  }, []);

  const handleTaskCreated = async (text: string) => {
    if (selectedTaskListId && text.trim()) {
      await createTask(text.trim());
    }
  };

  const handleAddTask = async (text: string) => {
    if (selectedTaskListId && text.trim()) {
      await createTask(text.trim());
    }
  };

  const handleCreateSubtask = async (parentTaskId: string) => {
    const text = prompt('Enter subtask:');
    if (text && selectedTaskListId) {
      await createTask(text.trim(), parentTaskId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">TaskApp</h1>
          <Link
            href="/settings"
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <TaskListDropdown
          selectedTaskListId={selectedTaskListId}
          onSelectTaskList={setSelectedTaskListId}
        />

        <SpeechRecognition onTaskCreated={handleTaskCreated} />

        <TaskInput onAddTask={handleAddTask} />

        <TaskList taskListId={selectedTaskListId} onCreateSubtask={handleCreateSubtask} />
      </main>
    </div>
  );
}

