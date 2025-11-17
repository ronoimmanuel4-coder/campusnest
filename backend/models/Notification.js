const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['broadcast', 'system', 'payment', 'property', 'support'],
    default: 'broadcast'
  },
  read: {
    type: Boolean,
    default: false
  },
  metadata: {
    audience: String,
    priority: String,
    channel: String,
    adminMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminMessage'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
