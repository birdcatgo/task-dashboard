"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';

const StatusBanner = () => {
  const [status, setStatus] = useState('out-of-office');
  const [mounted, setMounted] = useState(false);
  const [officeHours] = useState({ 
    start: '07:00', 
    end: '15:00', 
    timezone: 'Pacific/Auckland',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });

  // Only run time-based effects after component mounts on client
  useEffect(() => {
    setMounted(true);
    
    const updateStatus = () => {
      const now = new Date();
      
      // Get current time in NZ
      const nzTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Pacific/Auckland',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now);
      
      const currentHour = parseInt(nzTime.split(':')[0]);
      const currentDay = now.toLocaleDateString('en-US', { 
        timeZone: 'Pacific/Auckland', 
        weekday: 'long' 
      });

      // Automatic status updates
      if (!officeHours.workDays.includes(currentDay)) {
        setStatus('out-of-office');
      } else if (currentHour < 7 || currentHour >= 15) {
        setStatus('out-of-office');
      } else {
        setStatus('in-office');
      }
    };

    updateStatus(); // Run immediately
    const timer = setInterval(updateStatus, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [officeHours]);

  const getStatusColor = () => {
    switch(status) {
      case 'in-office': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'out-of-office': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const commonTimezones = [
    { label: 'Auckland (Local)', zone: 'Pacific/Auckland' },
    { label: 'Sydney', zone: 'Australia/Sydney' },
    { label: 'London', zone: 'Europe/London' },
    { label: 'New York', zone: 'America/New_York' },
    { label: 'San Francisco', zone: 'America/Los_Angeles' }
  ];

  const formatTimeForTimezone = (time, timezone) => {
    if (!mounted) return time; // Return static time during SSR
    
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours));
      date.setMinutes(parseInt(minutes));
      
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (e) {
      return time;
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          {/* Status Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${getStatusColor()}`}></div>
              <span className="font-medium">
                {status === 'in-office' ? 'In Office' : 
                 status === 'away' ? 'Away' : 'Out of Office'}
              </span>
            </div>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="p-1 border rounded text-sm"
            >
              <option value="in-office">In Office</option>
              <option value="away">Away</option>
              <option value="out-of-office">Out of Office</option>
            </select>
          </div>

          {/* Office Hours Display */}
          <div className="bg-gray-50 p-3 rounded-lg w-full md:w-auto">
            <div className="text-sm font-medium mb-2">Office Hours (NZ Time):</div>
            <div className="text-xs text-gray-600 mb-2">Monday - Friday, 7:00 AM - 3:00 PM</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {commonTimezones.map((tz) => (
                <div key={tz.zone} className="text-sm">
                  <div className="font-medium">{tz.label}</div>
                  <div className="text-gray-600">
                    {formatTimeForTimezone(officeHours.start, tz.zone)} - {formatTimeForTimezone(officeHours.end, tz.zone)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusBanner;