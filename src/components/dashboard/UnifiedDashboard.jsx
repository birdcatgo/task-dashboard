"use client";

import React, { useState, useEffect } from 'react';
import AddTaskForm from './AddTaskForm';
import TaskList from './TaskList';
import { fetchMondayTasks, updateMondayTask, moveTaskToNextDay, MONDAY_API_URL, BOARD_ID, LEAVE_BOARD_ID } from '@/utils/monday';
import ClientOnly from '../ClientOnly';
import { Card } from '../ui/card';
import StatusStrip from './StatusStrip';
import LeaveModal from './LeaveModal';
import { MessageSquare, Send, Check, RotateCw } from 'lucide-react';

const SYSTEM_TASKS = [
  {
    id: 'system-1',
    name: 'Check Priority Tasks',
    type: 'system',
    status: 'Not Started',
    notes: '',
    isSystem: true,
    time: '08:00', // 8 AM NZT
    action: async () => {
      try {
        const message = "Hi Nick & Dan, checking if there are any priority tasks that need to be addressed today?";
        const response = await fetch('/api/slack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channel: 'management-management',
            message
          })
        });
        if (!response.ok) throw new Error('Failed to send priority check message');
      } catch (error) {
        console.error('Error sending priority check:', error);
        alert('Failed to send priority check message');
      }
    }
  },
  {
    id: 'system-2',
    name: 'Send Daily Update',
    type: 'system',
    status: 'Not Started',
    notes: '',
    isSystem: true,
    time: '16:00' // 4 PM NZT
  },
  {
    id: 'system-3',
    name: 'Plan Tomorrow',
    type: 'system',
    status: 'Not Started',
    notes: '',
    isSystem: true,
    time: '16:30' // 4:30 PM NZT
  }
];

const TASK_SECTIONS = {
  system: "System Tasks",
  daily: "Daily Tasks",
  priority: "Priority Tasks",
  queued: "Queued Tasks",
  tomorrow: "Tomorrow's Tasks"
};

const UnifiedDashboard = () => {
  // Initialize with null/empty values
  const [tasks, setTasks] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [selectedForSummary, setSelectedForSummary] = useState(new Set());

  // Load saved data after mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }

    const savedLeaves = localStorage.getItem('leaves');
    if (savedLeaves) {
      setLeaves(JSON.parse(savedLeaves));
    }
  }, []);

  // Save tasks to localStorage when they change
  useEffect(() => {
    if (tasks) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Save leaves to localStorage when they change
  useEffect(() => {
    if (leaves.length > 0) {
      localStorage.setItem('leaves', JSON.stringify(leaves));
    }
  }, [leaves]);

  // Fetch tasks from Monday.com
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/monday/tasks');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${data.details || response.statusText}`);
        }
        
        if (data) {
          setTasks(data);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  if (!tasks) {
    return (
      <ClientOnly>
        <div className="container mx-auto p-4">
          <div className="text-center">
            {isLoading ? "Loading tasks..." : "Error loading tasks"}
          </div>
        </div>
      </ClientOnly>
    );
  }

  const handleAddTask = async (newTask) => {
    try {
      // First add to Monday.com
      const mutation = `
        mutation {
          create_item (
            board_id: ${BOARD_ID},
            item_name: "${newTask.name}",
            column_values: ${JSON.stringify(JSON.stringify({
              status: { label: "Need To Do" },
              type: newTask.type
            }))}
          ) {
            id
          }
        }
      `;

      const response = await fetch('/api/monday/create-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mutation })
      });

      const data = await response.json();
      
      if (!response.ok || !data.data?.create_item?.id) {
        console.error('Monday.com API response:', data);
        throw new Error(data.error || 'Failed to create task on Monday.com');
      }

      // Create the new task object
      const task = {
        id: data.data.create_item.id,
        name: newTask.name,
        status: "Need To Do",
        type: newTask.type,
        notes: newTask.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update local state first
      setTasks(prev => {
        const key = `${newTask.type}Tasks`;
        const updatedTasks = {
          ...prev,
          [key]: [...(prev[key] || []), task]
        };
        
        // Sort the tasks using the same logic as in monday.js
        const statusOrder = {
          'NEW': 0,
          'Need To Do': 1,
          'Working On It': 2,
          'Follow Up': 3,
          'Done': 4
        };

        Object.keys(updatedTasks).forEach(key => {
          updatedTasks[key].sort((a, b) => {
            return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
          });
        });

        return updatedTasks;
      });

      // Then fetch fresh data in the background
      try {
        const tasksResponse = await fetch('/api/monday/tasks');
        const tasksData = await tasksResponse.json();
        if (tasksResponse.ok && tasksData) {
          setTasks(tasksData);
        }
      } catch (refreshError) {
        console.error('Error refreshing tasks:', refreshError);
        // Don't throw here as the task was already created successfully
      }
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task: ' + error.message);
    }
  };

  const handleUpdateStatus = async (taskId) => {
    const statusOrder = [
      "Need To Do",
      "Working On It",
      "Follow Up",
      "Done"
    ];
    
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

  const handleAddNote = async (taskId, note) => {
    if (note !== null) {
      try {
        // Update Monday.com first
        const mutation = `
          mutation {
            change_column_value(
              board_id: ${BOARD_ID}, 
              item_id: ${taskId}, 
              column_id: "text", 
              value: ${JSON.stringify(JSON.stringify(note))}
            ) {
              id
            }
          }
        `;

        const response = await fetch('/api/monday/update-note', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mutation })
        });

        if (!response.ok) {
          throw new Error('Failed to update note on Monday.com');
        }

        // Then update local state
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
      } catch (error) {
        console.error('Error updating note:', error);
        alert('Failed to save note: ' + error.message);
      }
    }
  };

  const handleStartDay = async () => {
    try {
      const defaultMessage = "Hi Nick & Dan, I'm planning my day is there anything specific or urgent you would like me to work on today? Otherwise I'll just work through my task lists.";
      
      const response = await fetch('/api/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: 'management-management',
          message: defaultMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send start day message');
      }

      // Reset daily tasks for new day
      await loadTasks();
    } catch (error) {
      console.error('Failed to start day:', error);
    }
  };

  const generateSummaryText = () => {
    const completedToday = [];
    const inProgress = [];
    
    Object.entries(tasks).forEach(([category, taskList]) => {
      taskList.forEach(task => {
        const taskText = `• ${task.name}${task.notes ? ` - ${task.notes}` : ''}`;
        if (task.status === "Done") {
          completedToday.push(taskText);
        } else if (task.status === "In Progress") {
          inProgress.push(taskText);
        }
      });
    });

    return `
*End of Day Update* 📝

*Completed Today:*
${completedToday.join('\n')}

*In Progress:*
${inProgress.join('\n')}
    `;
  };

  const handleGenerateSummary = () => {
    // Pre-select all completed tasks
    const completed = new Set();
    Object.values(tasks).flat().forEach(task => {
      if (task.status === "Done") {
        completed.add(task.id);
      }
    });
    setSelectedForSummary(completed);
    setShowSummaryModal(true);
  };

  const handleSendSummary = async (summaryText) => {
    try {
      const response = await fetch('/api/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: 'daily-updates-mgmt',
          message: summaryText
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send summary');
      }

      setShowSummaryModal(false);
      
      // Create next day's task list
      const tasksResponse = await fetch('/api/monday/tasks');
      const tasksData = await tasksResponse.json();
      
      if (tasksResponse.ok && tasksData) {
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Failed to send summary:', error);
      // Show error to user
      alert('Failed to send summary: ' + error.message);
    }
  };

  const handleMoveToNextDay = async (taskId) => {
    try {
      await moveTaskToNextDay(taskId);
      
      // Refresh tasks after moving
      const response = await fetch('/api/monday/tasks');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${data.details || response.statusText}`);
      }
      
      if (data) {
        setTasks(data);
      }
    } catch (error) {
      console.error('Error moving task to next day:', error);
    }
  };

  const handleAddLeave = async (leave) => {
    try {
      // Add leave to Monday.com (assuming you have a board for leaves)
      const mutation = `
        mutation {
          create_item (
            board_id: ${LEAVE_BOARD_ID},
            item_name: "${leave.reason}",
            column_values: ${JSON.stringify(JSON.stringify({
              date: { date: leave.date },
              time: leave.time
            }))}
          ) {
            id
          }
        }
      `;

      await fetch('/api/monday/create-leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mutation })
      });

      // Update local state
      setLeaves(prev => [...prev, leave]);
    } catch (error) {
      console.error('Error adding leave:', error);
    }
  };

  const handleTaskSelect = (taskId, isSelected) => {
    setSelectedForSummary(prev => {
      const next = new Set(prev);
      if (isSelected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  };

  const SummaryModal = ({ tasks, onClose, onSend, selectedTasks, onTaskSelect }) => {
    const [summaryText, setSummaryText] = useState('');
    const [showCompleted, setShowCompleted] = useState(true);
    const [showInProgress, setShowInProgress] = useState(true);
    const [showQueued, setShowQueued] = useState(true);
    
    // Group tasks by status for easier selection
    const groupedByStatus = {
      completed: [],
      inProgress: [],
      queued: []
    };

    Object.entries(tasks).forEach(([category, taskList]) => {
      taskList.forEach(task => {
        const taskItem = {
          ...task,
          category: category.replace('Tasks', '')
        };
        
        if (task.status === "Done") {
          groupedByStatus.completed.push(taskItem);
        } else if (task.status === "In Progress") {
          groupedByStatus.inProgress.push(taskItem);
        } else if (task.status === "Follow Up") {
          groupedByStatus.queued.push(taskItem);
        }
      });
    });

    useEffect(() => {
      const generateSummary = () => {
        const sections = [];
        
        if (showCompleted && groupedByStatus.completed.some(t => selectedTasks.has(t.id))) {
          const completedItems = groupedByStatus.completed
            .filter(task => selectedTasks.has(task.id))
            .map(task => {
              let text = `• ${task.name}`;
              if (task.notes) text += `\n  _${task.notes}_`;
              return text;
            });
          
          if (completedItems.length > 0) {
            sections.push('*Completed Today:*\n' + completedItems.join('\n'));
          }
        }

        if (showInProgress && groupedByStatus.inProgress.some(t => selectedTasks.has(t.id))) {
          const inProgressItems = groupedByStatus.inProgress
            .filter(task => selectedTasks.has(task.id))
            .map(task => {
              let text = `• ${task.name}`;
              if (task.notes) text += `\n  _${task.notes}_`;
              return text;
            });
          
          if (inProgressItems.length > 0) {
            sections.push('*In Progress:*\n' + inProgressItems.join('\n'));
          }
        }

        if (showQueued && groupedByStatus.queued.some(t => selectedTasks.has(t.id))) {
          const queuedItems = groupedByStatus.queued
            .filter(task => selectedTasks.has(task.id))
            .map(task => {
              let text = `• ${task.name}`;
              if (task.notes) text += `\n  _${task.notes}_`;
              return text;
            });
          
          if (queuedItems.length > 0) {
            sections.push('*Queued/Follow Up:*\n' + queuedItems.join('\n'));
          }
        }

        const text = `*End of Day Update* 📝\n\n${sections.join('\n\n')}`.trim();
        setSummaryText(text);
      };

      generateSummary();
    }, [tasks, selectedTasks, showCompleted, showInProgress, showQueued]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center">
        <div className="bg-white rounded-lg p-4 w-[800px] max-h-[90vh] flex flex-col">
          <h3 className="text-lg font-medium mb-4">Daily Summary</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border rounded p-2 max-h-[300px] overflow-y-auto">
              {/* Section Controls */}
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showCompleted}
                      onChange={(e) => setShowCompleted(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span>Completed Tasks</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showInProgress}
                      onChange={(e) => setShowInProgress(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span>In Progress Tasks</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showQueued}
                      onChange={(e) => setShowQueued(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span>Queued/Follow Up Tasks</span>
                  </label>
                </div>
              </div>

              {/* Task Sections */}
              {[
                { title: 'Completed', items: groupedByStatus.completed, show: showCompleted, color: 'green' },
                { title: 'In Progress', items: groupedByStatus.inProgress, show: showInProgress, color: 'blue' },
                { title: 'Queued/Follow Up', items: groupedByStatus.queued, show: showQueued, color: 'purple' }
              ].map(section => (
                section.show && section.items.length > 0 && (
                  <div key={section.title} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className={`text-sm font-medium text-${section.color}-600`}>{section.title}</h5>
                      <button
                        onClick={() => {
                          const ids = section.items.map(t => t.id);
                          const allSelected = ids.every(id => selectedTasks.has(id));
                          ids.forEach(id => onTaskSelect(id, !allSelected));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {section.items.every(t => selectedTasks.has(t.id)) 
                          ? 'Deselect All' 
                          : 'Select All'}
                      </button>
                    </div>
                    {section.items.map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        selected={selectedTasks.has(task.id)}
                        onSelect={onTaskSelect}
                      />
                    ))}
                  </div>
                )
              ))}
            </div>
            
            <div className="flex flex-col">
              <h4 className="font-medium mb-2 text-sm">Preview</h4>
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                className="flex-1 p-2 border rounded font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onSend(summaryText)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-flex items-center gap-1"
            >
              <Send className="h-4 w-4" />
              Send to Slack
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper component for task items
  const TaskItem = ({ task, selected, onSelect }) => (
    <div className="flex items-center group hover:bg-gray-50 rounded px-2 py-1">
      <label className="flex items-center space-x-2 text-sm flex-1 cursor-pointer">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(task.id, e.target.checked)}
          className="rounded border-gray-300"
        />
        <div className="flex-1">
          <span>{task.name}</span>
          {task.notes && (
            <div className="text-xs text-gray-500 ml-4">
              {task.notes}
            </div>
          )}
        </div>
      </label>
      {task.category !== 'Daily' && (
        <span className="text-xs text-gray-400 ml-2">{task.category}</span>
      )}
    </div>
  );

  const getTomorrowsTasks = () => {
    if (!tasks) return [];
    
    return Object.values(tasks)
      .flat()
      .filter(task => {
        // Include tasks that are:
        // 1. Marked for tomorrow
        // 2. In "Need To Do" status
        // 3. Not completed
        return (
          task.targetDate === getNextWorkingDay() ||
          (task.status === "Need To Do" && !task.type.includes('system'))
        );
      })
      .sort((a, b) => {
        // Sort by priority first, then by type
        const typeOrder = { priority: 0, daily: 1, queued: 2 };
        return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      });
  };

  const handleSyncWithMonday = async () => {
    try {
      setIsLoading(true);
      
      // First, get all boards data
      const boardsQuery = `
        query {
          boards (ids: ${BOARD_ID}) {
            items_page {
              cursor
              items {
                id
                name
                column_values {
                  id
                  text
                  value
                }
                subitems {
                  id
                  name
                  column_values {
                    id
                    text
                    value
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch('/api/monday/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: boardsQuery,
          forceFetch: true  // Add this to bypass any caching
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to sync tasks: ${data.details || response.statusText}`);
      }
      
      if (data) {
        setTasks(data);
        // Show success feedback with count
        const totalTasks = Object.values(data).flat().length;
        alert(`Successfully synced ${totalTasks} tasks with Monday.com`);
      }
    } catch (error) {
      console.error('Error syncing with Monday:', error);
      alert('Failed to sync with Monday.com: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-10">
          {/* Main Header */}
          <div className="bg-white border-b">
            <div className="max-w-5xl mx-auto px-3">
              <div className="flex items-center h-12">
                {/* Left Section: Title and Add Task */}
                <div className="flex items-center flex-1">
                  <h1 className="text-sm font-medium mr-4">Tasks</h1>
                  <div className="flex items-center space-x-4">
                    <div className="w-64">
                      <AddTaskForm onAdd={handleAddTask} />
                    </div>
                    
                    <div className="h-5 w-px bg-gray-300" /> {/* Stronger divider */}
                    
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-4">Leave</span>
                      <div className="w-64">
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          const leave = {
                            date: formData.get('date'),
                            time: formData.get('time'),
                            reason: formData.get('reason')
                          };
                          if (leave.date && leave.reason) {
                            handleAddLeave(leave);
                            e.target.reset();
                          }
                        }} className="flex items-center space-x-2">
                          <input
                            type="date"
                            name="date"
                            className="w-24 text-xs bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                          />
                          <input
                            type="time"
                            name="time"
                            className="w-20 text-xs bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                          />
                          <input
                            name="reason"
                            type="text"
                            placeholder="Reason for leave..."
                            className="flex-1 text-xs bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                          />
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Section: Office Hours */}
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span title="New Zealand">
                    🇳🇿 {new Date().toLocaleTimeString('en-NZ', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })}
                  </span>
                  <span title="United States">
                    🇺🇸 {new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false,
                      timeZone: 'America/Los_Angeles'
                    })}
                  </span>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button 
                    onClick={handleSyncWithMonday}
                    className={`text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded inline-flex items-center gap-1 ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isLoading}
                    title="Sync with Monday.com"
                  >
                    <RotateCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Sync
                  </button>
                  <button 
                    onClick={handleStartDay}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded inline-flex items-center gap-1"
                    title="Start Day"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Start
                  </button>
                  <button 
                    onClick={handleGenerateSummary}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded inline-flex items-center gap-1"
                    title="Generate Summary"
                  >
                    <Send className="h-3 w-3" />
                    Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Strip */}
          <StatusStrip leaves={leaves} />
        </div>

        {/* Rest of the dashboard */}
        <div className="max-w-5xl mx-auto px-3 py-4">
          {/* Main Content - now full width */}
          <div className="space-y-2">
            <TaskList 
              tasks={SYSTEM_TASKS}
              title={TASK_SECTIONS.system}
              onAddNote={handleAddNote}
              onUpdateStatus={(taskId) => {
                const task = SYSTEM_TASKS.find(t => t.id === taskId);
                if (task) {
                  task.status = task.status === 'Done' ? 'Not Started' : 'Done';
                  if (task.action && task.status === 'Done') {
                    task.action();
                  }
                  setTasks(prev => ({...prev}));
                }
              }}
            />
            <TaskList 
              tasks={getTomorrowsTasks()}
              title={TASK_SECTIONS.tomorrow}
              onAddNote={handleAddNote}
              onUpdateStatus={handleUpdateStatus}
              isPreview={true}
            />
            <TaskList 
              tasks={tasks.dailyTasks} 
              title={TASK_SECTIONS.daily}
              onAddNote={handleAddNote}
              onUpdateStatus={handleUpdateStatus}
              onMoveToNextDay={handleMoveToNextDay}
            />
            <TaskList 
              tasks={tasks.priorityTasks} 
              title={TASK_SECTIONS.priority}
              onAddNote={handleAddNote}
              onUpdateStatus={handleUpdateStatus}
            />
            <TaskList 
              tasks={tasks.queuedTasks}
              title={TASK_SECTIONS.queued}
              onAddNote={handleAddNote}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        </div>
      </div>

      {/* Leave Modal */}
      {showLeaveModal && (
        <LeaveModal 
          onClose={() => setShowLeaveModal(false)}
          onSubmit={handleAddLeave}
        />
      )}

      {/* Add Summary Modal */}
      {showSummaryModal && (
        <SummaryModal
          tasks={tasks}
          onClose={() => setShowSummaryModal(false)}
          onSend={handleSendSummary}
          selectedTasks={selectedForSummary}
          onTaskSelect={handleTaskSelect}
        />
      )}
    </ClientOnly>
  );
};

export default UnifiedDashboard;