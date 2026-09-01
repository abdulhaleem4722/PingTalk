const User = require('../models/User');

// @desc Get all users except the logged-in user (for sidebar list)
exports.getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.userId;

    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      '-password -otpCode -otpExpiry'
    );

    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};