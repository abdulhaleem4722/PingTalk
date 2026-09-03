import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, CircleDot } from 'lucide-react';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isChats = location.pathname === '/chat';
  const isStatus = location.pathname === '/status';

  return (
    <div className="sm:hidden flex items-center justify-around bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-2 pb-safe">
      <button
        onClick={() => navigate('/chat')}
        className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-colors ${
          isChats ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        <MessageCircle size={22} fill={isChats ? 'currentColor' : 'none'} strokeWidth={isChats ? 1.5 : 2} />
        <span className="text-xs font-medium">Chats</span>
      </button>
      <button
        onClick={() => navigate('/status')}
        className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-colors ${
          isStatus ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        <CircleDot size={22} strokeWidth={isStatus ? 2.5 : 2} />
        <span className="text-xs font-medium">Status</span>
      </button>
    </div>
  );
}

export default BottomNav;