"use client";

import React, { useState, useEffect } from 'react';
import StatusBanner from './StatusBanner';
import AddTaskForm from './AddTaskForm';
import TaskList from './TaskList';
import LeaveTracker from './LeaveTracker';
import { fetchMondayTasks, updateMondayTask } from '@/utils/monday';

const UnifiedDashboard = () => {
  const [tasks, setTasks] = useState({
    dailyTasks: [
      { id: 1, name: "Daily Task 1", status: "In Progress", type: "Daily", notes: "" },
      { id: 2, name: "Daily Task 2", status: "Not Started", type: "Daily", notes: "" }
    ],
    priorityTasks: [
      { id: 3, name: "Urgent Report", status: "In Progress", type: "Priority", notes: "Need to complete by EOD" }
    ],
    weeklyTasks: [
      { id: 4, name: "Project A", status: "Not Started", type: "Weekly", notes: "" },
      { id: 5, name: "Project B", status: "Done", type: "Weekly", notes: "Completed ahead of schedule" }
    ]
  });

  useEffect(() => {
    const loadTasks = async () => {
      const mondayTasks = await fetchMondayTasks();
      if (mondayTasks) {
        const grouped = mondayTasks.reduce((acc, task) => {
          const key = `${task.type}Tasks`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(task);
          return acc;
        }, {});
        setTasks(grouped);
      }
    };
  
    loadTasks();
  }, []);

  const handleAddTask = (newTask) => {
    const task = {
      id: Date.now(),
      name: newTask.name,
      status: "Not Started",
      type: newTask.type,
      notes: newTask.notes,
      priority: newTask.priority
    };

    setTasks(prev => {
      const key = `${newTask.type}Tasks`;
      return {
        ...prev,
        [key]: [...prev[key], task]
      };
    });
  };

  const handleUpdateStatus = async (taskId) => {
    const statusOrder = ["Not Started", "In Progress", "Done"];
    
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(key => {
        newTasks[key] = newTasks[key].map(task => {
          if (task.id === taskId) {
            const currentIndex = statusOrder.indexOf(task.status);
            const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
            
            // Update Monday.com
            updateMondayTask(taskId, 'status', { label: nextStatus });
            
            return { ...task, status: nextStatus };
          }
          return task;
        });
      });
      return newTasks;
    });
  };

  const handleAddNote = (taskId) => {
    const note = prompt("Enter note:");
    if (note !== null) {
      setTasks(prev => {
        const newTasks = { ...prev };
        Object.keys(newTasks).forEach(key => {
          newTasks[key] = newTasks[key].map(task => {
            if (task.id === taskId) {
              return { ...task, notes: note };
            }
            return task;
          });
        });
        return newTasks;
      });
    }
  };

  const handleStartDay = async () => {
    try {
      const response = await fetch('/api/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: 'management-management',
          message: "Good morning @Nick @Dan! 👋 Do you have any urgent or priority tasks for me today?"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send start day message');
      }

      // Reset daily tasks
      setTasks(prev => ({
        ...prev,
        dailyTasks: prev.dailyTasks.map(task => ({
          ...task,
          status: "Not Started"
        }))
      }));
    } catch (error) {
      console.error('Failed to start day:', error);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      const completedToday = [];
      const inProgress = [];
      
      Object.entries(tasks).forEach(([category, taskList]) => {
        taskList.forEach(task => {
          if (task.status === "Done") {
            completedToday.push(`• ${task.name}${task.notes ? ` - ${task.notes}` : ''}`);
          } else if (task.status === "In Progress") {
            inProgress.push(`• ${task.name}${task.notes ? ` - ${task.notes}` : ''}`);
          }
        });
      });

      const summary = `
*End of Day Update* 📝

*Completed Today:*
${completedToday.join('\n')}

*In Progress:*
${inProgress.join('\n')}
      `;

      const response = await fetch('/api/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: 'daily-updates-mgmt',
          message: summary
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send summary');
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Task Central</h1>
        <div className="space-x-2">
          <button 
            onClick={handleStartDay}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start Day
          </button>
          <button 
            onClick={handleGenerateSummary}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Generate Summary
          </button>
        </div>
      </div>

      <StatusBanner />
      <AddTaskForm onAdd={handleAddTask} />
      <LeaveTracker />

      <div className="space-y-6">
        <TaskList 
          tasks={tasks.dailyTasks} 
          title="📅 Daily Tasks" 
          onAddNote={handleAddNote}
          onUpdateStatus={handleUpdateStatus}
        />
        <TaskList 
          tasks={tasks.priorityTasks} 
          title="🚨 Priority Tasks" 
          onAddNote={handleAddNote}
          onUpdateStatus={handleUpdateStatus}
        />
        <TaskList 
          tasks={tasks.weeklyTasks} 
          title="📋 This Week's Tasks" 
          onAddNote={handleAddNote}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </div>
  );
};

export default UnifiedDashboard;