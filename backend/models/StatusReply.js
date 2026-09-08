const mongoose = require('mongoose');

const statusReplySchema = new mongoose.Schema(
  {
    statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Status', required: true },
    statusOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StatusReply', statusReplySchema);