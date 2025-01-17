"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Plus } from 'lucide-react';

const AddTaskForm = ({ onAdd }) => {
  const [newTask, setNewTask] = useState({ 
    name: '', 
    type: 'weekly', 
    notes: '', 
    priority: 'normal' 
  });
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Add New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Task name"
              className="p-2 border rounded w-full"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            />
            <div className="flex space-x-2">
              <select
                className="p-2 border rounded flex-1"
                value={newTask.type}
                onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
              >
                <option value="daily">Daily Task</option>
                <option value="priority">Priority Task</option>
                <option value="weekly">Weekly Task</option>
              </select>
              <select
                className="p-2 border rounded flex-1"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <textarea
            placeholder="Add notes or details about the task"
            className="w-full p-2 border rounded h-20"
            value={newTask.notes}
            onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setNewTask({ name: '', type: 'weekly', notes: '', priority: 'normal' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
            <button
              onClick={() => {
                if (newTask.name) {
                  onAdd(newTask);
                  setNewTask({ name: '', type: 'weekly', notes: '', priority: 'normal' });
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddTaskForm;