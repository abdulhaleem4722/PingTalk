const Message = require('../models/Message');

// @desc Get chat history between logged-in user and another user
exports.getMessages = async (req, res) => {
  try {
    const myId = req.userId;
    const { receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: receiverId },
        { senderId: receiverId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Send a message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId } = req.params;
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || '',
      image: image || '',
    });

    await newMessage.save();

    // Real-time delivery via Socket.io
    const { io, getReceiverSocketId } = require('../server');
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};