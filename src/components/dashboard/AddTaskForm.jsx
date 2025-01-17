"use client";

import React, { useState } from 'react';
import { PlusCircle, ChevronDown } from 'lucide-react';

const TASK_TYPES = {
  daily: "Daily Task",
  priority: "Priority Task",
  queued: "Queued Task"
};

const AddTaskForm = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [selectedType, setSelectedType] = useState('daily');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onAdd({
      name: name.trim(),
      type: selectedType,
      status: 'Not Started'
    });
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <PlusCircle className="h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add new task..."
        className="flex-1 text-xs bg-transparent border-none focus:outline-none focus:ring-0 p-0"
      />
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTypeSelect(!showTypeSelect)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {TASK_TYPES[selectedType]}
          <ChevronDown className="h-3 w-3" />
        </button>
        
        {showTypeSelect && (
          <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md py-1 z-10">
            {Object.entries(TASK_TYPES).map(([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSelectedType(type);
                  setShowTypeSelect(false);
                }}
                className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};

export default AddTaskForm;