// Task Data Manager - Firestore operations for tasks and task lists

const TASK_COLLECTIONS = {
  TASK_LISTS: 'task_lists',
  TASKS: 'tasks',
  SETTINGS: 'task_settings'
};

// Task Data Service
const TaskDataService = {
  
  // Initialize collections
  async initializeCollections() {
    try {
      // Collections will be created automatically on first write
    } catch (error) {
      throw error;
    }
  },

  // Load all task lists for current user (from cache only, auto-sync if no cache)
  async loadTaskLists() {
    try {
      // Load from cache first
      const cachedTaskLists = localStorage.getItem('task_task_lists');
      if (cachedTaskLists) {
        try {
          const taskLists = JSON.parse(cachedTaskLists);
          // Convert date strings back to Date objects
          return taskLists.map(list => ({
            ...list,
            createdAt: list.createdAt ? new Date(list.createdAt) : null,
            updatedAt: list.updatedAt ? new Date(list.updatedAt) : null
          }));
        } catch (e) {
          // Invalid cache, sync from Firestore
          console.error('Error parsing cached task lists:', e);
          return await this.syncTaskLists();
        }
      }

      // No cache, auto-sync from Firestore
      return await this.syncTaskLists();
    } catch (error) {
      throw error;
    }
  },

  // Sync task lists from Firestore to cache
  async syncTaskLists() {
    try {
      const db = firebase.firestore();
      const snapshot = await db.collection(TASK_COLLECTIONS.TASK_LISTS)
        .orderBy('createdAt', 'desc')
        .get();
      
      const taskLists = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        taskLists.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate() : null,
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
        });
      });

      // Update cache
      localStorage.setItem('task_task_lists', JSON.stringify(taskLists));

      return taskLists;
    } catch (error) {
      throw error;
    }
  },

  // Load tasks for a specific list (from cache only, auto-sync if no cache)
  async loadTasks(taskListId) {
    try {
      // If no taskListId, return empty array
      if (!taskListId) {
        return [];
      }

      // Load from cache first
      const cachedTasks = localStorage.getItem(`task_tasks_${taskListId}`);
      if (cachedTasks) {
        try {
          const tasks = JSON.parse(cachedTasks);
          // Convert date strings back to Date objects
          const tasksWithDates = tasks.map(task => ({
            ...task,
            createdAt: task.createdAt ? new Date(task.createdAt) : null,
            updatedAt: task.updatedAt ? new Date(task.updatedAt) : null
          }));

          // Sort in memory by order field (ascending)
          tasksWithDates.sort((a, b) => {
            const orderA = a.order || 0;
            const orderB = b.order || 0;
            return orderA - orderB;
          });

          return tasksWithDates;
        } catch (e) {
          // Invalid cache, sync from Firestore
          console.error('Error parsing cached tasks:', e);
          return await this.syncTasks(taskListId);
        }
      }

      // No cache, auto-sync from Firestore
      return await this.syncTasks(taskListId);
    } catch (error) {
      throw error;
    }
  },

  // Sync tasks for a specific list from Firestore to cache
  async syncTasks(taskListId) {
    try {
      // If no taskListId, return empty array
      if (!taskListId) {
        return [];
      }

      const db = firebase.firestore();
      // Fetch without orderBy to avoid requiring composite index
      const snapshot = await db.collection(TASK_COLLECTIONS.TASKS)
        .where('taskListId', '==', taskListId)
        .get();
      
      const tasks = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate() : null,
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
        });
      });

      // Sort in memory by order field (ascending)
      tasks.sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        return orderA - orderB;
      });

      // Update cache
      localStorage.setItem(`task_tasks_${taskListId}`, JSON.stringify(tasks));

      return tasks;
    } catch (error) {
      throw error;
    }
  },

  // Create new task list
  async createTaskList(name) {
    try {
      const db = firebase.firestore();
      const taskListRef = db.collection(TASK_COLLECTIONS.TASK_LISTS).doc();
      
      const now = new Date();
      const taskList = {
        id: taskListRef.id,
        name: name,
        userId: firebase.auth().currentUser ? firebase.auth().currentUser.email : 'anonymous',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await taskListRef.set(taskList);

      // Update cache
      const cachedTaskLists = await this.loadTaskLists();
      cachedTaskLists.unshift({
        ...taskList,
        createdAt: now,
        updatedAt: now
      });
      localStorage.setItem('task_task_lists', JSON.stringify(cachedTaskLists));

      return taskListRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Update task list name
  async updateTaskListName(taskListId, newName) {
    try {
      const db = firebase.firestore();
      const taskListRef = db.collection(TASK_COLLECTIONS.TASK_LISTS).doc(taskListId);
      
      await taskListRef.update({
        name: newName,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Update cache
      const cachedTaskLists = await this.loadTaskLists();
      const taskListIndex = cachedTaskLists.findIndex(l => l.id === taskListId);
      if (taskListIndex !== -1) {
        cachedTaskLists[taskListIndex].name = newName;
        cachedTaskLists[taskListIndex].updatedAt = new Date();
        localStorage.setItem('task_task_lists', JSON.stringify(cachedTaskLists));
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Delete task list and all its tasks
  async deleteTaskList(taskListId) {
    try {
      const db = firebase.firestore();
      
      // Delete all tasks in the list
      const tasksSnapshot = await db.collection(TASK_COLLECTIONS.TASKS)
        .where('taskListId', '==', taskListId)
        .get();
      
      const batch = db.batch();
      tasksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete the task list
      batch.delete(db.collection(TASK_COLLECTIONS.TASK_LISTS).doc(taskListId));
      
      await batch.commit();

      // Update cache - remove task list
      const cachedTaskLists = await this.loadTaskLists();
      const filteredTaskLists = cachedTaskLists.filter(l => l.id !== taskListId);
      localStorage.setItem('task_task_lists', JSON.stringify(filteredTaskLists));

      // Remove tasks cache for this list
      localStorage.removeItem(`task_tasks_${taskListId}`);

      return true;
    } catch (error) {
      throw error;
    }
  },

  // Create new task
  async createTask(taskListId, text, parentTaskId = null) {
    try {
      const db = firebase.firestore();
      const taskRef = db.collection(TASK_COLLECTIONS.TASKS).doc();
      
      // Get current max order for this list
      const existingTasks = await this.loadTasks(taskListId);
      const maxOrder = existingTasks.length > 0 
        ? Math.max(...existingTasks.map(t => t.order || 0))
        : -1;
      
      const now = new Date();
      const task = {
        id: taskRef.id,
        taskListId: taskListId,
        text: text,
        completed: false,
        parentTaskId: parentTaskId,
        order: maxOrder + 1,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await taskRef.set(task);

      // Update cache
      existingTasks.push({
        ...task,
        createdAt: now,
        updatedAt: now
      });
      localStorage.setItem(`task_tasks_${taskListId}`, JSON.stringify(existingTasks));

      return taskRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Update task
  async updateTask(taskId, updates) {
    try {
      const db = firebase.firestore();
      const taskRef = db.collection(TASK_COLLECTIONS.TASKS).doc(taskId);
      
      // Get task to find taskListId for cache update
      const taskDoc = await taskRef.get();
      if (!taskDoc.exists) {
        throw new Error('Task not found');
      }
      const taskData = taskDoc.data();
      const taskListId = taskData.taskListId;
      
      const updateData = {
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await taskRef.update(updateData);

      // Update cache
      const cachedTasks = await this.loadTasks(taskListId);
      const taskIndex = cachedTasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        Object.assign(cachedTasks[taskIndex], updates);
        cachedTasks[taskIndex].updatedAt = new Date();
        localStorage.setItem(`task_tasks_${taskListId}`, JSON.stringify(cachedTasks));
      }

      return taskId;
    } catch (error) {
      throw error;
    }
  },

  // Delete task
  async deleteTask(taskId) {
    try {
      const db = firebase.firestore();
      
      // Get task to find taskListId for cache update
      const taskRef = db.collection(TASK_COLLECTIONS.TASKS).doc(taskId);
      const taskDoc = await taskRef.get();
      if (!taskDoc.exists) {
        throw new Error('Task not found');
      }
      const taskData = taskDoc.data();
      const taskListId = taskData.taskListId;
      
      // Check if task has subtasks
      const subtasksSnapshot = await db.collection(TASK_COLLECTIONS.TASKS)
        .where('parentTaskId', '==', taskId)
        .get();
      
      // Delete subtasks first
      const batch = db.batch();
      const subtaskIds = [];
      subtasksSnapshot.forEach(doc => {
        subtaskIds.push(doc.id);
        batch.delete(doc.ref);
      });
      
      // Delete the task
      batch.delete(taskRef);
      
      await batch.commit();

      // Update cache - remove task and subtasks
      const cachedTasks = await this.loadTasks(taskListId);
      const filteredTasks = cachedTasks.filter(t => t.id !== taskId && !subtaskIds.includes(t.id));
      localStorage.setItem(`task_tasks_${taskListId}`, JSON.stringify(filteredTasks));

      return true;
    } catch (error) {
      throw error;
    }
  },

  // Make task a subtask of another task
  async makeSubtask(taskId, parentTaskId) {
    try {
      await this.updateTask(taskId, { parentTaskId: parentTaskId });
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Toggle all tasks completed/uncompleted
  async toggleAllTasks(taskListId, completed) {
    try {
      const db = firebase.firestore();
      const tasks = await this.loadTasks(taskListId);
      
      const batch = db.batch();
      tasks.forEach(task => {
        const taskRef = db.collection(TASK_COLLECTIONS.TASKS).doc(task.id);
        batch.update(taskRef, {
          completed: completed,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();

      // Update cache
      tasks.forEach(task => {
        task.completed = completed;
        task.updatedAt = new Date();
      });
      localStorage.setItem(`task_tasks_${taskListId}`, JSON.stringify(tasks));

      return true;
    } catch (error) {
      throw error;
    }
  },

  // Sync all data from Firestore to cache
  async syncAll() {
    try {
      // Sync task lists
      await this.syncTaskLists();
      
      // Get all task lists and sync their tasks
      const taskLists = await this.loadTaskLists();
      for (const taskList of taskLists) {
        await this.syncTasks(taskList.id);
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Load settings
  async loadSettings() {
    try {
      // Try to load from cache first
      const cachedSettings = localStorage.getItem('task_settings');
      if (cachedSettings) {
        try {
          return JSON.parse(cachedSettings);
        } catch (e) {
          // Invalid cache, continue to Firestore
        }
      }

      const db = firebase.firestore();
      const userId = firebase.auth().currentUser ? firebase.auth().currentUser.email : 'anonymous';
      const settingsDoc = await db.collection(TASK_COLLECTIONS.SETTINGS)
        .doc(userId)
        .get();

      if (settingsDoc.exists) {
        const settings = settingsDoc.data();
        // Cache the settings
        localStorage.setItem('task_settings', JSON.stringify(settings));
        return settings;
      }

      return null;
    } catch (error) {
      throw error;
    }
  },

  // Save settings
  async saveSettings(settings) {
    try {
      const db = firebase.firestore();
      const userId = firebase.auth().currentUser ? firebase.auth().currentUser.email : 'anonymous';
      const settingsRef = db.collection(TASK_COLLECTIONS.SETTINGS).doc(userId);

      const settingsData = {
        ...settings,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await settingsRef.set(settingsData, { merge: true });

      // Cache the settings
      localStorage.setItem('task_settings', JSON.stringify(settingsData));

      return true;
    } catch (error) {
      throw error;
    }
  }
};

// Make available globally
window.TaskDataService = TaskDataService;
