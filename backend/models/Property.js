const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a property title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a property description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  price: {
    amount: {
      type: Number,
      required: [true, 'Please provide the rental price']
    },
    currency: {
      type: String,
      default: 'KES'
    },
    period: {
      type: String,
      enum: ['month', 'semester', 'year'],
      default: 'month'
    },
    negotiable: {
      type: Boolean,
      default: false
    }
  },
  
  // Location details (public)
  location: {
    area: {
      type: String,
      required: [true, 'Please provide the area']
    },
    nearestCampus: String,
    distanceFromCampus: {
      value: Number,
      unit: {
        type: String,
        enum: ['km', 'm'],
        default: 'km'
      }
    }
  },
  
  // Premium location details (hidden until unlocked)
  premiumDetails: {
    exactAddress: {
      type: String,
      required: [true, 'Please provide the exact address']
    },
    gpsCoordinates: {
      latitude: Number,
      longitude: Number
    },
    landmarks: [String],
    caretaker: {
      name: {
        type: String,
        required: [true, 'Please provide caretaker name']
      },
      phone: {
        type: String,
        required: [true, 'Please provide caretaker phone'],
        match: [/^\+254\d{9}$/, 'Please provide a valid phone number']
      },
      alternativePhone: String,
      whatsapp: String,
      availableHours: String
    }
  },
  
  // Property specifications
  specifications: {
    propertyType: {
      type: String,
      enum: ['bedsitter', 'studio', '1br', '2br', '3br', 'house', 'hostel', 'shared'],
      required: true
    },
    bedrooms: {
      type: Number,
      min: 0,
      required: true
    },
    bathrooms: {
      type: Number,
      min: 0,
      required: true
    },
    size: {
      value: Number,
      unit: {
        type: String,
        enum: ['sqm', 'sqft'],
        default: 'sqm'
      }
    },
    floor: Number,
    totalFloors: Number,
    furnished: {
      type: String,
      enum: ['unfurnished', 'semi-furnished', 'fully-furnished'],
      default: 'unfurnished'
    }
  },
  
  // Amenities
  amenities: {
    essential: [String], // WiFi, Water, Electricity, etc.
    security: [String], // CCTV, Guard, Gate, etc.
    extras: [String], // Gym, Pool, Parking, etc.
  },
  
  // Media
  images: [{
    url: {
      type: String,
      required: true
    },
    cloudinaryId: String,
    caption: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  virtualTourUrl: String,
  videoUrl: String,
  
  // Availability
  availability: {
    status: {
      type: String,
      enum: ['available', 'occupied', 'soon'],
      default: 'available'
    },
    availableFrom: {
      type: Date,
      default: Date.now
    },
    vacancies: {
      type: Number,
      default: 0,
      min: 0
    },
    minimumStay: {
      value: Number,
      unit: {
        type: String,
        enum: ['months', 'semesters', 'years'],
        default: 'months'
      }
    }
  },
  
  // Landlord/Owner
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Admin approval status
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'inactive'],
    default: 'pending'
  },
  
  // Verification and quality
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  isPremium: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date,
  
  // Pinning (admin feature)
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: Date,
  
  // Reports
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  
  // Statistics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    unlocks: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    }
  },
  
  // Inquiries / viewing requests history
  inquiries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['inquiry', 'viewing'],
      default: 'inquiry'
    },
    message: String,
    date: String,
    time: String,
    numberOfPeople: Number,
    specialRequests: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reviews summary
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Policies
  policies: {
    pets: {
      type: String,
      enum: ['allowed', 'not-allowed', 'negotiable'],
      default: 'not-allowed'
    },
    smoking: {
      type: String,
      enum: ['allowed', 'not-allowed', 'outdoor-only'],
      default: 'not-allowed'
    },
    visitors: {
      type: String,
      enum: ['allowed', 'restricted', 'not-allowed'],
      default: 'allowed'
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any'
    }
  },
  
  // Additional costs
  additionalCosts: {
    deposit: {
      amount: Number,
      refundable: {
        type: Boolean,
        default: true
      }
    },
    utilities: {
      included: {
        type: Boolean,
        default: false
      },
      estimatedMonthly: Number
    },
    agencyFee: Number
  },
  
  // SEO and metadata
  metaTags: [String],
  keywords: [String],
  
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create slug from title
propertySchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
    
    // Add timestamp to ensure uniqueness
    this.slug = `${this.slug}-${Date.now()}`;
  }
  next();
});

// Virtual for full address (only if unlocked)
propertySchema.virtual('fullAddress').get(function() {
  if (this.premiumDetails && this.premiumDetails.exactAddress) {
    return this.premiumDetails.exactAddress;
  }
  return `${this.location.area} (Exact address hidden)`;
});

// Method to check if property should be featured
propertySchema.methods.shouldBeFeatured = function() {
  return this.featured && (!this.featuredUntil || this.featuredUntil > Date.now());
};

// Static method to get trending properties
propertySchema.statics.getTrending = function(limit = 6) {
  return this.find({ isActive: true })
    .sort('-stats.views -stats.unlocks -rating.average')
    .limit(limit)
    .populate('landlord', 'name email');
};

// Index for search
propertySchema.index({ 
  title: 'text', 
  description: 'text', 
  'location.area': 'text',
  keywords: 'text'
});

// Index for geospatial queries
propertySchema.index({ 'premiumDetails.gpsCoordinates': '2dsphere' });

// Index for performance
propertySchema.index({ isActive: 1, 'availability.status': 1 });
propertySchema.index({ 'price.amount': 1 });
propertySchema.index({ 'location.area': 1 });
propertySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Property', propertySchema);
