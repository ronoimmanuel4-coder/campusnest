const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true
  },
  
  currency: {
    type: String,
    default: 'KES'
  },
  
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'stripe', 'paypal', 'paystack', 'bank', 'cash'],
    required: true
  },
  
  paymentType: {
    type: String,
    enum: ['unlock', 'subscription', 'featured', 'deposit', 'rent'],
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // M-Pesa specific fields
  mpesaDetails: {
    phoneNumber: String,
    transactionId: String,
    merchantRequestId: String,
    checkoutRequestId: String,
    mpesaReceiptNumber: String,
    transactionDate: Date,
    callbackData: mongoose.Schema.Types.Mixed
  },
  
  // Stripe specific fields
  stripeDetails: {
    paymentIntentId: String,
    customerId: String,
    paymentMethodId: String,
    receiptUrl: String,
    chargeId: String
  },
  
  // PayPal specific fields
  paypalDetails: {
    orderId: String,
    payerId: String,
    paymentId: String,
    captureId: String,
    payerEmail: String
  },
  
  // Paystack specific fields
  paystackDetails: {
    reference: String,
    authorizationUrl: String,
    accessCode: String,
    status: String,
    channel: String,
    currency: String,
    paidAt: Date,
    rawResponse: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    referrer: String
  },
  
  // Subscription related
  subscriptionDetails: {
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise']
    },
    duration: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'months', 'years']
      }
    },
    startDate: Date,
    endDate: Date,
    autoRenew: Boolean
  },
  
  // Refund information
  refundDetails: {
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
    refundTransactionId: String,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Error handling
  errorDetails: {
    errorCode: String,
    errorMessage: String,
    errorStack: String,
    attempts: {
      type: Number,
      default: 0
    }
  },
  
  // Invoice details
  invoice: {
    invoiceNumber: String,
    invoiceUrl: String,
    issuedAt: Date,
    dueDate: Date
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: String,
  
  completedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate invoice number
paymentSchema.pre('save', function(next) {
  if (!this.invoice.invoiceNumber && this.status === 'completed') {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.invoice.invoiceNumber = `INV-${year}${month}-${random}`;
    this.invoice.issuedAt = date;
  }
  next();
});

// Update user's unlocked properties on successful payment
paymentSchema.post('save', async function() {
  if (this.status === 'completed' && this.paymentType === 'unlock' && this.property) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.user, {
      $addToSet: {
        unlockedProperties: {
          property: this.property,
          unlockedAt: new Date(),
          paymentMethod: this.paymentMethod,
          transactionId: this._id
        }
      }
    });
    
    // Update property unlock stats
    const Property = mongoose.model('Property');
    await Property.findByIdAndUpdate(this.property, {
      $inc: { 'stats.unlocks': 1 }
    });
  }
});

// Static method to get payment statistics
paymentSchema.statics.getStatistics = async function(startDate, endDate, groupBy = 'day') {
  const matchStage = {
    status: 'completed',
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  const groupFormats = {
    day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
    month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
    year: { $year: "$createdAt" }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupFormats[groupBy],
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
        avgAmount: { $avg: "$amount" },
        paymentMethods: { $push: "$paymentMethod" }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Method to process refund
paymentSchema.methods.processRefund = async function(amount, reason, adminId) {
  if (this.status !== 'completed') {
    throw new Error('Can only refund completed payments');
  }
  
  this.status = 'refunded';
  this.refundDetails = {
    refundedAt: new Date(),
    refundAmount: amount || this.amount,
    refundReason: reason,
    refundedBy: adminId
  };
  
  await this.save();
  
  // Remove property from user's unlocked list if it's an unlock payment
  if (this.paymentType === 'unlock' && this.property) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.user, {
      $pull: {
        unlockedProperties: {
          property: this.property
        }
      }
    });
  }
  
  return this;
};

// Indexes for performance
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ property: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ 'mpesaDetails.mpesaReceiptNumber': 1 });
paymentSchema.index({ 'stripeDetails.paymentIntentId': 1 });
paymentSchema.index({ 'paypalDetails.orderId': 1 });
paymentSchema.index({ 'paystackDetails.reference': 1 });

module.exports = mongoose.model('Payment', paymentSchema);
