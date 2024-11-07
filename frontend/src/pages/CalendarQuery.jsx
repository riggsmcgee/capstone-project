import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function CalendarQuery() {
  const [queryInput, setQueryInput] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [queryResult, setQueryResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setAvailableUsers(
          data.map((user) => ({ ...user, id: parseInt(user.id, 10) }))
        );
      } catch (err) {
        setError(err.message);
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, [token]);

  const handleUserSelection = (userId) => {
    const newSelectedUsers = selectedUsers.includes(userId)
      ? selectedUsers.filter((id) => id !== userId)
      : [...selectedUsers, userId];
    setSelectedUsers(newSelectedUsers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setQueryResult('');

    if (!queryInput.trim()) {
      setError('Please enter a query');
      setLoading(false);
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: queryInput,
          userId: selectedUsers,
          typeId: 1,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process query');
      }

      setQueryResult(data.aiResult);

      setQueryInput('');
      setSelectedUsers([]);
    } catch (err) {
      setError(err.message);
      console.error('Error processing query:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Calendar Query</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Select Users:</label>
          <div className="flex flex-wrap gap-2">
            {availableUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleUserSelection(user.id)}
                className={`user-button ${
                  selectedUsers.includes(user.id) ? 'selected' : 'unselected'
                }`}
                disabled={loading}
              >
                {user.username}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-2">Your Query:</label>
          <textarea
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="w-full h-32 p-2 border rounded"
            placeholder="e.g., When are all selected users available this week?"
            required
          />
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Submit Query'}
        </button>
      </form>

      {queryResult && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">AI Response:</h3>
          <p>{queryResult}</p>
        </div>
      )}
    </div>
  );
}
