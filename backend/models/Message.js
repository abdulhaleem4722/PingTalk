const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    image: { type: String, default: '' },
    statusReply: {
      type: {
        type: String,
        enum: ['text', 'image', 'video'],
      },
      content: { type: String },
      backgroundColor: { type: String },
    },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);