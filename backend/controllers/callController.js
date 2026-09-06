const Call = require('../models/Call');

// @desc Log a call (created after it ends, with final status)
exports.logCall = async (req, res) => {
  try {
    const callerId = req.userId;
    const { receiverId, status, duration } = req.body;

    if (!receiverId || !status) {
      return res.status(400).json({ message: 'receiverId and status are required' });
    }

    const newCall = new Call({
      callerId,
      receiverId,
      status,
      duration: duration || 0,
    });

    await newCall.save();

    const { io, getReceiverSocketId } = require('../server');
    [callerId, receiverId].forEach((uid) => {
      const socketId = getReceiverSocketId(uid.toString());
      if (socketId) {
        io.to(socketId).emit('callLogged', newCall);
      }
    });

    res.status(201).json({ call: newCall });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get call history between logged-in user and another user
exports.getCallHistory = async (req, res) => {
  try {
    const myId = req.userId;
    const { otherUserId } = req.params;

    const calls = await Call.find({
      $or: [
        { callerId: myId, receiverId: otherUserId },
        { callerId: otherUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ calls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};