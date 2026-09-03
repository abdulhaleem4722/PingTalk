import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Type, Image as ImageIcon, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { uploadImageToCloudinary } from '../api/cloudinary';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import StatusViewer from '../components/StatusViewer';

function StatusPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusGroups, setStatusGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingGroup, setViewingGroup] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const myId = user?._id || user?.id;

  const fetchStatuses = async () => {
    try {
      const res = await api.get('/status');
      setStatusGroups(res.data.statusGroups);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const myGroup = statusGroups.find((g) => g.user._id === myId);
  const otherGroups = statusGroups.filter((g) => g.user._id !== myId);

  const hasUnviewed = (group) => {
    return group.statuses.some((s) => !s.viewedBy.includes(myId));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      toast.error('Please select an image or video');
      return;
    }

    setUploading(true);
    setShowAddMenu(false);
    try {
      const url = await uploadImageToCloudinary(file);
      await api.post('/status', { type: isVideo ? 'video' : 'image', content: url });
      toast.success('Status posted!');
      fetchStatuses();
    } catch (error) {
      toast.error('Failed to post status');
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTextStatus = async () => {
    setShowAddMenu(false);
    const text = window.prompt('Type your status:');
    if (!text || !text.trim()) return;

    const colors = ['#128C7E', '#25D366', '#075E54', '#5B21B6', '#B91C1C', '#B45309'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    try {
      await api.post('/status', { type: 'text', content: text.trim(), backgroundColor: color });
      toast.success('Status posted!');
      fetchStatuses();
    } catch (error) {
      toast.error('Failed to post status');
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Status</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* My Status */}
            <div className="p-3 relative">
              <button
                onClick={() => (myGroup ? setViewingGroup(myGroup) : setShowAddMenu(true))}
                className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden ${
                      myGroup ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : 'bg-primary/20'
                    }`}
                  >
                    {user?.profilePic ? (
                      <img src={user.profilePic} alt="me" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-primary" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddMenu(true);
                    }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center border-2 border-white dark:border-gray-900"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">My Status</p>
                  <p className="text-xs text-gray-400">
                    {myGroup ? `${myGroup.statuses.length} update${myGroup.statuses.length > 1 ? 's' : ''}` : 'Tap to add status update'}
                  </p>
                </div>
              </button>
            </div>

            {/* Recent Updates */}
            {otherGroups.length > 0 && (
              <div>
                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Recent Updates</p>
                {otherGroups.map((group) => {
                  const unviewed = hasUnviewed(group);
                  return (
                    <button
                      key={group.user._id}
                      onClick={() => setViewingGroup(group)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${
                          unviewed ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : 'ring-2 ring-gray-300 dark:ring-gray-700 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                        }`}
                      >
                        {group.user.profilePic ? (
                          <img src={group.user.profilePic} alt={group.user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                            {group.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{group.user.name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(group.statuses[group.statuses.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {otherGroups.length === 0 && (
              <p className="text-center text-sm text-gray-400 pt-8 px-6">
                No status updates yet. Statuses from people you've chatted with will appear here.
              </p>
            )}
          </>
        )}
      </div>

      {/* Add status menu */}
      {showAddMenu && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center sm:justify-center" onClick={() => setShowAddMenu(false)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:w-80 p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <ImageIcon size={18} className="text-primary" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Photo or Video</span>
            </button>
            <button
              onClick={handleTextStatus}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Type size={18} className="text-primary" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Text</span>
            </button>
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*,video/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Posting status...</p>
          </div>
        </div>
      )}

      {viewingGroup && (
        <StatusViewer
          group={viewingGroup}
          isOwn={viewingGroup.user._id === myId}
          onClose={() => {
            setViewingGroup(null);
            fetchStatuses();
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default StatusPage;