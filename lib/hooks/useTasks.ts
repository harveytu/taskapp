'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { getDb } from '../firestore';
import { Task } from '../types';

export function useTasks(taskListId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !taskListId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const tasksRef = collection(getDb(), 'tasks');
    const q = query(
      tasksRef,
      where('taskListId', '==', taskListId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const taskList: Task[] = [];
        snapshot.forEach((doc) => {
          taskList.push({ id: doc.id, ...doc.data() } as Task);
        });
        setTasks(taskList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskListId]);

  const createTask = async (
    text: string,
    parentTaskId?: string
  ): Promise<string | null> => {
    if (!taskListId) return null;

    try {
      const tasksRef = collection(getDb(), 'tasks');
      const existingTasks = tasks.filter((t) => t.taskListId === taskListId);
      const docRef = await addDoc(tasksRef, {
        taskListId,
        text,
        completed: false,
        parentTaskId: parentTaskId || null,
        createdAt: Timestamp.now(),
        order: existingTasks.length,
      });
      return docRef.id;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const toggleTask = async (id: string, completed: boolean): Promise<boolean> => {
    try {
      await updateDoc(doc(getDb(), 'tasks', id), {
        completed,
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(getDb(), 'tasks', id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const toggleAllTasks = async (completed: boolean): Promise<boolean> => {
    if (!taskListId) return false;

    try {
      const tasksRef = collection(getDb(), 'tasks');
      const q = query(tasksRef, where('taskListId', '==', taskListId));
      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map((docSnapshot) =>
        updateDoc(doc(getDb(), 'tasks', docSnapshot.id), { completed })
      );
      
      await Promise.all(updatePromises);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    toggleTask,
    deleteTask,
    toggleAllTasks,
  };
}

