import { Timestamp } from 'firebase/firestore';

export interface TaskList {
  id: string;
  name: string;
  userId: string;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  taskListId: string;
  text: string;
  completed: boolean;
  parentTaskId?: string;
  createdAt: Timestamp;
  order: number;
}

export interface Settings {
  id: string;
  showCompleted: boolean;
}

