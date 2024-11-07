import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Friends.css';

const Friends = () => {
  const { token, userId } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const apiRequest = async (url, method = 'GET', body = null) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, options);

      if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const fetchFriends = async () => {
    try {
      const data = await apiRequest('/api/friends/list');
      setFriends(Array.isArray(data.friends) ? data.friends : []);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setFriends([]);
      setError(err.message || 'Failed to fetch friends.');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const data = await apiRequest('/api/users');
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching all users:', err);
      setAllUsers([]);
      setError(err.message || 'Failed to fetch users.');
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const data = await apiRequest('/api/friends/requests');
      setFriendRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
      setFriendRequests([]);
      setError(err.message || 'Failed to fetch friend requests.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        setIsLoading(true);
        setError(null);
        try {
          await Promise.all([
            fetchFriends(),
            fetchAllUsers(),
            fetchFriendRequests(),
          ]);
        } catch (err) {
          console.error('Error in fetchData:', err);
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setError('You must be logged in to view friends.');
      }
    };
    fetchData();
  }, [token]);

  const sendFriendRequest = async (receiverId) => {
    try {
      const data = await apiRequest('/api/friends/request', 'POST', {
        receiverId,
      });
      alert(data.message);
      fetchFriendRequests();
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert(err.message || 'Failed to send friend request.');
    }
  };

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

  const availableUsers = Array.isArray(allUsers)
    ? allUsers.filter((user) => {
        if (user.id === userId) return false;
        const isFriend = friends.some((friend) => friend.id === user.id);

        const hasSentRequest = friendRequests.some(
          (req) => req.requester.id === userId && req.receiverId === user.id
        );

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
