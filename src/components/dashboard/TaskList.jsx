"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Check, ChevronRight, ChevronDown } from 'lucide-react';

const TaskItem = ({ task, onUpdateStatus, onAddNote, onMoveToNextDay, isPreview, onUpdateType }) => (
  <div className="flex items-center text-sm py-0.5 hover:bg-gray-50 rounded group">
    <button 
      onClick={() => onUpdateStatus(task.id)} 
      className="focus:outline-none mr-2"
    >
      {task.status === "Done" ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <div className="w-4 h-4 border rounded hover:border-gray-400" />
      )}
    </button>

    <div className="flex-1 flex items-center min-w-0 space-x-2">
      <span className={task.status === "Done" ? "line-through text-gray-500" : ""}>
        {task.name}
      </span>
      {task.time && (
        <span className="text-xs text-gray-400">
          @ {task.time}
        </span>
      )}
      {!task.isSystem && (
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const note = e.target.note.value.trim();
            onAddNote(task.id, note);
          }}
          className="flex-1"
        >
          <input
            name="note"
            type="text"
            defaultValue={task.notes || ''}
            placeholder="Add note..."
            className="w-full text-xs bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-gray-500"
            onBlur={(e) => {
              const note = e.target.value.trim();
              if (note !== task.notes) {
                onAddNote(task.id, note);
              }
            }}
          />
        </form>
      )}
    </div>

    {!task.isSystem && (
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
        <select
          value={task.type}
          onChange={(e) => onUpdateType?.(task.id, e.target.value)}
          className="text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-gray-500 hover:text-gray-700"
        >
          <option value="daily">Daily</option>
          <option value="priority">Priority</option>
          <option value="queued">Queued</option>
        </select>
        
        {/* Add ability to move any task to tomorrow */}
        {task.status !== 'Done' && (
          <button
            onClick={() => onMoveToNextDay(task.id)}
            className="p-1 hover:text-purple-600"
            title="Move to Tomorrow"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    )}

    {isPreview && (
      <span className="text-xs text-gray-400 ml-2">
        {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
      </span>
    )}
  </div>
);

const TaskList = ({ tasks, title, description, onAddNote, onUpdateStatus, onMoveToNextDay, isPreview, showCompletedSeparator, onUpdateType }) => {
  // Group tasks by completion status if separator is needed
  const activeAndCompletedTasks = showCompletedSeparator ? {
    active: tasks.filter(t => t.status !== "Done"),
    completed: tasks.filter(t => t.status === "Done")
  } : null;

  // Add this function to handle moving all tasks
  const handleMoveAllToTomorrow = () => {
    if (!onMoveToNextDay) return;
    
    // Get IDs of all non-completed tasks
    const taskIds = tasks
      .filter(task => task.status !== 'Done')
      .map(task => task.id);
    
    if (taskIds.length > 0) {
      onMoveToNextDay(taskIds);
    }
  };

  return (
    <Card className={`mb-2 ${isPreview ? 'bg-gray-50' : ''}`}>
      <CardHeader className="py-2 px-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm font-medium">
              {title}
              {isPreview && (
                <span className="ml-2 text-xs text-gray-500">
                  (Preview)
                </span>
              )}
            </CardTitle>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Only show Move All button if we have the handler and there are tasks */}
            {title === "Queued Tasks (Not Scheduled)" && tasks.length > 0 && onMoveToNextDay && (
              <button
                onClick={handleMoveAllToTomorrow}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                title="Move All to Tomorrow"
              >
                <ChevronRight className="h-3 w-3" />
                Move All to Tomorrow
              </button>
            )}
            <span className="text-xs text-gray-500">{tasks.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-1 px-3">
        {tasks.length > 0 ? (
          <div className="space-y-1">
            {showCompletedSeparator ? (
              <>
                {/* Active Tasks */}
                {activeAndCompletedTasks.active.map(task => (
                  <TaskItem 
                    key={task.id}
                    task={task}
                    onUpdateStatus={onUpdateStatus}
                    onAddNote={onAddNote}
                    onMoveToNextDay={onMoveToNextDay}
                    onUpdateType={onUpdateType}
                    isPreview={isPreview}
                  />
                ))}
                
                {/* Completed Tasks Section */}
                {activeAndCompletedTasks.completed.length > 0 && (
                  <>
                    <div className="flex items-center my-2">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="mx-2 text-xs text-gray-400">Completed</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                    {activeAndCompletedTasks.completed.map(task => (
                      <TaskItem 
                        key={task.id}
                        task={task}
                        onUpdateStatus={onUpdateStatus}
                        onAddNote={onAddNote}
                        onMoveToNextDay={onMoveToNextDay}
                        onUpdateType={onUpdateType}
                        isPreview={isPreview}
                      />
                    ))}
                  </>
                )}
              </>
            ) : (
              // Regular task list without separation
              tasks.map(task => (
                <TaskItem 
                  key={task.id}
                  task={task}
                  onUpdateStatus={onUpdateStatus}
                  onAddNote={onAddNote}
                  onMoveToNextDay={onMoveToNextDay}
                  onUpdateType={onUpdateType}
                  isPreview={isPreview}
                />
              ))
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500 py-2 text-center">
            No tasks scheduled
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskList;