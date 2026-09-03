const User = require('../models/User');
const Message = require('../models/Message');

// @desc Get all users except the logged-in user, with last message + unread count
exports.getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.userId;

    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      '-password -otpCode -otpExpiry'
    );

    // For each user, find the last message and unread count
    const usersWithChatInfo = await Promise.all(
      users.map(async (u) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: u._id },
            { senderId: u._id, receiverId: loggedInUserId },
          ],
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: u._id,
          receiverId: loggedInUserId,
          status: { $ne: 'read' },
        });

        return {
          ...u.toObject(),
          lastMessage: lastMessage
            ? { text: lastMessage.text, createdAt: lastMessage.createdAt }
            : null,
          unreadCount,
        };
      })
    );

    // Sort: users with most recent messages first
    usersWithChatInfo.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt) : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt) : 0;
      return timeB - timeA;
    });

    const usersWithChat = usersWithChatInfo.filter((u) => u.lastMessage !== null);
    res.status(200).json({ users: usersWithChat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Update own profile picture
exports.updateProfilePic = async (req, res) => {
  try {
    const userId = req.userId;
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({ message: 'Profile picture URL is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic },
      { new: true }
    ).select('-password -otpCode -otpExpiry');

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Search a user by exact email (for starting a new chat)
exports.searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    const loggedInUserId = req.userId;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const foundUser = await User.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: loggedInUserId },
      isVerified: true,
    }).select('-password -otpCode -otpExpiry');

    if (!foundUser) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    res.status(200).json({ user: foundUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};