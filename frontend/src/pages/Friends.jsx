// src/pages/Friends.jsx
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Friends.css'; // Ensure this CSS file exists

const Friends = () => {
  const { token, userId } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Define the backend API base URL
  const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual backend URL

  // Helper function to make API requests using fetch
  const apiRequest = async (url, method = 'GET', body = null) => {
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

  // Fetch friends
  const fetchFriends = async () => {
    try {
      const data = await apiRequest('/api/friends/list');
      console.log('API Response for /api/friends/list:', data);
      setFriends(Array.isArray(data.friends) ? data.friends : []);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setFriends([]); // Reset to empty array on error
      setError(err.message || 'Failed to fetch friends.');
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      const data = await apiRequest('/api/users');
      console.log('API Response for /api/users:', data);
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching all users:', err);
      setAllUsers([]); // Reset to empty array on error
      setError(err.message || 'Failed to fetch users.');
    }
  };

  // Fetch incoming friend requests
  const fetchFriendRequests = async () => {
    try {
      const data = await apiRequest('/api/friends/requests');
      console.log('API Response for /api/friends/requests:', data);
      setFriendRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
      setFriendRequests([]); // Reset to empty array on error
      setError(err.message || 'Failed to fetch friend requests.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        setIsLoading(true);
        setError(null); // Reset error state
        try {
          await Promise.all([
            fetchFriends(),
            fetchAllUsers(),
            fetchFriendRequests(),
          ]);
        } catch (err) {
          console.error('Error in fetchData:', err);
          // Errors are handled in individual fetch functions
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setError('You must be logged in to view friends.');
      }
    };
    fetchData();
  }, [token]);

  // Handle sending a friend request
  const sendFriendRequest = async (receiverId) => {
    try {
      const data = await apiRequest('/api/friends/request', 'POST', {
        receiverId,
      });
      alert(data.message);
      fetchFriendRequests(); // Refresh friend requests
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert(err.message || 'Failed to send friend request.');
    }
  };

  // Handle accepting a friend request
  const acceptFriendRequest = async (requesterId) => {
    try {
      const data = await apiRequest('/api/friends/accept', 'POST', {
        requesterId,
      });
      alert(data.message);
      fetchFriends();
      fetchFriendRequests();
    } catch (err) {
      console.error('Error accepting friend request:', err);
      alert(err.message || 'Failed to accept friend request.');
    }
  };

  // Handle declining a friend request
  const declineFriendRequest = async (requesterId) => {
    try {
      const data = await apiRequest('/api/friends/decline', 'POST', {
        requesterId,
      });
      alert(data.message);
      fetchFriendRequests();
    } catch (err) {
      console.error('Error declining friend request:', err);
      alert(err.message || 'Failed to decline friend request.');
    }
  };

  // Handle removing a friend
  const removeFriend = async (friendId) => {
    try {
      const data = await apiRequest('/api/friends/remove', 'DELETE', {
        friendId,
      });
      alert(data.message);
      fetchFriends();
    } catch (err) {
      console.error('Error removing friend:', err);
      alert(err.message || 'Failed to remove friend.');
    }
  };

  // Filter users who are not already friends or have pending requests
  const availableUsers = Array.isArray(allUsers)
    ? allUsers.filter((user) => {
        if (user.id === userId) return false; // Exclude current user
        const isFriend = friends.some((friend) => friend.id === user.id);

        // Check if the current user has sent a friend request to this user
        const hasSentRequest = friendRequests.some(
          (req) => req.requester.id === userId && req.receiverId === user.id
        );

        // Check if this user has sent a friend request to the current user
        const hasReceivedRequest = friendRequests.some(
          (req) => req.requester.id === user.id && req.receiverId === userId
        );

        return !isFriend && !hasSentRequest && !hasReceivedRequest;
      })
    : [];

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="friends-container">
      <h1>Your Friends</h1>
      <div className="friends-list">
        {friends.length === 0 ? (
          <p>You have no friends yet.</p>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="friend-item">
              <span>{friend.username}</span>
              <button
                onClick={() => removeFriend(friend.id)}
                className="remove-button"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <h2>Incoming Friend Requests</h2>
      <div className="friend-requests">
        {friendRequests.length === 0 ? (
          <p>No incoming friend requests.</p>
        ) : (
          friendRequests.map((req) => (
            <div key={req.id} className="friend-request-item">
              <span>{req.requester.username}</span>
              <div>
                <button
                  onClick={() => acceptFriendRequest(req.requester.id)}
                  className="accept-button"
                >
                  Accept
                </button>
                <button
                  onClick={() => declineFriendRequest(req.requester.id)}
                  className="decline-button"
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <h2>All Users</h2>
      {/* Removed the search input */}
      <div className="all-users-list">
        {availableUsers.length === 0 ? (
          <p>No available users to send friend requests.</p>
        ) : (
          availableUsers.map((user) => (
            <div key={user.id} className="user-item">
              <span>{user.username}</span>
              <button
                onClick={() => sendFriendRequest(user.id)}
                className="add-button"
              >
                Add Friend
              </button>
            </div>
          ))
        )}
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Friends;
