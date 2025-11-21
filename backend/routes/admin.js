const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const AdminMessage = require('../models/AdminMessage');
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const { getCampusContent, updateCampusContent } = require('../data/campusContentStore');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    // User statistics
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thisMonth } });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    
    // Property statistics
    const totalProperties = await Property.countDocuments();
    const activeProperties = await Property.countDocuments({ isActive: true });
    const verifiedProperties = await Property.countDocuments({ isVerified: true });
    const featuredProperties = await Property.countDocuments({ featured: true });
    
    // Payment statistics
    const totalPayments = await Payment.countDocuments({ status: 'completed' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const revenueThisMonth = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: thisMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const revenueToday = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: today }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Payment method breakdown
    const paymentMethods = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { 
        $group: { 
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        } 
      }
    ]);
    
    // Review statistics
    const totalReviews = await Review.countDocuments();
    const averageRating = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating.overall' } } }
    ]);
    
    // Top performing properties
    const topProperties = await Property.find({ isActive: true })
      .sort('-stats.unlocks -stats.views')
      .limit(5)
      .select('title location stats rating');
    
    // Recent activities
    const recentPayments = await Payment.find({ status: 'completed' })
      .populate('user', 'name email')
      .populate('property', 'title')
      .sort('-createdAt')
      .limit(10);
    
    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email role createdAt');
    
    const recentProperties = await Property.find()
      .populate('landlord', 'name')
      .sort('-createdAt')
      .limit(5)
      .select('title location landlord createdAt');
    
    res.json({
      success: true,
      data: {
        statistics: {
          users: {
            total: totalUsers,
            newToday: newUsersToday,
            newThisMonth: newUsersThisMonth,
            verified: verifiedUsers
          },
          properties: {
            total: totalProperties,
            active: activeProperties,
            verified: verifiedProperties,
            featured: featuredProperties
          },
          payments: {
            totalTransactions: totalPayments,
            totalRevenue: totalRevenue[0]?.total || 0,
            revenueThisMonth: revenueThisMonth[0]?.total || 0,
            revenueToday: revenueToday[0]?.total || 0,
            byMethod: paymentMethods
          },
          reviews: {
            total: totalReviews,
            averageRating: averageRating[0]?.avg || 0
          }
        },
        topProperties,
        recentActivities: {
          payments: recentPayments,
          users: recentUsers,
          properties: recentProperties
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Campus Events & Quick Links Management

// @route   GET /api/admin/campus-content
// @desc    Get campus events and quick links
// @access  Private (Admin)
router.get('/campus-content', async (req, res) => {
  try {
    const content = getCampusContent();
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get campus content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campus content'
    });
  }
});

// @route   PUT /api/admin/campus-content
// @desc    Update campus events and quick links
// @access  Private (Admin)
router.put('/campus-content', async (req, res) => {
  try {
    const { events, links } = req.body;

    const updated = updateCampusContent({ events, links });

    res.json({
      success: true,
      message: 'Campus content updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update campus content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating campus content'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { 
      role, 
      verified, 
      search, 
      sortBy = '-createdAt',
      page = 1,
      limit = 20 
    } = req.query;
    
    const query = {};
    
    if (role) query.role = role;
    if (verified !== undefined) query.isVerified = verified === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (verify, change role, etc.)
// @access  Private (Admin)
router.put('/users/:id', async (req, res) => {
  try {
    const { isVerified, role, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }
    
    await user.remove();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// @route   GET /api/admin/properties
// @desc    Get all properties with admin details
// @access  Private (Admin)
router.get('/properties', async (req, res) => {
  try {
    const {
      isVerified,
      isActive,
      featured,
      search,
      sortBy = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;
    
    const query = {};
    
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (featured !== undefined) query.featured = featured === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.area': { $regex: search, $options: 'i' } }
      ];
    }
    
    const properties = await Property.find(query)
      .populate('landlord', 'name email phone')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Property.countDocuments(query);
    
    res.json({
      success: true,
      count: properties.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: properties
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching properties'
    });
  }
});

// @route   PUT /api/admin/properties/:id/verify
// @desc    Verify a property
// @access  Private (Admin)
router.put('/properties/:id/verify', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    property.isVerified = true;
    property.verifiedBy = req.user._id;
    property.verifiedAt = Date.now();
    
    await property.save();
    
    res.json({
      success: true,
      message: 'Property verified successfully',
      data: property
    });
  } catch (error) {
    console.error('Verify property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying property'
    });
  }
});

// @route   PUT /api/admin/properties/:id/feature
// @desc    Feature/unfeature a property
// @access  Private (Admin)
router.put('/properties/:id/feature', async (req, res) => {
  try {
    const { featured, duration } = req.body;
    
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    property.featured = featured;
    if (featured && duration) {
      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + duration);
      property.featuredUntil = featuredUntil;
    } else {
      property.featuredUntil = undefined;
    }
    
    await property.save();
    
    res.json({
      success: true,
      message: featured ? 'Property featured successfully' : 'Property unfeatured',
      data: property
    });
  } catch (error) {
    console.error('Feature property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error featuring property'
    });
  }
});

// @route   GET /api/admin/payments
// @desc    Get all payments
// @access  Private (Admin)
router.get('/payments', async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      startDate,
      endDate,
      sortBy = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const payments = await Payment.find(query)
      .populate('user', 'name email phone role')
      .populate({
        path: 'property',
        select: 'title landlord',
        populate: {
          path: 'landlord',
          select: 'name email phone role'
        }
      })
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payment.countDocuments(query);
    
    // Calculate totals
    const totals = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);
    
    res.json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      totals,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
});

// @route   POST /api/admin/payments/:id/refund
// @desc    Process refund
// @access  Private (Admin)
router.post('/payments/:id/refund', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    await payment.processRefund(amount, reason, req.user._id);
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
});

// @route   GET /api/admin/reviews
// @desc    Get all reviews (including reported ones)
// @access  Private (Admin)
router.get('/reviews', async (req, res) => {
  try {
    const {
      reported,
      verified,
      sortBy = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;
    
    const query = {};
    
    if (reported === 'true') query['reported.isReported'] = true;
    if (verified !== undefined) query.isVerified = verified === 'true';
    
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('property', 'title')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments(query);
    
    res.json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
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

// @route   PUT /api/admin/reviews/:id
// @desc    Moderate review (verify, activate/deactivate)
// @access  Private (Admin)
router.put('/reviews/:id', async (req, res) => {
  try {
    const { isActive, isVerified } = req.body;
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    if (isActive !== undefined) review.isActive = isActive;
    if (isVerified !== undefined) {
      review.isVerified = isVerified;
      review.verificationMethod = 'admin-verified';
    }
    
    // Clear reported status if reactivating
    if (isActive === true) {
      review.reported.isReported = false;
      review.reported.reports = [];
    }
    
    await review.save();
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (Admin)
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Payment analytics
    const paymentStats = await Payment.getStatistics(start, end, groupBy);
    
    // User registration trends
    const userTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          byRole: {
            $push: '$role'
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Property listing trends
    const propertyTrends = await Property.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          totalViews: { $sum: '$stats.views' },
          totalUnlocks: { $sum: '$stats.unlocks' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Top areas by property count
    const topAreas = await Property.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$location.area',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price.amount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        dateRange: { start, end },
        payments: paymentStats,
        users: userTrends,
        properties: propertyTrends,
        topAreas
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

// @route   PUT /api/admin/users/:id/verify
// @desc    Verify a user
// @access  Private (Admin)
router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isVerified = true;
    user.emailVerified = true;
    await user.save();
    
    res.json({
      success: true,
      message: 'User verified successfully',
      data: user
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying user'
    });
  }
});

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban a user
// @access  Private (Admin)
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot ban admin users'
      });
    }
    
    user.isBanned = true;
    user.bannedAt = Date.now();
    user.bannedBy = req.user._id;
    await user.save();
    
    res.json({
      success: true,
      message: 'User banned successfully',
      data: user
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error banning user'
    });
  }
});

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user
// @access  Private (Admin)
router.put('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isBanned = false;
    user.bannedAt = null;
    user.bannedBy = null;
    await user.save();
    
    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: user
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unbanning user'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['student', 'landlord', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.role = role;
    await user.save();
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role'
    });
  }
});

// @route   PUT /api/admin/users/:id/reset-password
// @desc    Reset user password
// @access  Private (Admin)
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.password = password;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

// @route   PUT /api/admin/users/:id/approve-landlord
// @desc    Approve a landlord
// @access  Private (Admin)
router.put('/users/:id/approve-landlord', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role !== 'landlord') {
      return res.status(400).json({
        success: false,
        message: 'User is not a landlord'
      });
    }
    
    user.isApproved = true;
    user.approvedAt = Date.now();
    user.approvedBy = req.user._id;
    await user.save();
    
    res.json({
      success: true,
      message: 'Landlord approved successfully',
      data: user
    });
  } catch (error) {
    console.error('Approve landlord error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving landlord'
    });
  }
});

// @route   PUT /api/admin/users/:id/reject-landlord
// @desc    Reject a landlord
// @access  Private (Admin)
router.put('/users/:id/reject-landlord', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role !== 'landlord') {
      return res.status(400).json({
        success: false,
        message: 'User is not a landlord'
      });
    }
    
    user.isApproved = false;
    await user.save();
    
    res.json({
      success: true,
      message: 'Landlord rejected',
      data: user
    });
  } catch (error) {
    console.error('Reject landlord error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting landlord'
    });
  }
});

// @route   PUT /api/admin/properties/:id/approve
// @desc    Approve a property
// @access  Private (Admin)
router.put('/properties/:id/approve', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    property.status = 'active';
    property.isVerified = true;
    property.verifiedBy = req.user._id;
    property.verifiedAt = Date.now();
    await property.save();
    
    res.json({
      success: true,
      message: 'Property approved successfully',
      data: property
    });
  } catch (error) {
    console.error('Approve property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving property'
    });
  }
});

// @route   PUT /api/admin/properties/:id/reject
// @desc    Reject a property
// @access  Private (Admin)
router.put('/properties/:id/reject', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    property.status = 'rejected';
    await property.save();
    
    res.json({
      success: true,
      message: 'Property rejected',
      data: property
    });
  } catch (error) {
    console.error('Reject property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting property'
    });
  }
});

// @route   PUT /api/admin/properties/:id/pin
// @desc    Pin a property to top
// @access  Private (Admin)
router.put('/properties/:id/pin', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    property.isPinned = true;
    property.pinnedAt = Date.now();
    await property.save();
    
    res.json({
      success: true,
      message: 'Property pinned successfully',
      data: property
    });
  } catch (error) {
    console.error('Pin property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error pinning property'
    });
  }
});

// @route   PUT /api/admin/properties/:id/unpin
// @desc    Unpin a property
// @access  Private (Admin)
router.put('/properties/:id/unpin', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    property.isPinned = false;
    property.pinnedAt = null;
    await property.save();
    
    res.json({
      success: true,
      message: 'Property unpinned successfully',
      data: property
    });
  } catch (error) {
    console.error('Unpin property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unpinning property'
    });
  }
});

// @route   PUT /api/admin/properties/:id/unfeature
// @desc    Unfeature a property
// @access  Private (Admin)
router.put('/properties/:id/unfeature', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    property.isFeatured = false;
    property.featured = false;
    await property.save();
    
    res.json({
      success: true,
      message: 'Property unfeatured successfully',
      data: property
    });
  } catch (error) {
    console.error('Unfeature property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unfeaturing property'
    });
  }
});

// @route   DELETE /api/admin/properties/:id
// @desc    Delete a property
// @access  Private (Admin)
router.delete('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    await property.remove();
    
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
});

// Admin Messaging & Support

// @route   GET /api/admin/messages
// @desc    Get broadcast/admin messages
// @access  Private (Admin)
router.get('/messages', async (req, res) => {
  try {
    const messages = await AdminMessage.find()
      .sort('-sentAt');

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get admin messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin messages'
    });
  }
});

// @route   POST /api/admin/messages/broadcast
// @desc    Create a new broadcast message
// @access  Private (Admin)
router.post('/messages/broadcast', async (req, res) => {
  try {
    const { title, message, targetAudience, channel, priority } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const audience = targetAudience || 'all';

    const adminMessage = await AdminMessage.create({
      title,
      message,
      audience,
      channel: channel || 'email',
      priority: priority || 'normal',
      sentAt: new Date(),
      createdBy: req.user._id,
      deliveryStats: {
        sent: 0,
        delivered: 0,
        failed: 0
      }
    });

    const userQuery = { isBanned: { $ne: true } };

    if (audience === 'students') {
      userQuery.role = 'student';
    } else if (audience === 'landlords') {
      userQuery.role = 'landlord';
    } else if (audience === 'verified') {
      userQuery.isVerified = true;
    } else if (audience === 'new') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      userQuery.createdAt = { $gte: sevenDaysAgo };
    }

    const recipients = await User.find(userQuery).select('_id');

    if (recipients.length > 0) {
      const notifications = recipients.map((user) => ({
        user: user._id,
        title,
        message,
        type: 'broadcast',
        metadata: {
          audience,
          priority: priority || 'normal',
          channel: channel || 'email',
          adminMessage: adminMessage._id
        }
      }));

      await Notification.insertMany(notifications);

      adminMessage.deliveryStats.sent = recipients.length;
      await adminMessage.save();
    }

    res.status(201).json({
      success: true,
      message: 'Broadcast created successfully',
      data: adminMessage
    });
  } catch (error) {
    console.error('Create broadcast message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating broadcast message'
    });
  }
});

// @route   GET /api/admin/support-tickets
// @desc    Get support tickets
// @access  Private (Admin)
router.get('/support-tickets', async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching support tickets'
    });
  }
});

// @route   POST /api/admin/support-tickets/:id/reply
// @desc    Reply to a support ticket
// @access  Private (Admin)
router.post('/support-tickets/:id/reply', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    ticket.replies.push({
      message,
      user: req.user._id,
      createdAt: new Date()
    });
    // When admin replies, mark as pending/resolved workflow can be handled via status endpoint
    if (ticket.status === 'open') {
      ticket.status = 'pending';
    }

    await ticket.save();

    res.json({
      success: true,
      message: 'Reply added successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Reply to support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error replying to support ticket'
    });
  }
});

// @route   PUT /api/admin/support-tickets/:id/status
// @desc    Update support ticket status
// @access  Private (Admin)
router.put('/support-tickets/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['open', 'pending', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    ticket.status = status;
    await ticket.save();

    res.json({
      success: true,
      message: 'Support ticket status updated',
      data: ticket
    });
  } catch (error) {
    console.error('Update support ticket status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating support ticket status'
    });
  }
});

module.exports = router;
