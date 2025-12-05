'use client';

import { useState } from 'react';
import { useTasks } from '@/lib/hooks/useTasks';
import { Task } from '@/lib/types';
import TaskItem from './TaskItem';

interface TaskListProps {
  taskListId: string | null;
  onCreateSubtask: (parentTaskId: string) => void;
}

export default function TaskList({ taskListId, onCreateSubtask }: TaskListProps) {
  const { tasks, toggleTask, deleteTask, toggleAllTasks } = useTasks(taskListId);
  const [showCompleted, setShowCompleted] = useState(true);

  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter((task) => !task.completed);

  const topLevelTasks = filteredTasks.filter((task) => !task.parentTaskId);
  const subtasks = filteredTasks.filter((task) => task.parentTaskId);

  const getSubtasksForParent = (parentId: string): Task[] => {
    return subtasks.filter((task) => task.parentTaskId === parentId);
  };

  const allCompleted = tasks.length > 0 && tasks.every((task) => task.completed);
  const hasTasks = tasks.length > 0;

  return (
    <div>
      {hasTasks && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px]"
            aria-label={showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
          >
            <svg
              className={`w-5 h-5 ${showCompleted ? 'text-green-600' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="text-sm">
              {showCompleted ? 'Hide Completed' : 'Show Completed'}
            </span>
          </button>

          <button
            onClick={() => toggleAllTasks(!allCompleted)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px] text-sm"
            aria-label={allCompleted ? 'Mark all incomplete' : 'Mark all complete'}
          >
            {allCompleted ? 'Mark All Incomplete' : 'Mark All Complete'}
          </button>
        </div>
      )}

      <div className="space-y-1">
        {topLevelTasks.length === 0 && !taskListId && (
          <p className="text-center text-gray-500 py-8">Select or create a task list to get started</p>
        )}
        {topLevelTasks.length === 0 && taskListId && (
          <p className="text-center text-gray-500 py-8">No tasks yet. Add one above!</p>
        )}
        {topLevelTasks.map((task) => (
          <div key={task.id}>
            <TaskItem
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onCreateSubtask={onCreateSubtask}
              level={0}
            />
            {getSubtasksForParent(task.id).map((subtask) => (
              <TaskItem
                key={subtask.id}
                task={subtask}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onCreateSubtask={onCreateSubtask}
                level={1}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

