const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Review content
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    location: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    amenities: {
      type: Number,
      min: 1,
      max: 5
    },
    landlordResponse: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  title: {
    type: String,
    required: [true, 'Please provide a review title'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  comment: {
    type: String,
    required: [true, 'Please provide a review comment'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  
  // Tenant information
  stayDuration: {
    from: Date,
    to: Date,
    months: Number
  },
  
  tenantType: {
    type: String,
    enum: ['student', 'working', 'other']
  },
  
  // Review metadata
  pros: [String],
  cons: [String],
  
  images: [{
    url: String,
    cloudinaryId: String,
    caption: String
  }],
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['rental-agreement', 'payment-proof', 'admin-verified', 'none'],
    default: 'none'
  },
  
  // Interaction stats
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  reported: {
    isReported: {
      type: Boolean,
      default: false
    },
    reports: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Response from landlord
  landlordResponse: {
    comment: String,
    respondedAt: Date
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
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

// Ensure one review per user per property
reviewSchema.index({ property: 1, user: 1 }, { unique: true });

// Calculate average rating
reviewSchema.pre('save', function(next) {
  const ratings = [
    this.rating.overall,
    this.rating.cleanliness,
    this.rating.location,
    this.rating.value,
    this.rating.amenities,
    this.rating.landlordResponse
  ].filter(r => r !== undefined);
  
  if (ratings.length > 0) {
    this.rating.overall = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }
  
  next();
});

// Update property rating after save
reviewSchema.post('save', async function() {
  const Property = mongoose.model('Property');
  const reviews = await this.constructor.find({ 
    property: this.property,
    isActive: true 
  });
  
  const avgRating = reviews.reduce((acc, review) => acc + review.rating.overall, 0) / reviews.length;
  
  await Property.findByIdAndUpdate(this.property, {
    'rating.average': Math.round(avgRating * 10) / 10,
    'rating.count': reviews.length
  });
});

// Update property rating after remove
reviewSchema.post('remove', async function() {
  const Property = mongoose.model('Property');
  const reviews = await this.constructor.find({ 
    property: this.property,
    isActive: true 
  });
  
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((acc, review) => acc + review.rating.overall, 0) / reviews.length;
    
    await Property.findByIdAndUpdate(this.property, {
      'rating.average': Math.round(avgRating * 10) / 10,
      'rating.count': reviews.length
    });
  } else {
    await Property.findByIdAndUpdate(this.property, {
      'rating.average': 0,
      'rating.count': 0
    });
  }
});

// Method to mark review as helpful
reviewSchema.methods.markAsHelpful = async function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count = this.helpful.users.length;
    await this.save();
  }
};

// Method to report review
reviewSchema.methods.reportReview = async function(userId, reason) {
  const existingReport = this.reported.reports.find(
    r => r.user.toString() === userId.toString()
  );
  
  if (!existingReport) {
    this.reported.reports.push({ user: userId, reason });
    if (this.reported.reports.length >= 3) {
      this.reported.isReported = true;
    }
    await this.save();
  }
};

module.exports = mongoose.model('Review', reviewSchema);
