const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const SupportTicket = require('../models/SupportTicket');
const { getCampusContent } = require('../data/campusContentStore');
const { protect } = require('../middleware/auth');
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

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('unlockedProperties.property', 'title location price images')
      .populate('savedProperties', 'title location price images');
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

router.get('/roommates', protect, async (req, res) => {
  try {
    const roommates = await User.find({
      _id: { $ne: req.user._id },
      role: 'student'
    })
      .select('name email phone university profilePicture avatar');

    res.json({
      success: true,
      count: roommates.length,
      data: roommates
    });
  } catch (error) {
    console.error('Get roommates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roommates'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  protect,
  upload.single('avatar'),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().matches(/^\+254\d{9}$/).withMessage('Invalid phone number'),
    body('university').optional().notEmpty().withMessage('University cannot be empty'),
    body('studentId').optional().notEmpty().withMessage('Student ID cannot be empty')
  ],
  validate,
  async (req, res) => {
    try {
      const updates = {};
      const allowedFields = ['name', 'phone', 'university', 'studentId'];
      
      // Filter allowed fields
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      
      // Handle avatar upload
      if (req.file) {
        const result = await uploadToCloudinary(req.file);
        updates.avatar = {
          url: result.secure_url,
          cloudinaryId: result.public_id
        };
      }
      
      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        {
          new: true,
          runValidators: true
        }
      ).select('-password');
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  }
);

// @route   GET /api/users/unlocked-properties
// @desc    Get user's unlocked properties
// @access  Private
router.get('/unlocked-properties', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'unlockedProperties.property',
        select: 'title location price images premiumDetails specifications amenities'
      });
    
    const unlockedProperties = user.unlockedProperties.map(item => ({
      ...item.property.toObject(),
      unlockedAt: item.unlockedAt,
      paymentMethod: item.paymentMethod,
      transactionId: item.transactionId
    }));
    
    res.json({
      success: true,
      count: unlockedProperties.length,
      data: unlockedProperties
    });
  } catch (error) {
    console.error('Get unlocked properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unlocked properties'
    });
  }
});

// @route   GET /api/users/saved-properties
// @desc    Get user's saved properties
// @access  Private
router.get('/saved-properties', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('savedProperties');
    
    res.json({
      success: true,
      count: user.savedProperties.length,
      data: user.savedProperties
    });
  } catch (error) {
    console.error('Get saved properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved properties'
    });
  }
});

// @route   GET /api/users/my-properties
// @desc    Get properties listed by the user (landlord)
// @access  Private
router.get('/my-properties', protect, async (req, res) => {
  try {
    if (req.user.role !== 'landlord' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only landlords can access this route'
      });
    }
    
    const properties = await Property.find({ landlord: req.user._id })
      .sort('-createdAt');
    
    // Get statistics for each property
    const propertiesWithStats = await Promise.all(
      properties.map(async (property) => {
        const unlockCount = await Payment.countDocuments({
          property: property._id,
          paymentType: 'unlock',
          status: 'completed'
        });
        
        const revenue = await Payment.aggregate([
          {
            $match: {
              property: property._id,
              status: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);
        
        return {
          ...property.toObject(),
          revenue: revenue[0]?.total || 0,
          unlocks: unlockCount
        };
      })
    );
    
    res.json({
      success: true,
      count: propertiesWithStats.length,
      data: propertiesWithStats
    });
  } catch (error) {
    console.error('Get my properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your properties'
    });
  }
});

// @route   GET /api/users/subscription
// @desc    Get user subscription details
// @access  Private
router.get('/subscription', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription');
    
    res.json({
      success: true,
      data: user.subscription
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription'
    });
  }
});

// @route   POST /api/users/subscription
// @desc    Update user subscription
// @access  Private
router.post('/subscription', protect, async (req, res) => {
  try {
    const { plan, duration } = req.body;
    
    const subscriptionPlans = {
      basic: { price: 500, unlocks: 5 },
      premium: { price: 1500, unlocks: 20 },
      enterprise: { price: 3000, unlocks: -1 } // Unlimited
    };
    
    if (!subscriptionPlans[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }
    
    const planDetails = subscriptionPlans[plan];
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (duration || 1));
    
    // Create payment for subscription
    const payment = await Payment.create({
      user: req.user._id,
      amount: planDetails.price * (duration || 1),
      paymentType: 'subscription',
      paymentMethod: req.body.paymentMethod,
      status: 'pending',
      subscriptionDetails: {
        plan,
        duration: {
          value: duration || 1,
          unit: 'months'
        },
        startDate: new Date(),
        endDate: expiresAt,
        autoRenew: req.body.autoRenew || false
      }
    });
    
    // Process payment (simplified for demo)
    // In production, integrate with payment gateway
    payment.status = 'completed';
    await payment.save();
    
    // Update user subscription
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        subscription: {
          plan,
          expiresAt,
          autoRenew: req.body.autoRenew || false
        }
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: user.subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const { password, reason } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }
    
    // Log deletion reason (for analytics)
    console.log(`User ${user.email} deleted account. Reason: ${reason || 'Not specified'}`);
    
    // Soft delete - keep user data but mark as deleted
    user.isActive = false;
    user.deletedAt = new Date();
    user.deletionReason = reason;
    await user.save();
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
});

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort('-createdAt');

    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// @route   PUT /api/users/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
});

router.post('/messages', protect, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Recipient and content are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient id'
      });
    }

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      content
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

router.get('/messages/:userId', protect, async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      });
    }

    const otherUser = await User.findById(otherUserId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user._id }
      ]
    })
      .sort('createdAt');

    const formatted = messages.map((m) => ({
      _id: m._id,
      sender: m.sender,
      recipient: m.recipient,
      content: m.content,
      createdAt: m.createdAt,
      read: m.read,
      isMine: m.sender.toString() === req.user._id.toString()
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

// @route   GET /api/users/statistics
// @desc    Get user statistics
// @access  Private
router.get('/statistics', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's statistics
    const totalUnlocked = await User.findById(userId)
      .select('unlockedProperties')
      .then(user => user.unlockedProperties.length);
    
    const totalSaved = await User.findById(userId)
      .select('savedProperties')
      .then(user => user.savedProperties.length);
    
    const totalSpent = await Payment.aggregate([
      {
        $match: {
          user: userId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const monthlySpending = await Payment.aggregate([
      {
        $match: {
          user: userId,
          status: 'completed',
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalUnlocked,
        totalSaved,
        totalSpent: totalSpent[0]?.total || 0,
        monthlySpending: monthlySpending[0]?.total || 0,
        memberSince: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

// @route   PUT /api/users/profile-picture
// @desc    Update user profile picture
// @access  Private
router.put('/profile-picture', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a profile picture'
      });
    }
    
    const result = await uploadToCloudinary(req.file);
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profilePicture: result.secure_url,
        'avatar.url': result.secure_url,
        'avatar.cloudinaryId': result.public_id
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: result.secure_url
      }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile picture'
    });
  }
});

// @route   GET /api/users/landlord-stats
// @desc    Get landlord statistics
// @access  Private (Landlord)
router.get('/landlord-stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'landlord') {
      return res.status(403).json({
        success: false,
        message: 'Only landlords can access this endpoint'
      });
    }
    
    const userId = req.user._id;
    
    // Get property counts
    const totalProperties = await Property.countDocuments({ landlord: userId });
    const activeProperties = await Property.countDocuments({ 
      landlord: userId, 
      status: 'active',
      isActive: true 
    });
    const pendingProperties = await Property.countDocuments({ 
      landlord: userId, 
      status: 'pending' 
    });
    
    // Get total views across all properties
    const viewStats = await Property.aggregate([
      { $match: { landlord: userId } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$stats.views' },
          totalUnlocks: { $sum: '$stats.unlocks' },
          totalInquiries: { $sum: '$stats.inquiries' }
        }
      }
    ]);
    
    const totalInquiries = viewStats[0]?.totalInquiries || 0;
    
    // Get this week's views
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekViews = await Property.aggregate([
      { $match: { landlord: userId, updatedAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: null,
          views: { $sum: '$stats.views' }
        }
      }
    ]);
    
    // Get average rating
    const ratingStats = await Property.aggregate([
      { $match: { landlord: userId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating.average' }
        }
      }
    ]);
    
    // Calculate occupancy rate (simplified)
    const occupancyRate = activeProperties > 0 
      ? ((activeProperties / totalProperties) * 100).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      data: {
        stats: {
          totalProperties,
          activeProperties,
          pendingProperties,
          totalViews: viewStats[0]?.totalViews || 0,
          viewsThisWeek: thisWeekViews[0]?.views || 0,
          totalInquiries,
          pendingInquiries: totalInquiries,
          averageRating: ratingStats[0]?.avgRating || 0,
          occupancyRate,
          responseRate: 85, // TODO: Calculate from actual inquiry responses
          unreadNotifications: 0 // TODO: Implement notifications
        }
      }
    });
  } catch (error) {
    console.error('Get landlord stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landlord statistics'
    });
  }
});

// @route   GET /api/users/campus-services
// @desc    Get campus services, events and information
// @access  Private
router.get('/campus-services', protect, async (req, res) => {
  try {
    // Services are still mock data for now
    const services = [
      {
        id: 1,
        name: 'Library Services',
        description: 'Access to digital and physical resources',
        hours: 'Mon-Fri: 8AM-10PM, Sat-Sun: 9AM-6PM',
        location: 'Main Campus Library',
        contact: '+254712345678'
      },
      {
        id: 2,
        name: 'Student Cafeteria',
        description: 'Affordable meals for students',
        hours: 'Mon-Fri: 7AM-8PM, Sat: 8AM-6PM',
        location: 'Student Center',
        contact: '+254712345679'
      },
      {
        id: 3,
        name: 'Sports Complex',
        description: 'Gym, pool, and sports facilities',
        hours: 'Mon-Sun: 6AM-10PM',
        location: 'Sports Complex',
        contact: '+254712345680'
      },
      {
        id: 4,
        name: 'Health Center',
        description: '24/7 medical services for students',
        hours: '24/7',
        location: 'Campus Health Center',
        contact: '+254712345681'
      },
      {
        id: 5,
        name: 'Career Services',
        description: 'Job placement and career counseling',
        hours: 'Mon-Fri: 9AM-5PM',
        location: 'Administration Block',
        contact: '+254712345682'
      }
    ];

    const campusContent = getCampusContent();
    const events = campusContent.events || [];
    const quickLinks = campusContent.links || [];
    const studentServices = campusContent.studentServices || [];
    
    res.json({
      success: true,
      data: {
        services,
        events,
        quickLinks,
        studentServices
      }
    });
  } catch (error) {
    console.error('Get campus services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campus services'
    });
  }
});

// @route   POST /api/users/support-tickets
// @desc    Create a support ticket (contact admin)
// @access  Private
router.post('/support-tickets', protect, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      message
    });

    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting support request'
    });
  }
});

module.exports = router;
