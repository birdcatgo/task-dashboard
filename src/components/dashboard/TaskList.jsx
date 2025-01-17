"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const TaskList = ({ tasks, title, onAddNote, onUpdateStatus }) => (
  <Card className="mb-4">
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex flex-col space-y-2 p-2 bg-gray-50 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => onUpdateStatus(task.id)} 
                  className="focus:outline-none"
                >
                  {task.status === "Done" && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {task.status === "In Progress" && <Clock className="h-5 w-5 text-blue-500" />}
                  {task.status === "Not Started" && <AlertCircle className="h-5 w-5 text-gray-500" />}
                </button>
                <div className="flex items-center space-x-2">
                  <span className={task.status === "Done" ? "line-through text-gray-500" : ""}>
                    {task.name}
                  </span>
                  {task.priority && task.priority !== 'normal' && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-500">{task.status}</span>
            </div>
            {task.notes && (
              <div className="text-sm text-gray-600 pl-7 border-l-2 border-gray-200">
                {task.notes}
              </div>
            )}
            <div className="pl-7">
              <button 
                onClick={() => onAddNote(task.id)} 
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {task.notes ? "Edit Note" : "Add Note"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default TaskList;