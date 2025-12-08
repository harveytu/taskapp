// Task App Main Logic

const TASK_APP_VERSION = '1.2.0';

// Application State
const TaskAppState = {
  currentTaskListId: null,
  taskLists: [],
  tasks: [],
  showCompleted: true,
  speechRecognition: null,
  isListening: false,
  recordingTimeout: null, // Timeout for 5-second auto-stop
  recordedTranscripts: [], // Accumulate all transcripts during recording
  lastProcessedResultIndex: 0, // Track last processed result index to avoid duplicates on mobile
  isManualStop: false, // Track if user manually stopped
  actionHistory: [] // Track actions for undo (max 10 actions)
};

// Main Task App Module
const TaskApp = {
  
  // Initialize the application
  async init() {
    try {
      // Initialize Web Speech API immediately (before async operations)
      this.initializeSpeechRecognition();

      // Set up event listeners immediately
      this.setupEventListeners();

      // Initialize data service
      await TaskDataService.initializeCollections();

      // Load task lists
      await this.loadTaskLists();

      // Load settings
      await this.loadSettings();

      // Display version
      const versionEl = document.getElementById('app-version-display');
      if (versionEl) {
        versionEl.textContent = `v${TASK_APP_VERSION}`;
      }

    } catch (error) {
      console.error('Error initializing Task app:', error);
    }
  },

  // Initialize Web Speech API
  initializeSpeechRecognition() {
    try {
      // Use pre-initialized recognition if available, otherwise create new one
      if (window._preInitSpeechRecognition) {
        TaskAppState.speechRecognition = window._preInitSpeechRecognition;
      } else {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          document.getElementById('mic-button').disabled = true;
          document.getElementById('mic-button').classList.add('opacity-50', 'cursor-not-allowed');
          return;
        }

        TaskAppState.speechRecognition = new SpeechRecognition();
      }
      TaskAppState.speechRecognition.continuous = true; // Keep listening continuously
      TaskAppState.speechRecognition.interimResults = true; // Get interim results to accumulate
      TaskAppState.speechRecognition.lang = 'en-US';

      TaskAppState.speechRecognition.onstart = () => {
        TaskAppState.isListening = true;
        TaskAppState.isManualStop = false;
        TaskAppState.recordedTranscripts = []; // Reset transcripts array
        TaskAppState.lastProcessedResultIndex = 0; // Reset result index tracker
        this.updateMicButtonState(true);
        
        // Set 5-second timeout to auto-stop
        TaskAppState.recordingTimeout = setTimeout(() => {
          TaskAppState.isManualStop = false; // Auto-stop, not manual
          this.stopRecording();
        }, 5000);
      };

      TaskAppState.speechRecognition.onresult = (event) => {
        // On mobile devices, event.results can contain duplicates from previous events
        // Only process results that are newer than what we've already processed
        for (let i = TaskAppState.lastProcessedResultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.trim();
          
          // Only process final results (not interim)
          if (result.isFinal && transcript) {
            // On mobile, the API often sends progressive results: "go", "go to", "go to the gym"
            // We want to keep only the longest/most complete version
            // Check if any existing transcript is a substring of this one (or vice versa)
            let shouldAdd = true;
            let replaceIndex = -1;
            
            for (let j = 0; j < TaskAppState.recordedTranscripts.length; j++) {
              const existing = TaskAppState.recordedTranscripts[j];
              
              // If the new transcript contains the existing one, replace it
              if (transcript.includes(existing) && transcript.length > existing.length) {
                replaceIndex = j;
                break;
              }
              // If the existing transcript contains the new one, don't add
              if (existing.includes(transcript) && existing.length >= transcript.length) {
                shouldAdd = false;
                break;
              }
              // If they're exactly the same, don't add
              if (existing === transcript) {
                shouldAdd = false;
                break;
              }
            }
            
            if (shouldAdd) {
              if (replaceIndex !== -1) {
                // Replace the shorter transcript with the longer one
                TaskAppState.recordedTranscripts[replaceIndex] = transcript;
              } else {
                // Add as new transcript (user said something new)
                TaskAppState.recordedTranscripts.push(transcript);
              }
            }
          }
        }
        
        // Update the last processed index to avoid reprocessing
        TaskAppState.lastProcessedResultIndex = event.results.length;
      };

      TaskAppState.speechRecognition.onerror = (event) => {
        
        // Don't stop on 'no-speech' error during continuous recording
        if (event.error === 'no-speech') {
          return; // Continue recording
        }
        
        // For other errors, stop recording
        this.stopRecording();
        this.showMessage('Speech recognition error. Please try again.', 'error');
      };

      TaskAppState.speechRecognition.onend = () => {
        // Clear timeout if it exists
        if (TaskAppState.recordingTimeout) {
          clearTimeout(TaskAppState.recordingTimeout);
          TaskAppState.recordingTimeout = null;
        }
        
        // Process transcripts (either manual stop or auto-stop)
        this.processRecordedTranscripts();
        
        TaskAppState.isListening = false;
        this.updateMicButtonState(false);
      };
      
    } catch (error) {
      document.getElementById('mic-button').disabled = true;
      document.getElementById('mic-button').classList.add('opacity-50', 'cursor-not-allowed');
    }
  },

  // Update mic button state
  updateMicButtonState(listening) {
    const micButton = document.getElementById('mic-button');
    const micStatus = document.getElementById('mic-status');
    
    if (listening) {
      micButton.classList.add('bg-red-500', 'text-white', 'listening');
      micButton.classList.remove('bg-green-100', 'text-green-700');
      micStatus.textContent = 'Listening...';
      micStatus.classList.remove('opacity-0');
      micStatus.classList.add('opacity-100');
    } else {
      micButton.classList.remove('bg-red-500', 'text-white', 'listening');
      micButton.classList.add('bg-green-100', 'text-green-700');
      micStatus.classList.remove('opacity-100');
      micStatus.classList.add('opacity-0');
    }
  },

  // Setup event listeners
  setupEventListeners() {
    // Task list dropdown
    document.getElementById('task-list-dropdown').addEventListener('change', (e) => {
      const taskListId = e.target.value;
      if (taskListId === 'create-new') {
        this.showCreateTaskListDialog();
      } else if (taskListId) {
        this.switchTaskList(taskListId);
      }
    });

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.showSettingsOverlay();
    });

    // Close settings button
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        this.hideSettingsOverlay();
      });
    }

    // Settings backdrop click
    const settingsBackdrop = document.getElementById('settings-backdrop');
    if (settingsBackdrop) {
      settingsBackdrop.addEventListener('click', () => {
        this.hideSettingsOverlay();
      });
    }

    // Sync data button
    const syncDataBtn = document.getElementById('sync-data-btn');
    if (syncDataBtn) {
      syncDataBtn.addEventListener('click', () => {
        this.syncData();
      });
    }

    // Save settings button
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    // Exit settings button
    const exitSettingsBtn = document.getElementById('exit-settings-btn');
    if (exitSettingsBtn) {
      exitSettingsBtn.addEventListener('click', () => {
        this.hideSettingsOverlay();
      });
    }

    // Rename task list select
    const renameTaskListSelect = document.getElementById('rename-task-list-select');
    if (renameTaskListSelect) {
      renameTaskListSelect.addEventListener('change', (e) => {
        const taskListId = e.target.value;
        if (taskListId) {
          const taskList = TaskAppState.taskLists.find(l => l.id === taskListId);
          if (taskList) {
            const container = document.getElementById('rename-task-list-edit-container');
            const input = document.getElementById('rename-task-list-input');
            if (container && input) {
              input.value = taskList.name;
              container.style.display = 'block';
              input.focus();
              input.select();
            }
          }
        } else {
          const container = document.getElementById('rename-task-list-edit-container');
          if (container) {
            container.style.display = 'none';
          }
        }
      });
    }

    // Rename task list input
    const renameTaskListInput = document.getElementById('rename-task-list-input');
    if (renameTaskListInput) {
      // Save on Enter
      renameTaskListInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await this.saveRenameTaskListFromDropdown();
        }
      });
      
      // Cancel on Escape
      renameTaskListInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.cancelRenameTaskListFromDropdown();
        }
      });
    }

    // Delete task list select
    const deleteTaskListSelect = document.getElementById('delete-task-list-select');
    if (deleteTaskListSelect) {
      deleteTaskListSelect.addEventListener('change', (e) => {
        // Optionally enable/disable delete button based on selection
        const deleteBtn = document.getElementById('delete-task-list-btn');
        if (deleteBtn) {
          deleteBtn.disabled = !e.target.value;
        }
      });
    }

    // Delete task list button
    const deleteTaskListBtn = document.getElementById('delete-task-list-btn');
    if (deleteTaskListBtn) {
      deleteTaskListBtn.addEventListener('click', () => {
        const select = document.getElementById('delete-task-list-select');
        if (select && select.value) {
          this.deleteTaskListById(select.value);
        } else {
          this.showMessage('Please select a task list to delete.', 'error');
        }
      });
    }

    // Mic button
    document.getElementById('mic-button').addEventListener('click', () => {
      this.startListening();
    });

    // Add task button
    document.getElementById('add-task-btn').addEventListener('click', () => {
      this.addTaskFromInput();
    });

    // Task input Enter key
    document.getElementById('task-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addTaskFromInput();
      }
    });

    // Filter completed button
    document.getElementById('filter-completed-btn').addEventListener('click', () => {
      this.toggleCompletedFilter();
    });

    // Toggle all button
    document.getElementById('toggle-all-btn').addEventListener('click', () => {
      this.toggleAllTasks();
    });

    // Undo button
    document.getElementById('undo-btn').addEventListener('click', () => {
      this.undoLastAction();
    });
  },

  // Load task lists
  async loadTaskLists() {
    try {
      const taskLists = await TaskDataService.loadTaskLists();
      TaskAppState.taskLists = taskLists;
      
      // If no task lists exist, don't create default - allow empty state
      if (taskLists.length === 0) {
        TaskAppState.currentTaskListId = null;
        TaskAppState.tasks = [];
        this.renderTasks();
        this.updateTaskListDropdown();
        this.updateSettingsTaskListDropdown();
        return;
      }
      
      // Load default task list from settings, or first task list
      const settings = await TaskDataService.loadSettings();
      const defaultTaskListId = settings?.defaultTaskListId;
      
      if (defaultTaskListId && taskLists.find(l => l.id === defaultTaskListId)) {
        this.switchTaskList(defaultTaskListId);
      } else {
        // Load first task list
        this.switchTaskList(taskLists[0].id);
      }
      
      this.updateTaskListDropdown();
      this.updateSettingsTaskListDropdown();
    } catch (error) {
      this.showMessage('Error loading task lists. Please refresh.', 'error');
    }
  },

  // Update task list dropdown
  updateTaskListDropdown() {
    const dropdown = document.getElementById('task-list-dropdown');
    const currentValue = dropdown.value;
    
    dropdown.innerHTML = '<option value="create-new">+ Create Task List</option>';
    
    TaskAppState.taskLists.forEach(list => {
      const option = document.createElement('option');
      option.value = list.id;
      option.textContent = list.name;
      dropdown.appendChild(option);
    });
    
    // Restore selection
    if (currentValue && TaskAppState.taskLists.find(l => l.id === currentValue)) {
      dropdown.value = currentValue;
    } else if (TaskAppState.currentTaskListId) {
      dropdown.value = TaskAppState.currentTaskListId;
    } else {
      // No task list selected
      dropdown.value = '';
    }
  },

  // Switch task list
  async switchTaskList(taskListId) {
    try {
      TaskAppState.currentTaskListId = taskListId;
      await this.loadTasks();
      this.updateTaskListDropdown();
    } catch (error) {
      this.showMessage('Error loading tasks. Please try again.', 'error');
    }
  },

  // Load tasks
  async loadTasks() {
    try {
      if (!TaskAppState.currentTaskListId) {
        TaskAppState.tasks = [];
        this.renderTasks();
        this.updateToggleAllButtonState();
        return;
      }
      
      const tasks = await TaskDataService.loadTasks(TaskAppState.currentTaskListId);
      TaskAppState.tasks = tasks;
      this.renderTasks();
      this.updateToggleAllButtonState();
    } catch (error) {
      this.showMessage('Error loading tasks. Please try again.', 'error');
    }
  },

  // Update toggle all button state based on current tasks
  updateToggleAllButtonState() {
    if (TaskAppState.tasks.length === 0) {
      const iconEl = document.getElementById('toggle-all-icon');
      const btnEl = document.getElementById('toggle-all-btn');
      iconEl.className = 'fas fa-check-double';
      iconEl.style.fontSize = '22px';
      btnEl.classList.remove('bg-green-100');
      btnEl.classList.add('bg-white');
      return;
    }
    
    const allCompleted = TaskAppState.tasks.every(t => t.completed);
    const iconEl = document.getElementById('toggle-all-icon');
    const btnEl = document.getElementById('toggle-all-btn');
    
    if (allCompleted) {
      iconEl.className = 'fas fa-undo';
      iconEl.style.fontSize = '22px';
      btnEl.classList.remove('bg-white');
      btnEl.classList.add('bg-green-100');
    } else {
      iconEl.className = 'fas fa-check-double';
      iconEl.style.fontSize = '22px';
      btnEl.classList.remove('bg-green-100');
      btnEl.classList.add('bg-white');
    }
  },

  // Render tasks
  renderTasks() {
    const container = document.getElementById('tasks-list');
    
    // Show message if no task list is selected
    if (!TaskAppState.currentTaskListId) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">No task list selected. Create one from the dropdown above!</p>';
      return;
    }
    
    if (TaskAppState.tasks.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">No tasks yet. Add one above!</p>';
      return;
    }

    // Separate tasks into parent tasks and subtasks
    const parentTasks = TaskAppState.tasks.filter(t => !t.parentTaskId);
    const subtasksMap = new Map();
    
    TaskAppState.tasks.forEach(task => {
      if (task.parentTaskId) {
        if (!subtasksMap.has(task.parentTaskId)) {
          subtasksMap.set(task.parentTaskId, []);
        }
        subtasksMap.get(task.parentTaskId).push(task);
      }
    });

    // Filter completed tasks if needed
    const visibleTasks = TaskAppState.showCompleted 
      ? parentTasks 
      : parentTasks.filter(t => !t.completed);

    if (visibleTasks.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">No tasks to display</p>';
      return;
    }

    container.innerHTML = visibleTasks.map((task, index) => {
      const subtasks = subtasksMap.get(task.id) || [];
      const visibleSubtasks = TaskAppState.showCompleted 
        ? subtasks 
        : subtasks.filter(t => !t.completed);
      
      const taskClass = task.completed ? 'line-through text-gray-400' : 'text-gray-800';
      
      // Main task in its own container
      const draggableAttr = !task.parentTaskId ? 'draggable="true"' : '';
      let html = `
        <div class="task-item-container bg-white rounded-lg shadow-sm mb-2 ${task.parentTaskId ? 'ml-4' : ''}" data-task-id="${task.id}" ${draggableAttr}>
          <div class="task-item flex items-center gap-1 rounded-lg" data-task-id="${task.id}">
            <div class="task-drag-handle flex-shrink-0 flex items-center justify-center cursor-grab" data-task-id="${task.id}">
              <i class="fas fa-grip-vertical text-gray-400" style="font-size: 18px;"></i>
            </div>
            <button class="task-checkbox flex-shrink-0 rounded-full border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex items-center justify-center transition-all" data-task-id="${task.id}">
              ${task.completed ? '<i class="fas fa-check text-white" style="font-size: 14px;"></i>' : ''}
            </button>
            <div class="task-text flex-1 min-w-0 ${taskClass}" data-task-id="${task.id}">${this.escapeHtml(task.text)}</div>
            <div class="flex items-center flex-shrink-0">
              <button class="task-delete flex-shrink-0 text-red-500 hover:text-red-700" data-task-id="${task.id}">
                <i class="fas fa-trash" style="font-size: 18px;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Subtasks in their own containers
      visibleSubtasks.forEach(subtask => {
        const subtaskClass = subtask.completed ? 'line-through text-gray-400' : 'text-gray-700';
        html += `
          <div class="task-item-container bg-white rounded-lg shadow-sm mb-2 ml-4" data-task-id="${subtask.id}" draggable="true">
            <div class="task-item flex items-center gap-1 rounded-lg" data-task-id="${subtask.id}">
              <div class="task-drag-handle flex-shrink-0 flex items-center justify-center cursor-grab" data-task-id="${subtask.id}">
                <i class="fas fa-grip-vertical text-gray-400" style="font-size: 18px;"></i>
              </div>
              <button class="task-checkbox flex-shrink-0 rounded-full border-2 ${subtask.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex items-center justify-center transition-all" data-task-id="${subtask.id}">
                ${subtask.completed ? '<i class="fas fa-check text-white" style="font-size: 14px;"></i>' : ''}
              </button>
              <div class="task-text flex-1 min-w-0 ${subtaskClass}" data-task-id="${subtask.id}">${this.escapeHtml(subtask.text)}</div>
              <div class="flex items-center flex-shrink-0">
                <button class="task-delete flex-shrink-0 text-red-500 hover:text-red-700" data-task-id="${subtask.id}">
                  <i class="fas fa-trash" style="font-size: 18px;"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      });
      
      return html;
    }).join('');

    // Declare drag tracking variables before event handlers (so they're in scope for all handlers)
    let draggingTaskId = null; // Store dragging task ID globally for this render
    let dragStartTime = 0;
    let dragStartPos = { x: 0, y: 0 };
    let isDragging = false; // Track if we're actively dragging
    let touchStartPos = { x: 0, y: 0 };
    let touchStartTime = 0;
    let touchTarget = null;
    let longPressTimer = null; // Timer for long-press rename
    let longPressTaskId = null; // Task ID for long-press
    let swipeStartPos = { x: 0, y: 0 }; // For swipe detection
    let swipeStartTime = 0;
    let swipeTarget = null;
    let dragFromHandle = false; // Track if drag was initiated from handle

    // Add event listeners for task text clicks - only for expansion, not toggle
    container.querySelectorAll('.task-text').forEach(el => {
      // Check if text is truncated and needs expansion
      const checkTextTruncation = () => {
        const isExpanded = el.classList.contains('expanded');
        
        if (!isExpanded) {
          // Check if text is actually truncated by comparing scrollWidth to clientWidth
          const isTruncated = el.scrollWidth > el.clientWidth;
          
          if (isTruncated) {
            el.title = 'Click to expand';
            el.setAttribute('data-truncated', 'true');
          } else {
            el.removeAttribute('data-truncated');
          }
        }
      };
      
      // Check on load and after resize
      setTimeout(checkTextTruncation, 100);
      window.addEventListener('resize', checkTextTruncation);
      
      el.addEventListener('click', (e) => {
        // Only handle text expansion, not task toggle
        if (el.classList.contains('expanded')) {
          // Text is expanded, collapse it
          e.stopPropagation();
          el.classList.remove('expanded');
          checkTextTruncation();
        } else {
          // Check if text is truncated
          const isTruncated = el.scrollWidth > el.clientWidth || el.getAttribute('data-truncated') === 'true';
          
          if (isTruncated) {
            // Expand the text
            e.preventDefault();
            e.stopPropagation();
            el.classList.add('expanded');
            el.title = 'Click to collapse';
          }
        }
      });
      
      // Double-click to collapse expanded text
      el.addEventListener('dblclick', (e) => {
        if (el.classList.contains('expanded')) {
          e.preventDefault();
          e.stopPropagation();
          el.classList.remove('expanded');
          el.title = 'Click to expand';
        }
      });
      
      // Long-press on task text to rename
      let textLongPressTimer = null;
      let textLongPressTaskId = null;
      let textMouseStartPos = { x: 0, y: 0 };
      
      el.addEventListener('mousedown', (e) => {
        const taskId = el.getAttribute('data-task-id');
        textLongPressTaskId = taskId;
        textMouseStartPos = { x: e.clientX, y: e.clientY };
        textLongPressTimer = setTimeout(() => {
          if (textLongPressTaskId === taskId) {
            this.startRenameTask(taskId);
          }
          textLongPressTimer = null;
        }, 500); // 500ms for long press
      });
      
      el.addEventListener('mouseup', () => {
        if (textLongPressTimer) {
          clearTimeout(textLongPressTimer);
          textLongPressTimer = null;
        }
        textLongPressTaskId = null;
      });
      
      el.addEventListener('mousemove', (e) => {
        if (textLongPressTimer) {
          const moved = Math.abs(e.clientX - textMouseStartPos.x) > 5 || 
                       Math.abs(e.clientY - textMouseStartPos.y) > 5;
          if (moved) {
            clearTimeout(textLongPressTimer);
            textLongPressTimer = null;
            textLongPressTaskId = null;
          }
        }
      });
      
      // Touch events for long-press on mobile
      let textTouchStartPos = { x: 0, y: 0 };
      let textTouchStartTime = 0;
      
      el.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        textTouchStartPos = { x: touch.clientX, y: touch.clientY };
        textTouchStartTime = Date.now();
        const taskId = el.getAttribute('data-task-id');
        textLongPressTaskId = taskId;
        textLongPressTimer = setTimeout(() => {
          if (textLongPressTaskId === taskId) {
            e.preventDefault();
            this.startRenameTask(taskId);
          }
          textLongPressTimer = null;
        }, 500); // 500ms for long press
      }, { passive: false });
      
      el.addEventListener('touchmove', (e) => {
        if (textLongPressTimer) {
          const touch = e.touches[0];
          const deltaX = Math.abs(touch.clientX - textTouchStartPos.x);
          const deltaY = Math.abs(touch.clientY - textTouchStartPos.y);
          if (deltaX > 8 || deltaY > 8) {
            clearTimeout(textLongPressTimer);
            textLongPressTimer = null;
            textLongPressTaskId = null;
          }
        }
      }, { passive: true });
      
      el.addEventListener('touchend', () => {
        if (textLongPressTimer) {
          clearTimeout(textLongPressTimer);
          textLongPressTimer = null;
        }
        textLongPressTaskId = null;
      }, { passive: true });
    });

    // Add event listeners for checkbox clicks
    container.querySelectorAll('.task-checkbox').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        this.toggleTask(taskId);
      });
    });

    container.querySelectorAll('.task-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        this.deleteTask(taskId);
      });
    });


    // Add swipe detection for making/unmaking subtasks - works on all tasks
    container.querySelectorAll('.task-item-container').forEach(containerEl => {
      const taskId = containerEl.getAttribute('data-task-id');
      const task = TaskAppState.tasks.find(t => t.id === taskId);
      
      if (!task) return;
      
      let swipeStartX = 0;
      let swipeStartY = 0;
      let swipeDetected = false;
      
      containerEl.addEventListener('touchstart', (e) => {
        // Don't track if touching a button or drag handle
        if (e.target.closest('button') || e.target.closest('.task-drag-handle')) {
          return;
        }
        
        const touch = e.touches[0];
        swipeStartX = touch.clientX;
        swipeStartY = touch.clientY;
        swipeStartPos = { x: touch.clientX, y: touch.clientY };
        swipeStartTime = Date.now();
        swipeTarget = containerEl;
        swipeDetected = false;
      }, { passive: true });

      containerEl.addEventListener('touchmove', (e) => {
        if (!swipeTarget || swipeTarget !== containerEl || swipeDetected) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - swipeStartX;
        const deltaY = Math.abs(touch.clientY - swipeStartY);
        
        // If horizontal movement is significant and vertical movement is minimal, it's a swipe
        if (Math.abs(deltaX) > 50 && deltaY < 30) {
          swipeDetected = true;
          
          if (deltaX > 0) {
            // Swipe right - make subtask (only if it's a parent task)
            if (!task.parentTaskId) {
              this.makeSubtask(taskId);
            }
          } else {
            // Swipe left - unindent (only if it's a subtask)
            if (task.parentTaskId) {
              this.unindentSubtask(taskId);
            }
          }
          
          swipeTarget = null;
        }
      }, { passive: true });

      containerEl.addEventListener('touchend', () => {
        swipeTarget = null;
        swipeDetected = false;
      }, { passive: true });
    });

    // Add drag and drop event listeners for all draggable tasks (parent and subtasks)
    // Only allow dragging from the drag handle (left side)
    container.querySelectorAll('.task-item-container[draggable="true"]').forEach(containerEl => {
      // Prevent buttons from starting drag
      containerEl.querySelectorAll('button').forEach(btn => {
        btn.setAttribute('draggable', 'false');
      });
      
      const dragHandle = containerEl.querySelector('.task-drag-handle');
      if (!dragHandle) return;

      // Track mouse down on drag handle to start drag
      dragHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        dragFromHandle = true;
        dragStartTime = Date.now();
        dragStartPos = { x: e.clientX, y: e.clientY };
      });

      // Touch events for mobile - only on drag handle
      dragHandle.addEventListener('touchstart', (e) => {
        dragFromHandle = true;
        const touch = e.touches[0];
        touchStartPos = { x: touch.clientX, y: touch.clientY };
        touchStartTime = Date.now();
        touchTarget = containerEl;
        isDragging = false;
      }, { passive: false });

      dragHandle.addEventListener('touchmove', (e) => {
        if (!touchTarget || touchTarget !== containerEl) return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.y);
        
        // If moved more than 8px, start dragging (lower threshold for easier activation)
        if ((deltaX > 8 || deltaY > 8) && !isDragging) {
          isDragging = true;
          draggingTaskId = containerEl.getAttribute('data-task-id');
          containerEl.classList.add('opacity-50', 'dragging');
          
          // Prevent scrolling while dragging
          e.preventDefault();
          
          // Create a visual feedback
          containerEl.style.transform = 'scale(1.02)';
          containerEl.style.transition = 'transform 0.1s';
          containerEl.style.zIndex = '1000';
          containerEl.style.position = 'relative';
        }
        
        if (isDragging) {
          e.preventDefault();
          
          // Find the element under the touch point
          const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
          const targetContainer = elementBelow?.closest('.task-item-container[draggable="true"]');
          
          // Remove drag-over from all containers
          document.querySelectorAll('.task-item-container').forEach(el => {
            if (el !== containerEl) {
              el.classList.remove('drag-over');
            }
          });
          
          // Add drag-over to the target container
          if (targetContainer && targetContainer !== containerEl) {
            const targetId = targetContainer.getAttribute('data-task-id');
            if (targetId !== draggingTaskId) {
              targetContainer.classList.add('drag-over');
            }
          }
        }
      }, { passive: false });

      dragHandle.addEventListener('touchend', async (e) => {
        if (!touchTarget || touchTarget !== containerEl) return;
        
        if (isDragging) {
          e.preventDefault();
          
          const touch = e.changedTouches[0];
          const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
          const targetContainer = elementBelow?.closest('.task-item-container[draggable="true"]');
          
          // Remove all drag-over classes
          document.querySelectorAll('.task-item-container').forEach(el => {
            el.classList.remove('drag-over');
            el.style.transform = '';
            el.style.transition = '';
            el.style.zIndex = '';
            el.style.position = '';
          });
          
          containerEl.classList.remove('opacity-50', 'dragging');
          
          if (targetContainer && targetContainer !== containerEl) {
            const targetTaskId = targetContainer.getAttribute('data-task-id');
            if (draggingTaskId && targetTaskId && draggingTaskId !== targetTaskId) {
              await this.reorderTasks(draggingTaskId, targetTaskId);
            }
          }
          
          draggingTaskId = null;
          isDragging = false;
        } else {
          // It was just a tap, not a drag - let the click handler deal with it
          const timeDiff = Date.now() - touchStartTime;
          const moved = Math.abs(e.changedTouches[0].clientX - touchStartPos.x) > 5 || 
                       Math.abs(e.changedTouches[0].clientY - touchStartPos.y) > 5;
          
          // If it was a quick tap without movement, it's a click
          if (timeDiff < 300 && !moved) {
            // Small delay to let click event fire
            setTimeout(() => {
              touchTarget = null;
            }, 50);
          }
        }
        
        touchTarget = null;
        dragFromHandle = false; // Reset flag
      });

      // Only allow dragstart from drag handle
      containerEl.addEventListener('dragstart', (e) => {
        // Only allow drag if initiated from handle
        if (!dragFromHandle) {
          e.preventDefault();
          return false;
        }
        
        draggingTaskId = containerEl.getAttribute('data-task-id');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggingTaskId);
        e.dataTransfer.setData('application/json', JSON.stringify({ taskId: draggingTaskId }));
        containerEl.classList.add('opacity-50', 'dragging');
        isDragging = true;
        dragFromHandle = false; // Reset flag
      });

      containerEl.addEventListener('dragend', (e) => {
        containerEl.classList.remove('opacity-50', 'dragging');
        // Remove all drag-over classes
        document.querySelectorAll('.task-item-container').forEach(el => {
          el.classList.remove('drag-over');
        });
        
        draggingTaskId = null;
        dragStartTime = 0;
        isDragging = false;
        dragFromHandle = false; // Reset flag
      });

      // Keep dragover, dragleave, and drop on container for drop zone functionality
      containerEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        const currentId = containerEl.getAttribute('data-task-id');
        
        // Don't highlight if dragging over itself
        if (draggingTaskId && draggingTaskId !== currentId) {
          containerEl.classList.add('drag-over');
        } else {
          containerEl.classList.remove('drag-over');
        }
      });

      containerEl.addEventListener('dragleave', (e) => {
        // Only remove if actually leaving the container (not entering a child)
        const rect = containerEl.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          containerEl.classList.remove('drag-over');
        }
      });

      containerEl.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        containerEl.classList.remove('drag-over');
        
        const draggedTaskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
        const targetTaskId = containerEl.getAttribute('data-task-id');
        
        if (draggedTaskId && targetTaskId && draggedTaskId !== targetTaskId) {
          await this.reorderTasks(draggedTaskId, targetTaskId);
        }
        
        draggingTaskId = null;
        isDragging = false;
      });
    });
  },

  // Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Start listening
  startListening() {
    if (!TaskAppState.speechRecognition) {
      this.showMessage('Speech recognition not available on this device.', 'error');
      return;
    }

    if (TaskAppState.isListening) {
      // If already listening, stop recording
      this.stopRecording();
      return;
    }

    try {
      TaskAppState.speechRecognition.start();
    } catch (error) {
      this.showMessage('Error starting voice input. Please try again.', 'error');
    }
  },

  // Stop recording and process transcripts
  stopRecording() {
    if (!TaskAppState.isListening) {
      return;
    }

    // Mark as manual stop
    TaskAppState.isManualStop = true;

    // Clear the timeout if it exists
    if (TaskAppState.recordingTimeout) {
      clearTimeout(TaskAppState.recordingTimeout);
      TaskAppState.recordingTimeout = null;
    }

    // Stop the recognition (onend will handle processing)
    try {
      TaskAppState.speechRecognition.stop();
    } catch (error) {
      // If stop fails, process manually
      TaskAppState.isListening = false;
      this.processRecordedTranscripts();
      this.updateMicButtonState(false);
    }
  },

  // Process all recorded transcripts into one task
  processRecordedTranscripts() {
    if (TaskAppState.recordedTranscripts.length === 0) {
      return;
    }

    // Combine all transcripts into one task
    const combinedText = TaskAppState.recordedTranscripts.join(' ').trim();
    
    if (combinedText) {
      this.createTaskFromText(combinedText);
    }

    // Clear transcripts for next recording
    TaskAppState.recordedTranscripts = [];
  },

  // Create task from text
  async createTaskFromText(text) {
    if (!text || !text.trim()) return;
    
    // If no task list is selected, show message
    if (!TaskAppState.currentTaskListId) {
      this.showMessage('Please select or create a task list first.', 'error');
      return;
    }
    
    try {
      const taskId = await TaskDataService.createTask(TaskAppState.currentTaskListId, text.trim());
      
      // Save action for undo
      this.saveAction({
        type: 'create',
        taskId: taskId
      });
      
      await this.loadTasks();
    } catch (error) {
      this.showMessage('Error creating task. Please try again.', 'error');
    }
  },

  // Add task from input
  async addTaskFromInput() {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    input.value = '';
    await this.createTaskFromText(text);
  },

  // Toggle task completed state (and all subtasks)
  async toggleTask(taskId) {
    try {
      const task = TaskAppState.tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const newCompletedState = !task.completed;
      
      // Save action for undo
      this.saveAction({
        type: 'toggle',
        taskId: taskId,
        previousState: task.completed,
        subtasks: TaskAppState.tasks.filter(t => t.parentTaskId === taskId).map(t => ({
          id: t.id,
          previousState: t.completed
        }))
      });
      
      // Update the task itself
      await TaskDataService.updateTask(taskId, { completed: newCompletedState });
      
      // Find and update all subtasks
      const subtasks = TaskAppState.tasks.filter(t => t.parentTaskId === taskId);
      if (subtasks.length > 0) {
        const db = firebase.firestore();
        const batch = db.batch();
        
        subtasks.forEach(subtask => {
          const subtaskRef = db.collection('tasks').doc(subtask.id);
          batch.update(subtaskRef, {
            completed: newCompletedState,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        
        await batch.commit();

        // Update cache for subtasks
        const now = new Date();
        subtasks.forEach(subtask => {
          subtask.completed = newCompletedState;
          subtask.updatedAt = now;
        });
        localStorage.setItem(`task_tasks_${TaskAppState.currentTaskListId}`, JSON.stringify(TaskAppState.tasks));
      }
      
      await this.loadTasks();
    } catch (error) {
      this.showMessage('Error updating task. Please try again.', 'error');
    }
  },

  // Delete task (with confirmation if it has subtasks)
  async deleteTask(taskId) {
    try {
      const task = TaskAppState.tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Check if task has subtasks
      const subtasks = TaskAppState.tasks.filter(t => t.parentTaskId === taskId);
      
      if (subtasks.length > 0) {
        // Confirm deletion if task has subtasks
        if (!confirm(`This task has ${subtasks.length} subtask(s). Delete this task and all its subtasks?`)) {
          return;
        }
      }
      
      // Save action for undo - save full task data
      const taskData = {
        id: task.id,
        text: task.text,
        completed: task.completed,
        parentTaskId: task.parentTaskId,
        order: task.order,
        taskListId: task.taskListId
      };
      const subtaskData = subtasks.map(t => ({
        id: t.id,
        text: t.text,
        completed: t.completed,
        parentTaskId: t.parentTaskId,
        order: t.order,
        taskListId: t.taskListId
      }));
      
      this.saveAction({
        type: 'delete',
        task: taskData,
        subtasks: subtaskData
      });
      
      // DeleteTask already handles deleting subtasks, so we can just call it
      await TaskDataService.deleteTask(taskId);
      await this.loadTasks();
    } catch (error) {
      this.showMessage('Error deleting task. Please try again.', 'error');
    }
  },

  // Make subtask
  async makeSubtask(taskId) {
    try {
      const task = TaskAppState.tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Find the task above this one (same level, not a subtask)
      const parentTasks = TaskAppState.tasks.filter(t => !t.parentTaskId);
      const currentIndex = parentTasks.findIndex(t => t.id === taskId);
      
      if (currentIndex > 0) {
        const parentTaskId = parentTasks[currentIndex - 1].id;
        await TaskDataService.makeSubtask(taskId, parentTaskId);
        
        // Update cache
        task.parentTaskId = parentTaskId;
        task.updatedAt = new Date();
        localStorage.setItem(`task_tasks_${TaskAppState.currentTaskListId}`, JSON.stringify(TaskAppState.tasks));
        
        await this.loadTasks();
      } else {
        this.showMessage('No task above to make parent', 'error');
      }
    } catch (error) {
      this.showMessage('Error making subtask. Please try again.', 'error');
    }
  },

  // Unindent subtask (make it a regular task)
  async unindentSubtask(taskId) {
    try {
      const task = TaskAppState.tasks.find(t => t.id === taskId);
      if (!task || !task.parentTaskId) return;
      
      await TaskDataService.updateTask(taskId, { parentTaskId: null });
      
      // Cache is already updated by updateTask, just reload
      await this.loadTasks();
    } catch (error) {
      this.showMessage('Error unindenting task. Please try again.', 'error');
    }
  },

  // Toggle completed filter
  toggleCompletedFilter() {
    TaskAppState.showCompleted = !TaskAppState.showCompleted;
    const iconEl = document.getElementById('filter-completed-icon');
    const btnEl = document.getElementById('filter-completed-btn');
    
    // Change icon and color based on state
    if (TaskAppState.showCompleted) {
      iconEl.className = 'fas fa-eye';
      iconEl.style.fontSize = '22px';
      btnEl.classList.remove('bg-blue-100');
      btnEl.classList.add('bg-white');
    } else {
      iconEl.className = 'fas fa-eye-slash';
      iconEl.style.fontSize = '22px';
      btnEl.classList.remove('bg-white');
      btnEl.classList.add('bg-blue-100');
    }
    
    this.renderTasks();
  },

  // Toggle all tasks
  async toggleAllTasks() {
    try {
      if (TaskAppState.tasks.length === 0) return;
      
      const allCompleted = TaskAppState.tasks.every(t => t.completed);
      const newState = !allCompleted;
      
      // Save action for undo
      const previousStates = TaskAppState.tasks.map(t => ({
        id: t.id,
        previousState: t.completed
      }));
      
      this.saveAction({
        type: 'toggleAll',
        previousStates: previousStates,
        newState: newState
      });
      
      await TaskDataService.toggleAllTasks(TaskAppState.currentTaskListId, newState);
      await this.loadTasks();
      
      // Update icon and color based on state
      const iconEl = document.getElementById('toggle-all-icon');
      const btnEl = document.getElementById('toggle-all-btn');
      
      if (newState) {
        // All tasks are now completed
        iconEl.className = 'fas fa-undo';
        iconEl.style.fontSize = '22px';
        btnEl.classList.remove('bg-white');
        btnEl.classList.add('bg-green-100');
      } else {
        // Tasks are uncompleted
        iconEl.className = 'fas fa-check-double';
        iconEl.style.fontSize = '22px';
        btnEl.classList.remove('bg-green-100');
        btnEl.classList.add('bg-white');
      }
    } catch (error) {
      this.showMessage('Error updating tasks. Please try again.', 'error');
    }
  },

  // Reorder tasks via drag and drop
  async reorderTasks(draggedTaskId, targetTaskId) {
    try {
      // Find the dragged and target tasks
      const draggedTask = TaskAppState.tasks.find(t => t.id === draggedTaskId);
      const targetTask = TaskAppState.tasks.find(t => t.id === targetTaskId);
      
      if (!draggedTask || !targetTask) return;
      
      // Determine if we're reordering parent tasks or subtasks
      const isSubtaskReorder = draggedTask.parentTaskId !== null;
      
      let tasksToReorder;
      if (isSubtaskReorder) {
        // Reordering subtasks - only reorder subtasks of the same parent
        const parentId = draggedTask.parentTaskId;
        if (targetTask.parentTaskId !== parentId) {
          // Can't drop subtask on a different parent's subtask
          return;
        }
        tasksToReorder = TaskAppState.tasks.filter(t => t.parentTaskId === parentId);
      } else {
        // Reordering parent tasks - only reorder parent tasks
        if (targetTask.parentTaskId !== null) {
          // Can't drop parent task on a subtask
          return;
        }
        tasksToReorder = TaskAppState.tasks.filter(t => !t.parentTaskId);
      }
      
      // Find indices
      const draggedIndex = tasksToReorder.findIndex(t => t.id === draggedTaskId);
      const targetIndex = tasksToReorder.findIndex(t => t.id === targetTaskId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Remove dragged task from array
      tasksToReorder.splice(draggedIndex, 1);
      
      // Insert at target position
      tasksToReorder.splice(targetIndex, 0, draggedTask);
      
      // Update order for all tasks in the group
      const db = firebase.firestore();
      const batch = db.batch();
      
      tasksToReorder.forEach((task, index) => {
        const taskRef = db.collection('tasks').doc(task.id);
        batch.update(taskRef, {
          order: index,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      // Update cache - use current state and update order
      tasksToReorder.forEach((task, index) => {
        task.order = index;
        task.updatedAt = new Date();
      });
      
      // Update all tasks in state (including those not reordered)
      TaskAppState.tasks.forEach(task => {
        const reorderedTask = tasksToReorder.find(t => t.id === task.id);
        if (reorderedTask) {
          task.order = reorderedTask.order;
          task.updatedAt = reorderedTask.updatedAt;
        }
      });
      
      // Save updated cache
      localStorage.setItem(`task_tasks_${TaskAppState.currentTaskListId}`, JSON.stringify(TaskAppState.tasks));
      
      // Reload tasks to reflect new order
      await this.loadTasks();
    } catch (error) {
      console.error('Error reordering tasks:', error);
      this.showMessage('Error reordering tasks. Please try again.', 'error');
    }
  },

  // Show create task list dialog
  showCreateTaskListDialog() {
    const name = prompt('Enter task list name:');
    if (name && name.trim()) {
      this.createTaskList(name.trim());
    } else {
      // Reset dropdown
      this.updateTaskListDropdown();
      if (TaskAppState.currentTaskListId) {
        document.getElementById('task-list-dropdown').value = TaskAppState.currentTaskListId;
      }
    }
  },

  // Create task list
  async createTaskList(name) {
    try {
      const taskListId = await TaskDataService.createTaskList(name);
      await this.loadTaskLists();
      this.switchTaskList(taskListId);
    } catch (error) {
      this.showMessage('Error creating task list. Please try again.', 'error');
    }
  },

  // Delete task list by ID
  async deleteTaskListById(taskListId) {
    try {
      if (!taskListId) return;
      
      const taskList = TaskAppState.taskLists.find(l => l.id === taskListId);
      if (!taskList) return;
      
      if (!confirm(`Are you sure you want to delete "${taskList.name}"? This will permanently delete the task list and all its tasks.`)) {
        return;
      }
      
      await TaskDataService.deleteTaskList(taskListId);
      
      // If we deleted the current task list, clear it
      if (taskListId === TaskAppState.currentTaskListId) {
        TaskAppState.currentTaskListId = null;
      }
      
      // After deletion, load task lists (which will handle empty state)
      await this.loadTaskLists();
      
      // Update settings dropdowns if overlay is open
      const overlay = document.getElementById('settings-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        this.updateDeleteTaskListDropdown();
        this.updateSettingsTaskListDropdown();
        this.updateRenameTaskListDropdown();
        
        // Clear the delete select
        const deleteSelect = document.getElementById('delete-task-list-select');
        if (deleteSelect) {
          deleteSelect.value = '';
        }
        const deleteBtn = document.getElementById('delete-task-list-btn');
        if (deleteBtn) {
          deleteBtn.disabled = true;
        }
      }
      
      this.showMessage('Task list deleted successfully!', 'success');
    } catch (error) {
      this.showMessage('Error deleting task list. Please try again.', 'error');
    }
  },

  // Show settings overlay
  showSettingsOverlay() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      this.updateSettingsTaskListDropdown();
      this.updateRenameTaskListDropdown();
      this.updateDeleteTaskListDropdown();
      // Reset rename UI
      const container = document.getElementById('rename-task-list-edit-container');
      const select = document.getElementById('rename-task-list-select');
      if (container && select) {
        select.value = '';
        container.style.display = 'none';
      }
      // Reset delete UI
      const deleteSelect = document.getElementById('delete-task-list-select');
      const deleteBtn = document.getElementById('delete-task-list-btn');
      if (deleteSelect) {
        deleteSelect.value = '';
      }
      if (deleteBtn) {
        deleteBtn.disabled = true;
      }
    }
  },

  // Hide settings overlay
  hideSettingsOverlay() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  },

  // Update settings task list dropdown
  async updateSettingsTaskListDropdown() {
    const select = document.getElementById('default-task-list-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a task list...</option>';
    
    TaskAppState.taskLists.forEach(list => {
      const option = document.createElement('option');
      option.value = list.id;
      option.textContent = list.name;
      select.appendChild(option);
    });
    
    // Restore selection from settings
    try {
      const settings = await TaskDataService.loadSettings();
      if (settings?.defaultTaskListId) {
        select.value = settings.defaultTaskListId;
      }
    } catch (error) {
      console.error('Error loading settings for dropdown:', error);
    }
  },

  // Update rename task list dropdown
  updateRenameTaskListDropdown() {
    const select = document.getElementById('rename-task-list-select');
    if (!select) return;
    
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Select a task list to rename...</option>';
    
    TaskAppState.taskLists.forEach(list => {
      const option = document.createElement('option');
      option.value = list.id;
      option.textContent = list.name;
      select.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentValue && TaskAppState.taskLists.find(l => l.id === currentValue)) {
      select.value = currentValue;
    }
  },

  // Update delete task list dropdown
  updateDeleteTaskListDropdown() {
    const select = document.getElementById('delete-task-list-select');
    if (!select) return;
    
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Select a task list to delete...</option>';
    
    TaskAppState.taskLists.forEach(list => {
      const option = document.createElement('option');
      option.value = list.id;
      option.textContent = list.name;
      select.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentValue && TaskAppState.taskLists.find(l => l.id === currentValue)) {
      select.value = currentValue;
    }
  },

  // Save rename task list from dropdown
  async saveRenameTaskListFromDropdown() {
    try {
      const select = document.getElementById('rename-task-list-select');
      const input = document.getElementById('rename-task-list-input');
      
      if (!select || !input) return;
      
      const taskListId = select.value;
      const newName = input.value.trim();
      
      if (!taskListId) {
        this.showMessage('Please select a task list to rename.', 'error');
        return;
      }
      
      if (!newName) {
        this.showMessage('Please enter a new name for the task list.', 'error');
        return;
      }
      
      // Check if name actually changed
      const taskList = TaskAppState.taskLists.find(l => l.id === taskListId);
      if (taskList && taskList.name === newName) {
        // No change, just hide the edit container
        const container = document.getElementById('rename-task-list-edit-container');
        if (container) {
          container.style.display = 'none';
        }
        return;
      }
      
      await TaskDataService.updateTaskListName(taskListId, newName);
      await this.loadTaskLists();
      
      // Update settings UI if overlay is open
      const overlay = document.getElementById('settings-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        this.updateSettingsTaskListDropdown();
        this.updateRenameTaskListDropdown();
        // Keep the same task list selected and update input value
        select.value = taskListId;
        input.value = newName;
      }
      
      this.showMessage('Task list renamed successfully!', 'success');
    } catch (error) {
      console.error('Error renaming task list:', error);
      this.showMessage('Error renaming task list. Please try again.', 'error');
    }
  },

  // Cancel rename task list from dropdown
  cancelRenameTaskListFromDropdown() {
    const select = document.getElementById('rename-task-list-select');
    const input = document.getElementById('rename-task-list-input');
    const container = document.getElementById('rename-task-list-edit-container');
    
    if (select && input && container) {
      const taskListId = select.value;
      if (taskListId) {
        const taskList = TaskAppState.taskLists.find(l => l.id === taskListId);
        if (taskList) {
          input.value = taskList.name;
        }
      }
      container.style.display = 'none';
    }
  },

  // Load settings
  async loadSettings() {
    try {
      const settings = await TaskDataService.loadSettings();
      return settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  },

  // Sync data from Firestore
  async syncData() {
    try {
      const syncBtn = document.getElementById('sync-data-btn');
      if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Syncing...';
      }

      await TaskDataService.syncAll();
      
      // Reload task lists and tasks
      await this.loadTaskLists();
      
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i class="fas fa-sync mr-2"></i>Sync with Firestore';
      }

      this.showMessage('Data synced successfully!', 'success');
    } catch (error) {
      console.error('Error syncing data:', error);
      this.showMessage('Error syncing data. Please try again.', 'error');
      
      const syncBtn = document.getElementById('sync-data-btn');
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i class="fas fa-sync mr-2"></i>Sync with Firestore';
      }
    }
  },

  // Save settings
  async saveSettings() {
    try {
      const select = document.getElementById('default-task-list-select');
      if (!select) return;
      
      const defaultTaskListId = select.value || null;
      
      await TaskDataService.saveSettings({ defaultTaskListId });
      
      // Close settings overlay and return to main task page
      this.hideSettingsOverlay();
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showMessage('Error saving settings. Please try again.', 'error');
    }
  },

  // Start renaming a task
  async startRenameTask(taskId) {
    try {
      const task = TaskAppState.tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Find the task text element
      const taskTextEl = document.querySelector(`.task-text[data-task-id="${taskId}"]`);
      if (!taskTextEl) return;
      
      // Create input field
      const input = document.createElement('input');
      input.type = 'text';
      input.value = task.text;
      input.className = 'flex-1 px-3 py-1 border-2 border-blue-500 rounded-lg outline-none text-base min-w-0';
      input.style.fontSize = '17px';
      input.style.paddingLeft = '12px';
      
      // Replace task text with input
      const parent = taskTextEl.parentElement;
      const originalText = taskTextEl.textContent;
      const originalClasses = taskTextEl.className;
      taskTextEl.style.display = 'none';
      parent.insertBefore(input, taskTextEl);
      input.focus();
      input.select();
      
      // Handle save on Enter
      const saveRename = async () => {
        const newText = input.value.trim();
        if (!newText) {
          // Cancel if empty
          input.remove();
          taskTextEl.style.display = '';
          return;
        }
        
        if (newText === originalText) {
          // No change, just cancel
          input.remove();
          taskTextEl.style.display = '';
          return;
        }
        
        try {
          await TaskDataService.updateTask(taskId, { text: newText });
          await this.loadTasks();
        } catch (error) {
          this.showMessage('Error renaming task. Please try again.', 'error');
          input.remove();
          taskTextEl.style.display = '';
        }
      };
      
      // Handle cancel on Escape
      const cancelRename = () => {
        input.remove();
        taskTextEl.style.display = '';
      };
      
      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await saveRename();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelRename();
        }
      });
      
      input.addEventListener('blur', async () => {
        // Small delay to allow Enter key to fire first
        setTimeout(async () => {
          if (document.contains(input)) {
            await saveRename();
          }
        }, 100);
      });
      
    } catch (error) {
      console.error('Error starting task rename:', error);
      this.showMessage('Error renaming task. Please try again.', 'error');
    }
  },

  // Save action to history for undo
  saveAction(action) {
    TaskAppState.actionHistory.push(action);
    // Keep only last 10 actions
    if (TaskAppState.actionHistory.length > 10) {
      TaskAppState.actionHistory.shift();
    }
  },

  // Undo last action
  async undoLastAction() {
    if (TaskAppState.actionHistory.length === 0) {
      this.showMessage('Nothing to undo', 'info');
      return;
    }

    const action = TaskAppState.actionHistory.pop();
    
    try {
      const db = firebase.firestore();
      
      switch (action.type) {
        case 'toggle':
          // Restore previous completion state
          await TaskDataService.updateTask(action.taskId, { completed: action.previousState });
          
          // Restore subtask states
          if (action.subtasks && action.subtasks.length > 0) {
            const batch = db.batch();
            action.subtasks.forEach(subtask => {
              const subtaskRef = db.collection('tasks').doc(subtask.id);
              batch.update(subtaskRef, {
                completed: subtask.previousState,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              });
            });
            await batch.commit();
          }
          
          await this.loadTasks();
          this.showMessage('Task state restored', 'success');
          break;
          
        case 'delete':
          // Restore deleted task
          const taskRef = db.collection('tasks').doc(action.task.id);
          await taskRef.set({
            ...action.task,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          // Restore subtasks
          if (action.subtasks && action.subtasks.length > 0) {
            const batch = db.batch();
            action.subtasks.forEach(subtask => {
              const subtaskRef = db.collection('tasks').doc(subtask.id);
              batch.set(subtaskRef, {
                ...subtask,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              });
            });
            await batch.commit();
          }
          
          await this.loadTasks();
          this.showMessage('Task restored', 'success');
          break;
          
        case 'create':
          // Delete the created task
          await TaskDataService.deleteTask(action.taskId);
          await this.loadTasks();
          this.showMessage('Task creation undone', 'success');
          break;
          
        case 'toggleAll':
          // Restore all previous states
          if (action.previousStates && action.previousStates.length > 0) {
            const batch = db.batch();
            action.previousStates.forEach(taskState => {
              const taskRef = db.collection('tasks').doc(taskState.id);
              batch.update(taskRef, {
                completed: taskState.previousState,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              });
            });
            await batch.commit();
          }
          
          await this.loadTasks();
          
          // Update toggle all button state
          const allCompleted = TaskAppState.tasks.every(t => t.completed);
          const iconEl = document.getElementById('toggle-all-icon');
          const btnEl = document.getElementById('toggle-all-btn');
          
          if (allCompleted) {
            iconEl.className = 'fas fa-undo';
            iconEl.style.fontSize = '22px';
            btnEl.classList.remove('bg-white');
            btnEl.classList.add('bg-green-100');
          } else {
            iconEl.className = 'fas fa-check-double';
            iconEl.style.fontSize = '22px';
            btnEl.classList.remove('bg-green-100');
            btnEl.classList.add('bg-white');
          }
          
          this.showMessage('Toggle all undone', 'success');
          break;
          
        default:
          this.showMessage('Cannot undo this action', 'error');
      }
    } catch (error) {
      console.error('Error undoing action:', error);
      this.showMessage('Error undoing action. Please try again.', 'error');
    }
  },

  // Show message
  showMessage(message, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-slate-500 text-white'
    }`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);

    // Remove after 3 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }
};

// Make available globally
window.TaskApp = TaskApp;
