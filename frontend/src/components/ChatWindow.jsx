import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function ChatWindow({ selectedUser }) {
  const { user, socket, onlineUsers } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const myId = user._id || user.id;

  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/messages/${selectedUser._id}`);
        setMessages(res.data.messages);

        // Mark unread messages from this user as read
        await api.put(`/messages/read/${selectedUser._id}`);
        if (socket) {
          socket.emit('markAsRead', { senderId: selectedUser._id, receiverId: myId });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (
        newMessage.senderId === selectedUser?._id ||
        newMessage.receiverId === selectedUser?._id
      ) {
        setMessages((prev) => [...prev, newMessage]);

        // If this chat is open, immediately mark as read
        if (newMessage.senderId === selectedUser?._id) {
          api.put(`/messages/read/${selectedUser._id}`);
          socket.emit('markAsRead', { senderId: selectedUser._id, receiverId: myId });
        }
      }
    };

  const handleMessagesRead = ({ readBy }) => {
    if (readBy?.toString() === selectedUser?._id?.toString()) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiverId?.toString() === readBy?.toString() ? { ...msg, status: 'read' } : msg
        )
      );
    }
  };

    socket.on('newMessage', handleNewMessage);
    socket.on('messagesRead', handleMessagesRead);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await api.post(`/messages/${selectedUser._id}`, { text });
      setMessages((prev) => [...prev, res.data.message]);
      setText('');
    } catch (error) {
      console.error(error);
    }
  };

  if (!selectedUser) {
    return (
      <div className="hidden sm:flex flex-1 items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="text-primary" size={32} />
          </div>
          <p className="text-gray-500 dark:text-gray-400">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
          {selectedUser.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{selectedUser.name}</p>
          <p className="text-xs text-gray-400">{isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId?.toString() === myId?.toString();
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm flex items-end gap-1.5 ${
                    isMe
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'
                  }`}
                >
                  <span>{msg.text}</span>
                  {isMe && (
                    <span className="flex-shrink-0 mb-0.5">
                      {msg.status === 'read' ? (
                        <CheckCheck size={15} className="text-sky-300" />
                      ) : (
                        <Check size={15} className="text-white/70" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 flex items-center gap-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;