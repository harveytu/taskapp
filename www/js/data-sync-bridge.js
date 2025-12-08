// Data Sync Bridge - Syncs data between WebView localStorage and native storage for widget access

const DataSyncBridge = {
  async syncTasksToNative() {
    try {
      // Import Capacitor Preferences
      const { Preferences } = await import('@capacitor/preferences');
      
      // Get current task list ID
      const currentTaskListId = localStorage.getItem('task_current_list_id');
      if (!currentTaskListId) return;

      // Load tasks from localStorage
      const tasksKey = `task_tasks_${currentTaskListId}`;
      const tasksJson = localStorage.getItem(tasksKey);
      if (!tasksJson) return;

      const tasks = JSON.parse(tasksJson);
      
      // Save to native storage
      await Preferences.set({
        key: 'tasks',
        value: JSON.stringify(tasks)
      });
      
      await Preferences.set({
        key: 'currentTaskListId',
        value: currentTaskListId
      });

      // Sync task lists
      const taskListsJson = localStorage.getItem('task_task_lists');
      if (taskListsJson) {
        await Preferences.set({
          key: 'taskLists',
          value: taskListsJson
        });
      }

      // Mark as synced
      await Preferences.set({
        key: 'widget_data_changed',
        value: 'false'
      });

      console.log('Tasks synced to native storage');
    } catch (error) {
      console.error('Error syncing tasks to native:', error);
    }
  },

  async syncTasksFromNative() {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      
      // Check if widget made changes
      const changed = await Preferences.get({ key: 'widget_data_changed' });
      if (changed.value !== 'true') return;

      // Load tasks from native storage
      const tasksData = await Preferences.get({ key: 'tasks' });
      const currentListIdData = await Preferences.get({ key: 'currentTaskListId' });
      
      if (!tasksData.value || !currentListIdData.value) return;

      const tasks = JSON.parse(tasksData.value);
      const currentListId = currentListIdData.value;

      // Update localStorage
      localStorage.setItem(`task_tasks_${currentListId}`, JSON.stringify(tasks));

      // Clear the changed flag
      await Preferences.set({
        key: 'widget_data_changed',
        value: 'false'
      });

      // Reload tasks in app
      if (window.TaskApp && window.TaskApp.loadTasks) {
        await window.TaskApp.loadTasks();
      }

      console.log('Tasks synced from native storage');
    } catch (error) {
      console.error('Error syncing tasks from native:', error);
    }
  },

  async init() {
    // Sync on load
    await this.syncTasksFromNative();
    
    // Set up periodic sync (every 5 seconds)
    setInterval(() => {
      this.syncTasksToNative();
      this.syncTasksFromNative();
    }, 5000);
  }
};

// Make available globally
window.DataSyncBridge = DataSyncBridge;

