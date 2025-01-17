"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Plus, Coffee, Calendar } from 'lucide-react';

const LeaveTracker = () => {
  const [leaves, setLeaves] = useState([
    { id: 1, type: 'break', start: 'Today 12:30 PM', end: 'Today 1:30 PM', status: 'upcoming' },
    { id: 2, type: 'vacation', start: 'April 12, 2024', end: 'April 12, 2024', status: 'upcoming' }
  ]);
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [newLeave, setNewLeave] = useState({ 
    type: 'break', 
    start: '', 
    end: '', 
    reason: '',
    isRoutine: true 
  });

  const notifySlack = async (leave) => {
    if (!leave.isRoutine) {
      const message = {
        channel: 'management-management',
        text: `*New Leave Request*\nType: ${leave.type}\nDates: ${leave.start} - ${leave.end}${leave.reason ? `\nReason: ${leave.reason}` : ''}`
      };
      
      try {
        console.log('Sending to Slack:', message);
        // await axios.post('/api/slack/notify', message);
      } catch (error) {
        console.error('Failed to send Slack notification:', error);
      }
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Leave & Breaks</CardTitle>
        <button
          onClick={() => setShowAddLeave(!showAddLeave)}
          className="p-2 text-blue-500 hover:text-blue-600"
        >
          <Plus className="h-5 w-5" />
        </button>
      </CardHeader>
      <CardContent>
        {showAddLeave && (
          <div className="mb-4 p-4 bg-gray-50 rounded space-y-2">
            <select
              className="w-full p-2 border rounded mb-2"
              value={newLeave.type}
              onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value })}
            >
              <option value="break">Break</option>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="appointment">Appointment</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Start time/date"
              className="w-full p-2 border rounded mb-2"
              value={newLeave.start}
              onChange={(e) => setNewLeave({ ...newLeave, start: e.target.value })}
            />
            <input
              type="text"
              placeholder="End time/date"
              className="w-full p-2 border rounded mb-2"
              value={newLeave.end}
              onChange={(e) => setNewLeave({ ...newLeave, end: e.target.value })}
            />
            <textarea
              placeholder="Reason (optional)"
              className="w-full p-2 border rounded mb-2 h-20"
              value={newLeave.reason}
              onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
            />
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                id="routineLeave"
                checked={newLeave.isRoutine}
                onChange={(e) => setNewLeave({ ...newLeave, isRoutine: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="routineLeave" className="text-sm text-gray-600">
                This is a routine break/leave
              </label>
            </div>
            <button
              onClick={() => {
                if (newLeave.start && newLeave.end) {
                  const leave = { 
                    ...newLeave, 
                    id: leaves.length + 1, 
                    status: 'upcoming' 
                  };
                  setLeaves([...leaves, leave]);
                  notifySlack(leave);
                  setNewLeave({ 
                    type: 'break', 
                    start: '', 
                    end: '', 
                    reason: '',
                    isRoutine: true 
                  });
                  setShowAddLeave(false);
                }
              }}
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Leave
            </button>
          </div>
        )}
        <div className="space-y-2">
          {leaves.map(leave => (
            <div key={leave.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              {leave.type === 'break' ? (
                <Coffee className="h-5 w-5 text-orange-500" />
              ) : (
                <Calendar className="h-5 w-5 text-purple-500" />
              )}
              <div className="flex-1">
                <div className="font-medium">
                  {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
                </div>
                <div className="text-sm text-gray-500">
                  {leave.start} - {leave.end}
                </div>
                {leave.reason && (
                  <div className="text-sm text-gray-600">{leave.reason}</div>
                )}
              </div>
              <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {leave.status}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveTracker;