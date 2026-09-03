import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { uploadImageToCloudinary } from '../api/cloudinary';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      const res = await api.put('/users/profile', { profilePic: imageUrl });
      login(res.data.user);
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error('Failed to update profile picture');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button
    onClick={() => navigate('/chat')}
    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
>
    <ArrowLeft size={20} />
</button>
        <h1 className="font-semibold text-gray-900 dark:text-white">Profile</h1>
      </div>

      <div className="flex flex-col items-center pt-12 px-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-primary" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Camera size={18} />
            )}
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
      </div>
    </div>
  );
}

export default Profile;