package com.taskapp;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class TaskWidgetProvider extends AppWidgetProvider {
    private static final String TAG = "TaskWidgetProvider";
    private static final String PREFS_NAME = "TaskAppPrefs";
    private static final String KEY_TASKS = "tasks";
    private static final String KEY_CURRENT_LIST_ID = "currentTaskListId";
    private static final String KEY_TASK_LISTS = "taskLists";

    // Action constants
    private static final String ACTION_TOGGLE_TASK = "com.taskapp.TOGGLE_TASK";
    private static final String ACTION_DELETE_TASK = "com.taskapp.DELETE_TASK";
    private static final String ACTION_ADD_TASK = "com.taskapp.ADD_TASK";
    private static final String ACTION_REFRESH = "com.taskapp.REFRESH";
    private static final String ACTION_OPEN_APP = "com.taskapp.OPEN_APP";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        
        String action = intent.getAction();
        if (action == null) return;

        if (ACTION_TOGGLE_TASK.equals(action)) {
            String taskId = intent.getStringExtra("taskId");
            toggleTask(context, taskId);
        } else if (ACTION_DELETE_TASK.equals(action)) {
            String taskId = intent.getStringExtra("taskId");
            deleteTask(context, taskId);
        } else if (ACTION_ADD_TASK.equals(action)) {
            String taskText = intent.getStringExtra("taskText");
            addTask(context, taskText);
        } else if (ACTION_REFRESH.equals(action)) {
            refreshWidget(context);
        } else if (ACTION_OPEN_APP.equals(action)) {
            openApp(context);
        }
    }

    private void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_task_list);

        // Load tasks from SharedPreferences
        List<Task> tasks = loadTasks(context);
        String currentListId = getCurrentTaskListId(context);
        String currentListName = getCurrentTaskListName(context, currentListId);

        // Set title
        if (currentListName != null && !currentListName.isEmpty()) {
            views.setTextViewText(R.id.widget_title, currentListName);
        } else {
            views.setTextViewText(R.id.widget_title, "Task List");
        }

        // Clear existing tasks
        views.removeAllViews(R.id.widget_tasks_container);

        // Add tasks to widget
        if (tasks.isEmpty()) {
            RemoteViews emptyView = new RemoteViews(context.getPackageName(), android.R.layout.simple_list_item_1);
            emptyView.setTextViewText(android.R.id.text1, "No tasks yet");
            views.addView(R.id.widget_tasks_container, emptyView);
        } else {
            for (Task task : tasks) {
                RemoteViews taskView = createTaskView(context, task);
                views.addView(R.id.widget_tasks_container, taskView);
            }
        }

        // Set up refresh button
        Intent refreshIntent = new Intent(context, TaskWidgetProvider.class);
        refreshIntent.setAction(ACTION_REFRESH);
        refreshIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        PendingIntent refreshPendingIntent = PendingIntent.getBroadcast(
            context, 0, refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_refresh_btn, refreshPendingIntent);

        // Set up add task button - opens main app for adding tasks
        // (Widget EditText has limitations, so we open the app instead)
        Intent addIntent = new Intent(context, MainActivity.class);
        addIntent.putExtra("action", "add_task");
        PendingIntent addPendingIntent = PendingIntent.getActivity(
            context, 0, addIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_add_btn, addPendingIntent);
        
        // Also make the input field open the app
        views.setOnClickPendingIntent(R.id.widget_task_input, addPendingIntent);

        // Set up task input (will be handled via add button)
        // Note: Direct text input in widgets is limited, so we'll use a simple approach

        // Set up widget click to open app
        Intent appIntent = new Intent(context, MainActivity.class);
        PendingIntent appPendingIntent = PendingIntent.getActivity(
            context, 0, appIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_title, appPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private RemoteViews createTaskView(Context context, Task task) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_task_item);

        // Set task text
        views.setTextViewText(R.id.widget_task_text, task.text);
        
        // Set checkbox state
        views.setBoolean(R.id.widget_task_checkbox, "setChecked", task.completed);
        
        // If completed, strike through text (using text color as visual indicator)
        if (task.completed) {
            views.setTextColor(R.id.widget_task_text, 0xFF9CA3AF); // Gray color
        } else {
            views.setTextColor(R.id.widget_task_text, 0xFF1F2937); // Dark color
        }

        // Set up checkbox click
        Intent toggleIntent = new Intent(context, TaskWidgetProvider.class);
        toggleIntent.setAction(ACTION_TOGGLE_TASK);
        toggleIntent.putExtra("taskId", task.id);
        PendingIntent togglePendingIntent = PendingIntent.getBroadcast(
            context, task.id.hashCode(), toggleIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_task_checkbox, togglePendingIntent);

        // Set up delete button
        Intent deleteIntent = new Intent(context, TaskWidgetProvider.class);
        deleteIntent.setAction(ACTION_DELETE_TASK);
        deleteIntent.putExtra("taskId", task.id);
        PendingIntent deletePendingIntent = PendingIntent.getBroadcast(
            context, task.id.hashCode() + 1000, deleteIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_task_delete, deletePendingIntent);

        return views;
    }

    private void toggleTask(Context context, String taskId) {
        List<Task> tasks = loadTasks(context);
        for (Task task : tasks) {
            if (task.id.equals(taskId)) {
                task.completed = !task.completed;
                break;
            }
        }
        saveTasks(context, tasks);
        syncToWebView(context, tasks);
        refreshWidget(context);
    }

    private void deleteTask(Context context, String taskId) {
        List<Task> tasks = loadTasks(context);
        tasks.removeIf(task -> task.id.equals(taskId));
        saveTasks(context, tasks);
        syncToWebView(context, tasks);
        refreshWidget(context);
    }

    private void addTask(Context context, String taskText) {
        if (taskText == null || taskText.trim().isEmpty()) {
            // Widget EditText limitations: We can't directly read text from widget EditText
            // So we'll open the main app for adding tasks, or use a workaround
            // For now, open the app to add tasks
            openApp(context);
            return;
        }

        String currentListId = getCurrentTaskListId(context);
        if (currentListId == null || currentListId.isEmpty()) {
            return;
        }

        List<Task> tasks = loadTasks(context);
        Task newTask = new Task();
        newTask.id = "widget_" + System.currentTimeMillis();
        newTask.text = taskText.trim();
        newTask.completed = false;
        newTask.taskListId = currentListId;
        newTask.order = tasks.size();
        
        tasks.add(newTask);
        saveTasks(context, tasks);
        syncToWebView(context, tasks);
        refreshWidget(context);
    }

    private void refreshWidget(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(
            new android.content.ComponentName(context, TaskWidgetProvider.class));
        onUpdate(context, appWidgetManager, appWidgetIds);
    }

    private void openApp(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    private List<Task> loadTasks(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String tasksJson = prefs.getString(KEY_TASKS, "[]");
        String currentListId = getCurrentTaskListId(context);
        
        List<Task> tasks = new ArrayList<>();
        try {
            JSONArray jsonArray = new JSONArray(tasksJson);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject taskObj = jsonArray.getJSONObject(i);
                Task task = new Task();
                task.id = taskObj.optString("id", "");
                task.text = taskObj.optString("text", "");
                task.completed = taskObj.optBoolean("completed", false);
                task.taskListId = taskObj.optString("taskListId", "");
                task.order = taskObj.optInt("order", 0);
                
                // Only load tasks for current list
                if (currentListId != null && currentListId.equals(task.taskListId)) {
                    tasks.add(task);
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error loading tasks", e);
        }
        
        return tasks;
    }

    private void saveTasks(Context context, List<Task> tasks) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        JSONArray jsonArray = new JSONArray();
        
        // Load all tasks first
        String allTasksJson = prefs.getString(KEY_TASKS, "[]");
        String currentListId = getCurrentTaskListId(context);
        List<Task> allTasks = new ArrayList<>();
        
        try {
            JSONArray allTasksArray = new JSONArray(allTasksJson);
            for (int i = 0; i < allTasksArray.length(); i++) {
                JSONObject taskObj = allTasksArray.getJSONObject(i);
                String taskListId = taskObj.optString("taskListId", "");
                // Keep tasks from other lists
                if (currentListId == null || !currentListId.equals(taskListId)) {
                    allTasks.add(parseTask(taskObj));
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error parsing all tasks", e);
        }
        
        // Add updated tasks
        allTasks.addAll(tasks);
        
        // Save back
        JSONArray saveArray = new JSONArray();
        for (Task task : allTasks) {
            try {
                JSONObject taskObj = new JSONObject();
                taskObj.put("id", task.id);
                taskObj.put("text", task.text);
                taskObj.put("completed", task.completed);
                taskObj.put("taskListId", task.taskListId);
                taskObj.put("order", task.order);
                saveArray.put(taskObj);
            } catch (JSONException e) {
                Log.e(TAG, "Error saving task", e);
            }
        }
        
        prefs.edit().putString(KEY_TASKS, saveArray.toString()).apply();
    }

    private Task parseTask(JSONObject taskObj) {
        Task task = new Task();
        task.id = taskObj.optString("id", "");
        task.text = taskObj.optString("text", "");
        task.completed = taskObj.optBoolean("completed", false);
        task.taskListId = taskObj.optString("taskListId", "");
        task.order = taskObj.optInt("order", 0);
        return task;
    }

    private String getCurrentTaskListId(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_CURRENT_LIST_ID, null);
    }

    private String getCurrentTaskListName(Context context, String listId) {
        if (listId == null) return null;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String listsJson = prefs.getString(KEY_TASK_LISTS, "[]");
        try {
            JSONArray jsonArray = new JSONArray(listsJson);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject listObj = jsonArray.getJSONObject(i);
                if (listId.equals(listObj.optString("id", ""))) {
                    return listObj.optString("name", "");
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error loading task lists", e);
        }
        return null;
    }

    private void syncToWebView(Context context, List<Task> tasks) {
        // This will be called by the data sync layer to notify WebView
        // For now, we just save to SharedPreferences and the WebView will read it
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean("widget_data_changed", true).apply();
    }

    // Task data class
    static class Task {
        String id;
        String text;
        boolean completed;
        String taskListId;
        int order;
    }
}

