import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Check, CheckCheck, ArrowLeft, Image, X } from 'lucide-react';
import { uploadImageToCloudinary } from '../api/cloudinary';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function ChatWindow({ selectedUser, onBack }) {
    const { user, socket, onlineUsers } = useAuth();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const myId = user._id || user.id;
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleUserTyping = ({ senderId }) => {
            if (senderId?.toString() === selectedUser?._id?.toString()) {
                setIsTyping(true);
            }
        };

        const handleUserStoppedTyping = ({ senderId }) => {
            if (senderId?.toString() === selectedUser?._id?.toString()) {
                setIsTyping(false);
            }
        };

        socket.on('userTyping', handleUserTyping);
        socket.on('userStoppedTyping', handleUserStoppedTyping);
        return () => {
            socket.off('userTyping', handleUserTyping);
            socket.off('userStoppedTyping', handleUserStoppedTyping);
        };
    }, [socket, selectedUser]);

    useEffect(() => {
        setIsTyping(false);
    }, [selectedUser]);

    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/messages/${selectedUser._id}`);
                setMessages(res.data.messages);

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
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [selectedUser, loading]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleTyping = (e) => {
        setText(e.target.value);

        if (!socket || !selectedUser) return;

        socket.emit('typing', { receiverId: selectedUser._id, senderId: myId });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', { receiverId: selectedUser._id, senderId: myId });
        }, 1500);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeSelectedImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() && !selectedImage) return;

        try {
            let imageUrl = '';

            if (selectedImage) {
                setUploading(true);
                imageUrl = await uploadImageToCloudinary(selectedImage);
                setUploading(false);
            }

            const res = await api.post(`/messages/${selectedUser._id}`, {
                text: text.trim(),
                image: imageUrl,
            });
            setMessages((prev) => [...prev, res.data.message]);
            setText('');
            removeSelectedImage();
            socket.emit('stopTyping', { receiverId: selectedUser._id, senderId: myId });
        } catch (error) {
            console.error(error);
            setUploading(false);
        }
    };

    if (!selectedUser) {
        return (
            <div className="flex flex-1 items-center justify-center bg-bg-light dark:bg-bg-dark">
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
                <button
                    onClick={onBack}
                    className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold overflow-hidden">
                    {selectedUser.profilePic ? (
                        <img src={selectedUser.profilePic} alt={selectedUser.name} className="w-full h-full object-cover" />
                    ) : (
                        selectedUser.name.charAt(0).toUpperCase()
                    )}
                </div>
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedUser.name}</p>
                    <p className="text-xs text-gray-400">
                        {isTyping ? (
                            <span className="text-primary">typing...</span>
                        ) : isOnline ? (
                            'Online'
                        ) : (
                            'Offline'
                        )}
                    </p>
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
                                    className={`max-w-[75%] rounded-2xl text-sm overflow-hidden ${isMe
                                        ? 'bg-primary text-white rounded-br-sm'
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'
                                        }`}
                                >
                                    {msg.image && (
                                        <img
                                            src={msg.image}
                                            alt="shared"
                                            className="w-full max-w-[280px] max-h-[280px] object-cover cursor-pointer"
                                            onClick={() => window.open(msg.image, '_blank')}
                                            onLoad={() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })}
                                        />
                                    )}
                                    {(msg.text || isMe) && (
                                        <div className="px-4 py-2 flex items-end gap-1.5">
                                            {msg.text && <span>{msg.text}</span>}
                                            {isMe && (
                                                <span className="flex-shrink-0 mb-0.5 ml-auto">
                                                    {msg.status === 'read' ? (
                                                        <CheckCheck size={15} className="text-sky-300" />
                                                    ) : (
                                                        <Check size={15} className="text-white/70" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                {imagePreview && (
                    <div className="px-3 pt-3">
                        <div className="relative inline-block">
                            <img src={imagePreview} alt="preview" className="h-20 w-20 object-cover rounded-lg" />
                            <button
                                onClick={removeSelectedImage}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSend} className="p-3 flex items-center gap-2">
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    >
                        <Image size={20} />
                    </button>
                    <input
                        type="text"
                        value={text}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark active:scale-90 shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0 disabled:opacity-60 disabled:active:scale-100"
                    >
                        {uploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatWindow;