import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function CalendarUpload() {
  const [calendarInput, setCalendarInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, userId } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!calendarInput.trim()) {
      setError('Calendar input cannot be empty.');
      return;
    }

    console.log('Calendar input:', calendarInput);
    console.log('userId:', userId);

    try {
      const response = await fetch('http://localhost:3000/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          calendarInput,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload calendar');
      }

      setSuccess('Calendar uploaded successfully!');
      navigate('/calendar-query');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Upload Your Calendar</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={calendarInput}
          onChange={(e) => setCalendarInput(e.target.value)}
          className="w-full h-40 p-2 border rounded"
          placeholder="Enter your availability (e.g., 'Available Monday through Friday 9 AM to 5 PM')"
          required
        />

        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-500">{success}</div>}

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Upload Calendar
        </button>
      </form>
    </div>
  );
}
