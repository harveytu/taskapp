'use client';

import { Task } from '@/lib/types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  level?: number;
}

export default function TaskItem({
  task,
  onToggle,
  onDelete,
  onCreateSubtask,
  level = 0,
}: TaskItemProps) {
  const isSubtask = level > 0;

  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
        isSubtask ? 'ml-6' : ''
      }`}
    >
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        className={`flex-1 text-left min-h-[44px] flex items-center ${
          task.completed
            ? 'line-through text-gray-500'
            : 'text-gray-900'
        }`}
      >
        {task.text}
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onCreateSubtask(task.id)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Create subtask"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Delete task"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

