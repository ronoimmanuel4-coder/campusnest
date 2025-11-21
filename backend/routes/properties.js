const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Property = require('../models/Property');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../utils/upload');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/properties
// @desc    Get all properties with filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      area,
      minPrice,
      maxPrice,
      bedrooms,
      propertyType,
      furnished,
      sortBy = '-createdAt',
      page = 1,
      limit = 12,
      featured,
      verified
    } = req.query;
    
    // Build query
    const queryObj = { isActive: true };
    
    // Search
    if (search) {
      queryObj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.area': { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Filters
    if (area) queryObj['location.area'] = area;
    if (minPrice || maxPrice) {
      queryObj['price.amount'] = {};
      if (minPrice) queryObj['price.amount'].$gte = Number(minPrice);
      if (maxPrice) queryObj['price.amount'].$lte = Number(maxPrice);
    }
    if (bedrooms) queryObj['specifications.bedrooms'] = Number(bedrooms);
    if (propertyType) queryObj['specifications.propertyType'] = propertyType;
    if (furnished) queryObj['specifications.furnished'] = furnished;
    if (featured === 'true') queryObj.featured = true;
    if (verified === 'true') queryObj.isVerified = true;
    
    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query
    const properties = await Property.find(queryObj)
      .sort(sortBy)
      .limit(limitNum)
      .skip(skip)
      .populate('landlord', 'name email phone')
      .select('-premiumDetails'); // Hide premium details by default
    
    // Get total count for pagination
    const total = await Property.countDocuments(queryObj);
    
    // Check which properties user has unlocked (if authenticated)
    let unlockedPropertyIds = [];
    if (req.user) {
      const user = await User.findById(req.user._id);
      unlockedPropertyIds = user.unlockedProperties.map(up => up.property.toString());
    }
    
    // Format response
    const formattedProperties = properties.map(property => {
      const propertyObj = property.toObject();
      const isUnlocked = unlockedPropertyIds.includes(property._id.toString());
      
      if (!isUnlocked) {
        delete propertyObj.premiumDetails;
      }
      
      return {
        ...propertyObj,
        isUnlocked
      };
    });
    
    res.json({
      success: true,
      count: properties.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: formattedProperties
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching properties'
    });
  }
});

// @route   GET /api/properties/featured
// @desc    Get featured properties
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const properties = await Property.find({
      isActive: true,
      featured: true,
      featuredUntil: { $gt: new Date() }
    })
    .limit(6)
    .populate('landlord', 'name')
    .select('-premiumDetails');
    
    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    console.error('Get featured properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured properties'
    });
  }
});

// @route   GET /api/properties/trending
// @desc    Get trending properties
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const properties = await Property.getTrending(6);
    
    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    console.error('Get trending properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending properties'
    });
  }
});

// @route   GET /api/properties/my-properties
// @desc    Get landlord's own properties
// @access  Private (Landlord)
router.get('/my-properties', protect, async (req, res) => {
  try {
    if (req.user.role !== 'landlord') {
      return res.status(403).json({
        success: false,
        message: 'Only landlords can access their properties'
      });
    }
    
    const properties = await Property.find({ landlord: req.user._id })
      .sort('-createdAt')
      .select('-__v');
    
    res.json({
      success: true,
      count: properties.length,
      data: {
        properties
      }
    });
  } catch (error) {
    console.error('Get my properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your properties'
    });
  }
});

// @route   GET /api/properties/nearby
// @desc    Get properties near user's location
// @access  Private
router.get('/nearby', protect, async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    
    let query = {
      isActive: true,
      status: 'active'
    };
    
    // If location provided, find nearby properties
    if (lat && lng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      };
    }
    
    const properties = await Property.find(query)
      .populate('landlord', 'name email phone profilePicture isVerified')
      .limit(20)
      .select('-__v');
    
    res.json({
      success: true,
      count: properties.length,
      data: {
        properties
      }
    });
  } catch (error) {
    console.error('Get nearby properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby properties'
    });
  }
});

// @route   GET /api/properties/inquiries
// @desc    Get inquiries for landlord's properties
// @access  Private (Landlord)
router.get('/inquiries', protect, async (req, res) => {
  try {
    if (req.user.role !== 'landlord') {
      return res.status(403).json({
        success: false,
        message: 'Only landlords can access inquiries'
      });
    }
    
    // Find all properties for this landlord with their inquiries
    const properties = await Property.find({ landlord: req.user._id })
      .select('title inquiries')
      .populate('inquiries.user', 'name email phone');

    const inquiries = [];

    const now = Date.now();

    const formatTimeAgo = (date) => {
      const diffMs = now - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    };

    properties.forEach((property) => {
      (property.inquiries || []).forEach((inq) => {
        const createdAt = inq.createdAt || new Date();
        const baseMessage = inq.type === 'viewing'
          ? `Viewing request on ${inq.date || ''} at ${inq.time || ''}${inq.specialRequests ? ` - ${inq.specialRequests}` : ''}`
          : inq.message;

        inquiries.push({
          _id: inq._id,
          user: inq.user,
          property: {
            _id: property._id,
            title: property.title
          },
          message: baseMessage,
          type: inq.type,
          date: inq.date,
          time: inq.time,
          numberOfPeople: inq.numberOfPeople,
          specialRequests: inq.specialRequests,
          createdAt,
          timeAgo: formatTimeAgo(createdAt)
        });
      });
    });

    // Newest first
    inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: inquiries.length,
      data: {
        inquiries
      }
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inquiries'
    });
  }
});

// @route   GET /api/properties/:id
// @desc    Get single property
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('landlord', 'name email phone');
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Increment view count if stats exists
    if (property.stats) {
      property.stats.views = (property.stats.views || 0) + 1;
      await property.save();
    }
    
    // Check if user has unlocked this property
    let isUnlocked = false;
    if (req.user) {
      try {
        const user = await User.findById(req.user._id);
        if (user && user.unlockedProperties) {
          isUnlocked = user.unlockedProperties.some(
            up => up.property && up.property.toString() === property._id.toString()
          );
        }
      } catch (err) {
        console.error('Error checking unlock status:', err);
      }
    }
    
    // Format response
    const propertyObj = property.toObject();
    if (!isUnlocked) {
      delete propertyObj.premiumDetails;
    }
    
    // Try to get reviews, but don't fail if Review model doesn't exist
    let reviews = [];
    try {
      reviews = await Review.find({ 
        property: property._id, 
        isActive: true 
      })
      .populate('user', 'name')
      .sort('-createdAt')
      .limit(5);
    } catch (err) {
      console.log('Reviews not available:', err.message);
    }
    
    res.json({
      success: true,
      property: {
        ...propertyObj,
        isUnlocked,
        reviews
      }
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/properties/:id/unlock
// @desc    Unlock property premium details
// @access  Private (Student)
router.post('/:id/unlock', protect, async (req, res) => {
  try {
    console.log('=== UNLOCK PROPERTY REQUEST ===');
    console.log('Property ID:', req.params.id);
    console.log('User ID:', req.user._id);
    console.log('User Role:', req.user.role);

    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Get user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already unlocked
    const alreadyUnlocked = user.unlockedProperties?.some(
      up => up.property && up.property.toString() === property._id.toString()
    );

    if (alreadyUnlocked) {
      return res.json({
        success: true,
        message: 'Property already unlocked',
        alreadyUnlocked: true
      });
    }

    // Add to unlocked properties
    if (!user.unlockedProperties) {
      user.unlockedProperties = [];
    }

    user.unlockedProperties.push({
      property: property._id,
      unlockedAt: new Date()
    });

    await user.save();

    console.log('Property unlocked successfully for user:', user._id);

    // Return property with premium details
    const propertyObj = property.toObject();
    
    res.json({
      success: true,
      message: 'Property unlocked successfully',
      property: {
        ...propertyObj,
        isUnlocked: true
      }
    });
  } catch (error) {
    console.error('Unlock property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlocking property',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/properties
// @desc    Create new property
// @access  Private (Landlord/Admin)
router.post('/', 
  protect, 
  authorize('landlord', 'admin'),
  upload.array('images', 10),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('area').notEmpty().withMessage('Area is required'),
    body('exactAddress').notEmpty().withMessage('Exact address is required'),
    body('caretakerName').notEmpty().withMessage('Caretaker name is required'),
    body('caretakerPhone').notEmpty().withMessage('Caretaker phone is required'),
    body('propertyType').notEmpty().withMessage('Property type is required'),
    body('bedrooms').isNumeric().withMessage('Bedrooms must be a number'),
    body('bathrooms').isNumeric().withMessage('Bathrooms must be a number')
  ],
  validate,
  async (req, res) => {
    try {
      // Upload images to Cloudinary
      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file => uploadToCloudinary(file));
        const results = await Promise.all(uploadPromises);
        imageUrls = results.map((result, index) => ({
          url: result.secure_url,
          cloudinaryId: result.public_id,
          isMain: index === 0
        }));
      }
      
      // Parse amenities
      const amenities = {
        essential: req.body.essentialAmenities ? req.body.essentialAmenities.split(',') : [],
        security: req.body.securityAmenities ? req.body.securityAmenities.split(',') : [],
        extras: req.body.extraAmenities ? req.body.extraAmenities.split(',') : []
      };
      
      // Create property
      const property = await Property.create({
        title: req.body.title,
        description: req.body.description,
        price: {
          amount: req.body.price,
          period: req.body.pricePeriod || 'month',
          negotiable: req.body.negotiable === 'true'
        },
        location: {
          area: req.body.area,
          nearestCampus: req.body.nearestCampus,
          distanceFromCampus: {
            value: req.body.distanceValue,
            unit: req.body.distanceUnit || 'km'
          }
        },
        premiumDetails: {
          exactAddress: req.body.exactAddress,
          gpsCoordinates: {
            latitude: req.body.latitude,
            longitude: req.body.longitude
          },
          landmarks: req.body.landmarks ? req.body.landmarks.split(',') : [],
          caretaker: {
            name: req.body.caretakerName,
            phone: req.body.caretakerPhone,
            alternativePhone: req.body.caretakerAltPhone,
            whatsapp: req.body.caretakerWhatsapp,
            availableHours: req.body.caretakerHours
          }
        },
        specifications: {
          propertyType: req.body.propertyType,
          bedrooms: req.body.bedrooms,
          bathrooms: req.body.bathrooms,
          size: {
            value: req.body.sizeValue,
            unit: req.body.sizeUnit || 'sqm'
          },
          floor: req.body.floor,
          totalFloors: req.body.totalFloors,
          furnished: req.body.furnished || 'unfurnished'
        },
        amenities,
        images: imageUrls,
        availability: {
          status: req.body.availabilityStatus || 'available',
          availableFrom: req.body.availableFrom || Date.now(),
          minimumStay: {
            value: req.body.minimumStayValue,
            unit: req.body.minimumStayUnit || 'months'
          }
        },
        policies: {
          pets: req.body.petsPolicy || 'not-allowed',
          smoking: req.body.smokingPolicy || 'not-allowed',
          visitors: req.body.visitorsPolicy || 'allowed',
          genderPreference: req.body.genderPreference || 'any'
        },
        additionalCosts: {
          deposit: {
            amount: req.body.depositAmount,
            refundable: req.body.depositRefundable !== 'false'
          },
          utilities: {
            included: req.body.utilitiesIncluded === 'true',
            estimatedMonthly: req.body.utilitiesEstimate
          },
          agencyFee: req.body.agencyFee
        },
        landlord: req.user._id,
        keywords: req.body.keywords ? req.body.keywords.split(',') : []
      });
      
      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: property
      });
    } catch (error) {
      console.error('Create property error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating property',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private (Owner/Admin)
router.put('/:id', 
  protect,
  async (req, res) => {
    try {
      console.log('=== UPDATE PROPERTY REQUEST ===');
      console.log('Property ID:', req.params.id);
      console.log('User ID:', req.user._id);
      console.log('User Role:', req.user.role);
      console.log('Update Data:', req.body);

      const property = await Property.findById(req.params.id);
      
      if (!property) {
        console.log('Property not found');
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      console.log('Property Landlord:', property.landlord);
      
      // Check ownership
      if (property.landlord.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        console.log('Authorization failed');
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this property'
        });
      }
      
      // Update fields
      const updates = { ...req.body };
      delete updates.landlord; // Prevent changing owner
      
      console.log('Applying updates:', updates);
      
      const updatedProperty = await Property.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          new: true,
          runValidators: true
        }
      ).populate('landlord', 'name email phone');
      
      console.log('Property updated successfully');
      
      res.json({
        success: true,
        message: 'Property updated successfully',
        property: updatedProperty,
        data: updatedProperty
      });
    } catch (error) {
      console.error('Update property error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if (error.errors) {
        console.error('Validation errors:', error.errors);
      }
      res.status(500).json({
        success: false,
        message: 'Error updating property',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private (Owner/Admin)
router.delete('/:id',
  protect,
  async (req, res) => {
    try {
      const property = await Property.findById(req.params.id);
      
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Check ownership
      if (property.landlord.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this property'
        });
      }
      
      // Soft delete
      property.isActive = false;
      await property.save();
      
      res.json({
        success: true,
        message: 'Property deleted successfully'
      });
    } catch (error) {
      console.error('Delete property error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting property'
      });
    }
  }
);

// @route   POST /api/properties/:id/save
// @desc    Save/unsave property
// @access  Private
router.post('/:id/save', protect, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    const user = await User.findById(req.user._id);
    const isSaved = user.savedProperties.includes(property._id);
    
    if (isSaved) {
      // Unsave
      user.savedProperties = user.savedProperties.filter(
        p => p.toString() !== property._id.toString()
      );
      property.stats.saves = Math.max(0, property.stats.saves - 1);
    } else {
      // Save
      user.savedProperties.push(property._id);
      property.stats.saves += 1;
    }
    
    await user.save();
    await property.save();
    
    res.json({
      success: true,
      message: isSaved ? 'Property unsaved' : 'Property saved',
      isSaved: !isSaved
    });
  } catch (error) {
    console.error('Save property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving property'
    });
  }
});

module.exports = router;
