"use client";

import { useState, useEffect } from 'react';
import { Clock, MapPin } from 'lucide-react';

const StatusStrip = ({ leaves }) => {
  const [isInOffice, setIsInOffice] = useState(false);
  const [override, setOverride] = useState(null);
  const [localTime, setLocalTime] = useState('');
  const [profile, setProfile] = useState({
    name: 'Ange Byrne',
    photo_original: null
  });
  const [profileImage, setProfileImage] = useState(null);
  
  // Office hours in NZ time
  const NZ_OFFICE_HOURS = {
    start: 7,
    end: 15,
    timezone: 'Pacific/Auckland'
  };

  // Convert NZ office hours to viewer's local time
  const getLocalOfficeHours = () => {
    const nzDate = new Date().toLocaleString('en-US', { timeZone: 'Pacific/Auckland' });
    const nzTime = new Date(nzDate);
    const startTime = new Date(nzTime.setHours(NZ_OFFICE_HOURS.start, 0, 0));
    const endTime = new Date(nzTime.setHours(NZ_OFFICE_HOURS.end, 0, 0));

    const localStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const localEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    return `${localStartTime} - ${localEndTime}`;
  };

  // Fetch profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/monday/profile');
        const data = await response.json();
        if (data && !data.error) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, []);

  // Check office hours
  useEffect(() => {
    const checkOfficeHours = () => {
      if (override !== null) {
        setIsInOffice(override === 'in');
        return;
      }

      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      
      const isWorkDay = day >= 1 && day <= 5;
      const isWorkHour = hour >= 7 && hour < 15;
      
      setIsInOffice(isWorkDay && isWorkHour);
    };

    checkOfficeHours();
    const interval = setInterval(checkOfficeHours, 60000);
    return () => clearInterval(interval);
  }, [override]);

  // Update local time
  useEffect(() => {
    const updateLocalTime = () => {
      setLocalTime(getLocalOfficeHours());
    };

    updateLocalTime();
    const interval = setInterval(updateLocalTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleOverride = (status) => {
    if (status === override) {
      setOverride(null);
    } else {
      setOverride(status);
      setIsInOffice(status === 'in');
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        localStorage.setItem('profileImage', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load saved image on mount
  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  return (
    <div className={`transition-colors duration-300 ${
      isInOffice 
        ? 'bg-green-50 border-green-100' 
        : 'bg-orange-50 border-orange-100'
    } border-b`}>
      <div className="max-w-5xl mx-auto px-3">
        <div className="flex items-center justify-between h-7 text-xs">
          {/* Profile Section */}
          <div className="flex items-center space-x-3">
            <label className="relative cursor-pointer group">
              <img 
                src={profile?.photo_original || '/default-avatar.png'}
                alt="Profile"
                className="w-6 h-6 rounded-full border border-gray-200 group-hover:opacity-75"
              />
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-full transition-opacity" />
            </label>
            <div className="flex flex-col justify-center">
              <span className="font-medium">{profile?.name || 'Ange Byrne'}</span>
              <div className="flex items-center text-[10px] text-gray-500">
                <MapPin className="h-2.5 w-2.5 mr-1" />
                <span>Auckland, NZ</span>
                <span className="mx-1">•</span>
                <span title="Your local office hours">
                  {localTime}
                </span>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="flex items-center space-x-2">
            <Clock className={`h-3 w-3 ${
              isInOffice ? 'text-green-600' : 'text-orange-600'
            }`} />
            <span className={`font-medium ${
              isInOffice ? 'text-green-700' : 'text-orange-700'
            }`}>
              {isInOffice ? "In Office" : "Out of Office"}
            </span>
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={() => handleOverride(null)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                  override === null
                    ? 'bg-white text-gray-700 shadow-sm' 
                    : 'text-gray-500 hover:bg-white/50'
                }`}
              >
                Auto
              </button>
              <button
                onClick={() => handleOverride('in')}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                  override === 'in'
                    ? 'bg-white text-gray-700 shadow-sm'
                    : 'text-gray-500 hover:bg-white/50'
                }`}
              >
                In
              </button>
              <button
                onClick={() => handleOverride('out')}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                  override === 'out'
                    ? 'bg-white text-gray-700 shadow-sm'
                    : 'text-gray-500 hover:bg-white/50'
                }`}
              >
                Out
              </button>
            </div>
          </div>
          
          {/* Sticky Note */}
          <div className="relative group">
            <div className="bg-yellow-50 border border-yellow-100 p-1.5 text-[10px] transform -rotate-1 hover:rotate-0 transition-all shadow-sm">
              <div className="font-medium text-yellow-800">Planned Absence:</div>
              <div className="text-yellow-700">
                {leaves.length > 0 ? (
                  leaves.map((leave, index) => (
                    <div key={index}>
                      {new Date(leave.date).toLocaleDateString()} {leave.time && `@ ${leave.time}`}
                      {leave.reason && ` - ${leave.reason}`}
                    </div>
                  ))
                ) : (
                  <div>No planned absences</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusStrip; 