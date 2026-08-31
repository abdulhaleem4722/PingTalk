import { useAuth } from '../context/AuthContext';

function ChatHome() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{user?.email}</p>
        <button
          onClick={logout}
          className="bg-primary text-white px-6 py-2 rounded-xl font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default ChatHome;