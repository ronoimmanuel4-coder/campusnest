const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Property = require('../models/Property');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

// Configure PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// M-Pesa helpers
const getMpesaAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');
  
  const response = await axios.get(
    `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${auth}`
      }
    }
  );
  
  return response.data.access_token;
};

// @route   POST /api/payments/unlock/:propertyId
// @desc    Create payment to unlock property details
// @access  Private
router.post('/unlock/:propertyId', protect, async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const property = await Property.findById(req.params.propertyId);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if already unlocked
    const user = await User.findById(req.user._id);
    const alreadyUnlocked = user.unlockedProperties.some(
      up => up.property.toString() === property._id.toString()
    );
    
    if (alreadyUnlocked) {
      return res.status(400).json({
        success: false,
        message: 'Property already unlocked'
      });
    }
    
    // Create payment record
    const payment = await Payment.create({
      user: req.user._id,
      property: property._id,
      amount: 200, // KSh 200 unlock fee
      paymentMethod,
      paymentType: 'unlock',
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    // Process payment based on method
    let paymentResponse;
    
    switch (paymentMethod) {
      case 'mpesa':
        paymentResponse = await processMpesaPayment(payment, req.body.phoneNumber);
        break;
      case 'stripe':
        paymentResponse = await processStripePayment(payment);
        break;
      case 'paypal':
        paymentResponse = await processPayPalPayment(payment);
        break;
      case 'paystack':
        paymentResponse = await processPaystackPayment(payment, user);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method'
        });
    }
    
    res.json({
      success: true,
      message: 'Payment initiated',
      data: paymentResponse
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/paystack/verify/:reference', protect, async (req, res) => {
  try {
    const { reference } = req.params;

    const payment = await Payment.findOne({
      'paystackDetails.reference': reference,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: {
          paymentId: payment._id,
          propertyId: payment.property,
        },
      });
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data;

    if (!data.status || !data.data || data.data.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: data.message || 'Payment not successful',
      });
    }

    payment.status = 'completed';
    payment.isVerified = true;
    payment.paystackDetails = {
      ...payment.paystackDetails,
      status: data.data.status,
      channel: data.data.channel,
      currency: data.data.currency,
      paidAt: data.data.paid_at ? new Date(data.data.paid_at) : undefined,
      rawResponse: data,
    };
    payment.completedAt = Date.now();
    await payment.save();

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: payment._id,
        propertyId: payment.property,
      },
    });
  } catch (error) {
    console.error('Paystack verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
    });
  }
});

// Process M-Pesa payment
const processMpesaPayment = async (payment, phoneNumber) => {
  try {
    const accessToken = await getMpesaAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    
    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString('base64');
    
    // Format phone number (remove +254 and add 254)
    const formattedPhone = phoneNumber.replace(/^\+?254/, '254');
    
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: payment.amount,
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: `${process.env.MPESA_CALLBACK_URL}/${payment._id}`,
        AccountReference: `CN${payment._id}`,
        TransactionDesc: 'CampusNest Property Unlock'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Update payment with M-Pesa details
    payment.mpesaDetails = {
      phoneNumber: formattedPhone,
      merchantRequestId: response.data.MerchantRequestID,
      checkoutRequestId: response.data.CheckoutRequestID
    };
    payment.status = 'processing';
    await payment.save();
    
    return {
      paymentId: payment._id,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      message: 'Please check your phone for the M-Pesa prompt'
    };
  } catch (error) {
    payment.status = 'failed';
    payment.errorDetails = {
      errorCode: error.response?.data?.errorCode,
      errorMessage: error.response?.data?.errorMessage || error.message
    };
    await payment.save();
    throw error;
  }
};

// Process Stripe payment
const processStripePayment = async (payment) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payment.amount * 100, // Convert to cents
      currency: 'kes',
      metadata: {
        paymentId: payment._id.toString(),
        userId: payment.user.toString(),
        propertyId: payment.property.toString()
      }
    });
    
    payment.stripeDetails = {
      paymentIntentId: paymentIntent.id
    };
    payment.status = 'processing';
    await payment.save();
    
    return {
      paymentId: payment._id,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    payment.status = 'failed';
    payment.errorDetails = {
      errorCode: error.code,
      errorMessage: error.message
    };
    await payment.save();
    throw error;
  }
};

// Process PayPal payment
const processPayPalPayment = async (payment) => {
  try {
    const createPayment = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/payment/success?paymentId=${payment._id}`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel?paymentId=${payment._id}`
      },
      transactions: [{
        amount: {
          currency: 'USD',
          total: (payment.amount / 100).toFixed(2) // Convert KES to USD (rough estimate)
        },
        description: 'CampusNest Property Unlock'
      }]
    };
    
    return new Promise((resolve, reject) => {
      paypal.payment.create(createPayment, async (error, paypalPayment) => {
        if (error) {
          payment.status = 'failed';
          payment.errorDetails = {
            errorMessage: error.message
          };
          await payment.save();
          reject(error);
        } else {
          payment.paypalDetails = {
            paymentId: paypalPayment.id
          };
          payment.status = 'processing';
          await payment.save();
          
          const approvalUrl = paypalPayment.links.find(
            link => link.rel === 'approval_url'
          );
          
          resolve({
            paymentId: payment._id,
            paypalPaymentId: paypalPayment.id,
            approvalUrl: approvalUrl.href
          });
        }
      });
    });
  } catch (error) {
    throw error;
  }
};

const processPaystackPayment = async (payment, user) => {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: user.email,
        amount: payment.amount * 100,
        currency: payment.currency || 'KES',
        callback_url: `${process.env.CLIENT_URL}/payment/paystack/callback`,
        metadata: {
          paymentId: payment._id.toString(),
          propertyId: payment.property.toString(),
          userId: payment.user.toString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;

    if (!data.status || !data.data || !data.data.authorization_url) {
      throw new Error(data.message || 'Failed to initialize Paystack transaction');
    }

    payment.paystackDetails = {
      reference: data.data.reference,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      status: 'initialized',
      currency: data.data.currency,
    };
    payment.status = 'processing';
    await payment.save();

    return {
      paymentId: payment._id,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    };
  } catch (error) {
    payment.status = 'failed';
    payment.errorDetails = {
      errorMessage: error.response?.data?.message || error.message,
    };
    await payment.save();
    throw error;
  }
};

// @route   POST /api/payments/mpesa/callback/:paymentId
// @desc    M-Pesa payment callback
// @access  Public (webhook)
router.post('/mpesa/callback/:paymentId', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    const { Body } = req.body;
    
    if (Body.stkCallback.ResultCode === 0) {
      // Payment successful
      const callbackMetadata = Body.stkCallback.CallbackMetadata.Item;
      const mpesaReceiptNumber = callbackMetadata.find(
        item => item.Name === 'MpesaReceiptNumber'
      )?.Value;
      const transactionDate = callbackMetadata.find(
        item => item.Name === 'TransactionDate'
      )?.Value;
      
      payment.status = 'completed';
      payment.mpesaDetails.mpesaReceiptNumber = mpesaReceiptNumber;
      payment.mpesaDetails.transactionDate = transactionDate;
      payment.mpesaDetails.callbackData = Body.stkCallback;
      payment.completedAt = Date.now();
      await payment.save();
      
      // Update user's unlocked properties
      await User.findByIdAndUpdate(payment.user, {
        $addToSet: {
          unlockedProperties: {
            property: payment.property,
            unlockedAt: Date.now(),
            paymentMethod: 'mpesa',
            transactionId: payment._id
          }
        }
      });
      
      // Update property stats
      await Property.findByIdAndUpdate(payment.property, {
        $inc: { 'stats.unlocks': 1 }
      });
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.errorDetails = {
        errorCode: Body.stkCallback.ResultCode,
        errorMessage: Body.stkCallback.ResultDesc
      };
      await payment.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing callback'
    });
  }
});

// @route   POST /api/payments/stripe/webhook
// @desc    Stripe webhook
// @access  Public (webhook)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({
          'stripeDetails.paymentIntentId': paymentIntent.id
        });
        
        if (payment) {
          payment.status = 'completed';
          payment.stripeDetails.receiptUrl = paymentIntent.charges.data[0]?.receipt_url;
          payment.completedAt = Date.now();
          await payment.save();
          
          // Update user's unlocked properties
          await User.findByIdAndUpdate(payment.user, {
            $addToSet: {
              unlockedProperties: {
                property: payment.property,
                unlockedAt: Date.now(),
                paymentMethod: 'stripe',
                transactionId: payment._id
              }
            }
          });
          
          // Update property stats
          await Property.findByIdAndUpdate(payment.property, {
            $inc: { 'stats.unlocks': 1 }
          });
        }
        break;
      
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        const failedPayment = await Payment.findOne({
          'stripeDetails.paymentIntentId': failedIntent.id
        });
        
        if (failedPayment) {
          failedPayment.status = 'failed';
          failedPayment.errorDetails = {
            errorMessage: failedIntent.last_payment_error?.message
          };
          await failedPayment.save();
        }
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook'
    });
  }
});

// @route   POST /api/payments/paypal/execute
// @desc    Execute PayPal payment
// @access  Private
router.post('/paypal/execute', protect, async (req, res) => {
  try {
    const { paymentId, PayerID } = req.body;
    
    const payment = await Payment.findOne({
      'paypalDetails.paymentId': paymentId,
      user: req.user._id
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    const executePayment = {
      payer_id: PayerID
    };
    
    paypal.payment.execute(paymentId, executePayment, async (error, paypalPayment) => {
      if (error) {
        payment.status = 'failed';
        payment.errorDetails = {
          errorMessage: error.message
        };
        await payment.save();
        
        return res.status(400).json({
          success: false,
          message: 'Payment execution failed'
        });
      } else {
        payment.status = 'completed';
        payment.paypalDetails.payerId = PayerID;
        payment.paypalDetails.captureId = paypalPayment.transactions[0].related_resources[0].sale.id;
        payment.completedAt = Date.now();
        await payment.save();
        
        // Update user's unlocked properties
        await User.findByIdAndUpdate(payment.user, {
          $addToSet: {
            unlockedProperties: {
              property: payment.property,
              unlockedAt: Date.now(),
              paymentMethod: 'paypal',
              transactionId: payment._id
            }
          }
        });
        
        // Update property stats
        await Property.findByIdAndUpdate(payment.property, {
          $inc: { 'stats.unlocks': 1 }
        });
        
        res.json({
          success: true,
          message: 'Payment successful',
          data: payment
        });
      }
    });
  } catch (error) {
    console.error('PayPal execute error:', error);
    res.status(500).json({
      success: false,
      message: 'Error executing payment'
    });
  }
});

// @route   GET /api/payments/history
// @desc    Get user's payment history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('property', 'title location price')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history'
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('property', 'title location price');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment'
    });
  }
});

module.exports = router;
