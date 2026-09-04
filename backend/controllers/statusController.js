const Status = require('../models/Status');
const Message = require('../models/Message');
const User = require('../models/User');
const StatusReply = require('../models/StatusReply');

// @desc Create a new status
exports.createStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, content, backgroundColor } = req.body;

    if (!type || !content) {
      return res.status(400).json({ message: 'Type and content are required' });
    }

    const newStatus = new Status({
      userId,
      type,
      content,
      backgroundColor: backgroundColor || '#128C7E',
    });

    await newStatus.save();
    const populatedStatus = await newStatus.populate('userId', 'name profilePic');

    res.status(201).json({ status: populatedStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get statuses from people you've chatted with, grouped by user
exports.getStatuses = async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).select('senderId receiverId');

    const contactIds = new Set();
    messages.forEach((m) => {
      const other = m.senderId.toString() === userId.toString() ? m.receiverId : m.senderId;
      contactIds.add(other.toString());
    });

    contactIds.add(userId.toString());

    const statuses = await Status.find({
      userId: { $in: Array.from(contactIds) },
    })
      .populate('userId', 'name profilePic')
      .sort({ createdAt: 1 });

    const grouped = {};
    statuses.forEach((s) => {
      const uid = s.userId._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          user: s.userId,
          statuses: [],
        };
      }
      grouped[uid].statuses.push(s);
    });

    res.status(200).json({ statusGroups: Object.values(grouped) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Mark a status as viewed
exports.viewStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { statusId } = req.params;

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ message: 'Status not found' });

    // apna khud ka status ho to view mat count karo
    if (status.userId.toString() === userId.toString()) {
      return res.status(200).json({ success: true });
    }

    const alreadyViewed = status.viewedBy.some(
      (v) => v.userId.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      status.viewedBy.push({ userId, viewedAt: new Date() });
      await status.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Delete own status
exports.deleteStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { statusId } = req.params;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }
    if (status.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Status.findByIdAndDelete(statusId);
    res.status(200).json({ message: 'Status deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get viewers list (sirf status owner dekh sakay)
exports.getViewers = async (req, res) => {
  try {
    const userId = req.userId;
    const { statusId } = req.params;

    const status = await Status.findById(statusId).populate(
      'viewedBy.userId',
      'name profilePic'
    );
    if (!status) return res.status(404).json({ message: 'Status not found' });

    if (status.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    res.status(200).json(status.viewedBy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Reply on a status
exports.replyToStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { statusId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply text required' });
    }

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ message: 'Status not found' });

    const reply = await StatusReply.create({
      statusId: status._id,
      statusOwnerId: status.userId,
      senderId: userId,
      text: text.trim(),
    });

    const populated = await reply.populate('senderId', 'name profilePic');
    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Jisay status lagaya usay apni replies dikhana (alag section)
exports.getMyStatusReplies = async (req, res) => {
  try {
    const userId = req.userId;

    const replies = await StatusReply.find({ statusOwnerId: userId })
      .populate('senderId', 'name profilePic')
      .populate('statusId', 'type content backgroundColor')
      .sort({ createdAt: -1 });

    res.status(200).json(replies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};