import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

function ChatHome() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
      <ChatWindow selectedUser={selectedUser} />
    </div>
  );
}

export default ChatHome;