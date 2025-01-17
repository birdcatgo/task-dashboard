import React, { useState } from 'react';

const LeaveModal = ({ onClose, onSubmit }) => {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ date, reason });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 w-96">
        <h3 className="text-lg font-medium mb-4">Add Leave</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mb-2 p-2 border rounded"
          />
          <input
            type="text"
            value={reason}
            placeholder="Reason for leave"
            onChange={(e) => setReason(e.target.value)}
            className="w-full mb-4 p-2 border rounded"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Leave
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveModal; 