'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { getDb } from '../firestore';
import { TaskList } from '../types';

const DEFAULT_USER_ID = 'default-user';

export function useTaskLists() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const taskListsRef = collection(getDb(), 'taskLists');
    const q = query(
      taskListsRef,
      where('userId', '==', DEFAULT_USER_ID),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lists: TaskList[] = [];
        snapshot.forEach((doc) => {
          lists.push({ id: doc.id, ...doc.data() } as TaskList);
        });
        setTaskLists(lists);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const createTaskList = async (name: string): Promise<string | null> => {
    try {
      const taskListsRef = collection(getDb(), 'taskLists');
      const docRef = await addDoc(taskListsRef, {
        name,
        userId: DEFAULT_USER_ID,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const deleteTaskList = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(getDb(), 'taskLists', id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    taskLists,
    loading,
    error,
    createTaskList,
    deleteTaskList,
  };
}

