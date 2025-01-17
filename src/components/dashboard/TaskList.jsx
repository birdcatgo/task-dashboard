"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Check, ChevronRight, ChevronDown } from 'lucide-react';

const TaskList = ({ tasks, title, onAddNote, onUpdateStatus, onMoveToNextDay, onUpdateType }) => {
  return (
    <Card className="mb-2">
      <CardHeader className="py-2 px-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <span className="text-xs text-gray-500">{tasks.length}</span>
        </div>
      </CardHeader>
      <CardContent className="py-1 px-3">
        <div className="space-y-1">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center text-sm py-0.5 hover:bg-gray-50 rounded group">
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
                    onChange={(e) => onUpdateType(task.id, e.target.value)}
                    className="text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-gray-500 hover:text-gray-700"
                  >
                    <option value="daily">Daily</option>
                    <option value="priority">Priority</option>
                    <option value="queued">Queued</option>
                  </select>
                  
                  {task.type === 'daily' && task.status !== 'Done' && (
                    <button
                      onClick={() => onMoveToNextDay(task.id)}
                      className="p-1 hover:text-purple-600"
                      title="Move to Next Day"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskList;