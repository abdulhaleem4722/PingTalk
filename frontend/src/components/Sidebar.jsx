import { useState, useEffect } from 'react';
import { MessageCircle, Search, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function Sidebar({ selectedUser, setSelectedUser }) {
  const { user, logout, onlineUsers, socket } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      setUsers((prevUsers) => {
        const senderId = newMessage.senderId?.toString();
        const receiverId = newMessage.receiverId?.toString();
        const otherUserId = senderId === (user._id || user.id)?.toString() ? receiverId : senderId;

        const isCurrentlyOpen = selectedUser?._id?.toString() === otherUserId;

        const updated = prevUsers.map((u) => {
          if (u._id.toString() === otherUserId) {
            return {
              ...u,
              lastMessage: { text: newMessage.text, createdAt: newMessage.createdAt },
              unreadCount: isCurrentlyOpen ? 0 : (u.unreadCount || 0) + (senderId === otherUserId ? 1 : 0),
            };
          }
          return u;
        });

        const sorted = [...updated].sort((a, b) => {
          const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt) : 0;
          const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt) : 0;
          return timeB - timeA;
        });

        return sorted;
      });
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, selectedUser, user]);

  useEffect(() => {
    if (!selectedUser) return;
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u._id.toString() === selectedUser._id.toString() ? { ...u, unreadCount: 0 } : u
      )
    );
  }, [selectedUser]);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full sm:w-80 h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <MessageCircle className="text-white" size={18} />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">PingTalk</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary transition-all"
            title="Profile"
          >
            {user?.profilePic ? (
              <img src={user.profilePic} alt="me" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-primary" />
            )}
          </button>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-8">No users found</p>
        ) : (
          filteredUsers.map((u) => {
            const isOnline = onlineUsers.includes(u._id);
            const isSelected = selectedUser?._id === u._id;
            const hasUnread = u.unreadCount > 0;
            return (
              <button
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold overflow-hidden">
                    {u.profilePic ? (
                      <img src={u.profilePic} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-medium truncate ${hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                    {u.name}
                  </p>
                  <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400'}`}>
                    {u.lastMessage ? u.lastMessage.text : isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                {hasUnread && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
                    {u.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Sidebar;