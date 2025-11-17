const mongoose = require('mongoose');

const adminMessageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  audience: {
    type: String,
    default: 'all'
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'all'],
    default: 'email'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  deliveryStats: {
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    }
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminMessage', adminMessageSchema);
