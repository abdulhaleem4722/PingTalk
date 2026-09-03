import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import BottomNav from '../components/BottomNav';

function ChatHome() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <div className={`${selectedUser ? 'hidden sm:flex' : 'flex'} w-full sm:w-auto`}>
          <Sidebar selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
        </div>
        <div className={`${selectedUser ? 'flex' : 'hidden sm:flex'} flex-1`}>
          <ChatWindow selectedUser={selectedUser} onBack={() => setSelectedUser(null)} />
        </div>
      </div>
      {!selectedUser && <BottomNav />}
    </div>
  );
}

export default ChatHome;