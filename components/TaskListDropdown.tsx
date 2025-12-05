'use client';

import { useState, useRef, useEffect } from 'react';
import { useTaskLists } from '@/lib/hooks/useTaskLists';
import ConfirmDialog from './ConfirmDialog';

interface TaskListDropdownProps {
  selectedTaskListId: string | null;
  onSelectTaskList: (id: string | null) => void;
}

export default function TaskListDropdown({
  selectedTaskListId,
  onSelectTaskList,
}: TaskListDropdownProps) {
  const { taskLists, createTaskList, deleteTaskList } = useTaskLists();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  const selectedList = taskLists.find((list) => list.id === selectedTaskListId);
  const displayName = selectedList?.name || 'My Tasks';

  useEffect(() => {
    // Set default to first list or create "My Tasks" if none exist
    if (hasInitializedRef.current) return;
    
    if (taskLists.length > 0 && !selectedTaskListId) {
      const defaultList = taskLists.find((list) => list.name === 'My Tasks') || taskLists[0];
      onSelectTaskList(defaultList.id);
      hasInitializedRef.current = true;
    } else if (taskLists.length === 0 && !selectedTaskListId) {
      // Create default "My Tasks" list
      createTaskList('My Tasks').then((id) => {
        if (id) {
          onSelectTaskList(id);
          hasInitializedRef.current = true;
        }
      });
    }
  }, [taskLists, selectedTaskListId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateList = async () => {
    if (newListName.trim()) {
      const id = await createTaskList(newListName.trim());
      if (id) {
        onSelectTaskList(id);
        setNewListName('');
        setShowCreateInput(false);
        setIsOpen(false);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedTaskListId) {
      const success = await deleteTaskList(selectedTaskListId);
      if (success) {
        const remainingLists = taskLists.filter((list) => list.id !== selectedTaskListId);
        if (remainingLists.length > 0) {
          onSelectTaskList(remainingLists[0].id);
        } else {
          onSelectTaskList(null);
        }
      }
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4" ref={dropdownRef}>
        <div className="relative flex-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between min-h-[44px] hover:bg-gray-50"
          >
            <span className="font-medium">{displayName}</span>
            <svg
              className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {showCreateInput ? (
                <div className="p-2 border-b">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateList();
                      } else if (e.key === 'Escape') {
                        setShowCreateInput(false);
                        setNewListName('');
                      }
                    }}
                    placeholder="Task list name"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCreateList}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm min-h-[44px]"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateInput(false);
                        setNewListName('');
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm min-h-[44px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateInput(true)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 border-b min-h-[44px] flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium text-blue-600">Create Task List</span>
                </button>
              )}

              {taskLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => {
                    onSelectTaskList(list.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 min-h-[44px] ${
                    list.id === selectedTaskListId ? 'bg-blue-50 font-medium' : ''
                  }`}
                >
                  {list.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTaskListId && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Delete task list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task List"
        message="Are you sure you want to delete this task list? All tasks in this list will be deleted."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

