const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Property = require('../models/Property');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

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

// @route   GET /api/reviews/property/:propertyId
// @desc    Get reviews for a property
// @access  Public
router.get('/property/:propertyId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    const reviews = await Review.find({ 
      property: req.params.propertyId,
      isActive: true 
    })
    .populate('user', 'name')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const count = await Review.countDocuments({ 
      property: req.params.propertyId,
      isActive: true 
    });
    
    // Calculate rating breakdown
    const ratingBreakdown = await Review.aggregate([
      { 
        $match: { 
          property: require('mongoose').Types.ObjectId(req.params.propertyId),
          isActive: true 
        } 
      },
      {
        $group: {
          _id: '$rating.overall',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    res.json({
      success: true,
      count: reviews.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      ratingBreakdown,
      data: reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', 
  protect,
  [
    body('property').notEmpty().withMessage('Property ID is required'),
    body('rating.overall').isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
    body('title').notEmpty().withMessage('Review title is required'),
    body('comment').notEmpty().withMessage('Review comment is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { property: propertyId } = req.body;
      
      // Check if property exists
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Check if user has unlocked this property (admins bypass this check)
      const user = await User.findById(req.user._id);
      const hasUnlocked = user.unlockedProperties.some(
        up => up.property.toString() === propertyId
      );
      
      if (!hasUnlocked && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You must unlock the property before reviewing it'
        });
      }
      
      // Check if user has already reviewed this property
      const existingReview = await Review.findOne({
        property: propertyId,
        user: req.user._id
      });
      
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this property'
        });
      }
      
      // Create review
      const review = await Review.create({
        ...req.body,
        user: req.user._id
      });
      
      // Populate user info
      await review.populate('user', 'name');
      
      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review
      });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating review',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }
    
    // Update review
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name');
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review'
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (owner/admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }
    
    // Soft delete
    review.isActive = false;
    await review.save();
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review'
    });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    await review.markAsHelpful(req.user._id);
    
    res.json({
      success: true,
      message: 'Review marked as helpful',
      helpfulCount: review.helpful.count
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking review as helpful'
    });
  }
});

// @route   POST /api/reviews/:id/report
// @desc    Report a review
// @access  Private
router.post('/:id/report', 
  protect,
  [
    body('reason').notEmpty().withMessage('Report reason is required')
  ],
  validate,
  async (req, res) => {
    try {
      const review = await Review.findById(req.params.id);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }
      
      await review.reportReview(req.user._id, req.body.reason);
      
      res.json({
        success: true,
        message: 'Review reported successfully'
      });
    } catch (error) {
      console.error('Report review error:', error);
      res.status(500).json({
        success: false,
        message: 'Error reporting review'
      });
    }
  }
);

// @route   POST /api/reviews/:id/respond
// @desc    Respond to a review (landlord only)
// @access  Private
router.post('/:id/respond',
  protect,
  [
    body('comment').notEmpty().withMessage('Response comment is required')
  ],
  validate,
  async (req, res) => {
    try {
      const review = await Review.findById(req.params.id)
        .populate('property', 'landlord');
      
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }
      
      // Check if user is the landlord of the property
      if (review.property.landlord.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the property landlord can respond to reviews'
        });
      }
      
      review.landlordResponse = {
        comment: req.body.comment,
        respondedAt: Date.now()
      };
      
      await review.save();
      
      res.json({
        success: true,
        message: 'Response added successfully',
        data: review
      });
    } catch (error) {
      console.error('Respond to review error:', error);
      res.status(500).json({
        success: false,
        message: 'Error responding to review'
      });
    }
  }
);

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews by a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ 
      user: req.params.userId,
      isActive: true 
    })
    .populate('property', 'title location images')
    .sort('-createdAt');
    
    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews'
    });
  }
});

module.exports = router;
