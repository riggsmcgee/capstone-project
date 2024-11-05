// src/pages/Admin.jsx

import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Define the backend API base URL
const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual backend URL

// Helper function to make API requests using fetch
const apiRequest = async (url, method = 'GET', body = null, token = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Include Authorization header if token is provided
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, options);

    // Debugging: Log the response status and URL
    console.log(
      `Request to ${API_BASE_URL}${url} responded with status ${response.status}`
    );

    // Check if response status is OK (200-299)
    if (!response.ok) {
      // Attempt to parse error message
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (err) {
    // Re-throw the error to be handled in the calling function
    throw err;
  }
};

function Admin() {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedRoleId, setEditedRoleId] = useState('');

  // Define role options with their corresponding IDs
  const roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'User' },
    // Add other roles as needed
  ];

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiRequest('/api/users', 'GET', null, token);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      // Optionally, display an error message to the user
    }
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setEditedUsername(user.username);
    setEditedRoleId(user.role.id); // Initialize with roleId instead of role name
  };

  const handleSave = async (userId) => {
    try {
      // Validate the editedRoleId
      const validRoleIds = roles.map((role) => role.id);
      if (!validRoleIds.includes(Number(editedRoleId))) {
        throw new Error('Invalid role selected.');
      }

      const updatedData = {
        username: editedUsername,
        roleId: Number(editedRoleId), // Ensure roleId is a number
      };
      console.log('Updated data:', updatedData);

      const data = await apiRequest(
        `/api/users/${userId}`,
        'PATCH',
        updatedData,
        token
      );

      // Update local state with the updated user data
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                username: editedUsername,
                role: data.role, // Ensure this matches the backend response
              }
            : user
        )
      );
      setEditingUserId(null);
    } catch (error) {
      console.error('Error updating user:', error.message);
      // Optionally, display an error message to the user
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiRequest(`/api/users/${userId}`, 'DELETE', null, token);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error.message);
      // Optionally, display an error message to the user
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">ID</th>
            <th className="py-2">Username</th>
            <th className="py-2">Role</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="text-center border-t">
                <td className="py-2">{user.id}</td>
                <td className="py-2">
                  {editingUserId === user.id ? (
                    <input
                      type="text"
                      value={editedUsername}
                      onChange={(e) => setEditedUsername(e.target.value)}
                      className="border px-2 py-1"
                    />
                  ) : (
                    user.username
                  )}
                </td>
                <td className="py-2">
                  {editingUserId === user.id ? (
                    <select
                      value={editedRoleId}
                      onChange={(e) => setEditedRoleId(e.target.value)}
                      className="border px-2 py-1"
                    >
                      <option value="" disabled>
                        Select Role
                      </option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    user.role.name
                  )}
                </td>
                <td className="py-2">
                  {editingUserId === user.id ? (
                    <>
                      <button
                        onClick={() => handleSave(user.id)}
                        className="bg-green-500 text-white px-2 py-1 mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="bg-gray-500 text-white px-2 py-1"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(user)}
                        className="bg-blue-500 text-white px-2 py-1 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="bg-red-500 text-white px-2 py-1"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="py-4 text-center">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;
