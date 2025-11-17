const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Initialize Twilio client only if credentials are available and valid
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  twilioClient = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// @route   POST /api/whatsapp/send-inquiry
// @desc    Send WhatsApp message to caretaker
// @access  Private
router.post('/send-inquiry', protect, async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(503).json({
        success: false,
        message: 'WhatsApp service is not configured'
      });
    }
    
    const { propertyId, message, preferredTime } = req.body;
    
    // Get property details
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if user has unlocked the property
    const user = await User.findById(req.user._id);
    const hasUnlocked = user.unlockedProperties.some(
      up => up.property.toString() === propertyId
    );
    
    if (!hasUnlocked) {
      return res.status(403).json({
        success: false,
        message: 'You must unlock the property to contact the caretaker'
      });
    }
    
    // Format WhatsApp number
    const caretakerWhatsApp = property.premiumDetails.caretaker.whatsapp || 
                              property.premiumDetails.caretaker.phone;
    const formattedNumber = `whatsapp:${caretakerWhatsApp.replace(/^\+/, '')}`;
    
    // Compose message
    const fullMessage = `
*CampusNest Property Inquiry*

Property: ${property.title}
From: ${user.name}
Phone: ${user.phone}
Email: ${user.email}

Message: ${message}

Preferred Viewing Time: ${preferredTime || 'Any time'}

_This inquiry was sent via CampusNest platform_
    `.trim();
    
    // Send WhatsApp message
    const messageResponse = await twilioClient.messages.create({
      body: fullMessage,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: formattedNumber
    });
    
    // Also send confirmation to user
    const userWhatsApp = `whatsapp:${user.phone.replace(/^\+/, '')}`;
    const confirmationMessage = `
*Inquiry Sent Successfully!*

Your message has been sent to the caretaker of "${property.title}".

Caretaker: ${property.premiumDetails.caretaker.name}
They will contact you soon at ${user.phone}.

Thank you for using CampusNest!
    `.trim();
    
    await twilioClient.messages.create({
      body: confirmationMessage,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: userWhatsApp
    });
    
    // Update property inquiry stats
    property.stats.inquiries += 1;
    await property.save();
    
    res.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: messageResponse.sid
    });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending WhatsApp message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/whatsapp/schedule-viewing
// @desc    Schedule property viewing via WhatsApp
// @access  Private
router.post('/schedule-viewing', protect, async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(503).json({
        success: false,
        message: 'WhatsApp service is not configured'
      });
    }
    
    const { propertyId, date, time, numberOfPeople, specialRequests } = req.body;
    
    // Get property details
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if user has unlocked the property
    const user = await User.findById(req.user._id);
    const hasUnlocked = user.unlockedProperties.some(
      up => up.property.toString() === propertyId
    );
    
    if (!hasUnlocked) {
      return res.status(403).json({
        success: false,
        message: 'You must unlock the property to schedule a viewing'
      });
    }
    
    // Format WhatsApp number
    const caretakerWhatsApp = property.premiumDetails.caretaker.whatsapp || 
                              property.premiumDetails.caretaker.phone;
    const formattedNumber = `whatsapp:${caretakerWhatsApp.replace(/^\+/, '')}`;
    
    // Compose viewing request message
    const viewingMessage = `
*Property Viewing Request*

Property: ${property.title}
Location: ${property.premiumDetails.exactAddress}

*Viewer Details:*
Name: ${user.name}
Phone: ${user.phone}
Email: ${user.email}

*Viewing Details:*
Date: ${date}
Time: ${time}
Number of People: ${numberOfPeople}
${specialRequests ? `Special Requests: ${specialRequests}` : ''}

Please confirm if this time works for you.

_Sent via CampusNest_
    `.trim();
    
    // Send to caretaker
    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
        contentVariables: JSON.stringify({
          1: date,
          2: time
        }),
        to: formattedNumber
      });
    } catch (templateError) {
      console.error('Template WhatsApp message error:', templateError.message);
      await twilioClient.messages.create({
        body: viewingMessage,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: formattedNumber
      });
    }
    
    // Send confirmation to user
    const userWhatsApp = `whatsapp:${user.phone.replace(/^\+/, '')}`;
    const userConfirmation = `
*Viewing Request Sent!*

Property: ${property.title}
Date: ${date}
Time: ${time}

The caretaker (${property.premiumDetails.caretaker.name}) will confirm your viewing appointment soon.

Contact: ${property.premiumDetails.caretaker.phone}
    `.trim();
    
    await twilioClient.messages.create({
      body: userConfirmation,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: userWhatsApp
    });
    
    res.json({
      success: true,
      message: 'Viewing request sent successfully'
    });
  } catch (error) {
    console.error('Schedule viewing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling viewing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/whatsapp/webhook
// @desc    Handle incoming WhatsApp messages
// @access  Public (webhook)
router.post('/webhook', async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(503).json({
        success: false,
        message: 'WhatsApp service is not configured'
      });
    }
    
    const { Body, From, To } = req.body;
    
    // Parse the incoming message
    const messageBody = Body.toLowerCase();
    let responseMessage = '';
    
    // Simple command handling
    if (messageBody.includes('help')) {
      responseMessage = `
*CampusNest WhatsApp Help*

Available commands:
- *SEARCH* - Search for properties
- *FEATURED* - View featured properties
- *CONTACT* - Get our contact info
- *HELP* - Show this message

Visit our website: ${process.env.CLIENT_URL}
      `.trim();
    } else if (messageBody.includes('search')) {
      responseMessage = `
To search for properties, visit:
${process.env.CLIENT_URL}/listings

Or reply with your requirements (e.g., "2 bedroom in Westlands under 25000")
      `.trim();
    } else if (messageBody.includes('featured')) {
      // Get featured properties
      const properties = await Property.find({
        isActive: true,
        featured: true
      }).limit(3);
      
      if (properties.length > 0) {
        responseMessage = '*Featured Properties:*\n\n';
        properties.forEach((prop, index) => {
          responseMessage += `${index + 1}. *${prop.title}*\n`;
          responseMessage += `   📍 ${prop.location.area}\n`;
          responseMessage += `   💰 KSh ${prop.price.amount}/month\n`;
          responseMessage += `   🛏️ ${prop.specifications.bedrooms} bedrooms\n\n`;
        });
        responseMessage += `View more at: ${process.env.CLIENT_URL}/listings`;
      } else {
        responseMessage = 'No featured properties available at the moment.';
      }
    } else if (messageBody.includes('contact')) {
      responseMessage = `
*CampusNest Contact Information*

📧 Email: info@campusnest.co.ke
📱 Phone: +254 700 123 456
🌐 Website: ${process.env.CLIENT_URL}
📍 Location: Nairobi, Kenya

Office Hours: Mon-Fri 9AM-6PM, Sat 9AM-1PM
      `.trim();
    } else {
      // Default response
      responseMessage = `
Thank you for contacting CampusNest!

To get started, reply with:
- *HELP* for available commands
- *SEARCH* to find properties
- *FEATURED* for top properties

Or visit: ${process.env.CLIENT_URL}
      `.trim();
    }
    
    // Send response
    await twilioClient.messages.create({
      body: responseMessage,
      from: To,
      to: From
    });
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(200).send('OK'); // Always return 200 to Twilio
  }
});

// @route   POST /api/whatsapp/broadcast
// @desc    Send broadcast message to users (Admin only)
// @access  Private (Admin)
router.post('/broadcast', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send broadcast messages'
      });
    }
    
    if (!twilioClient) {
      return res.status(503).json({
        success: false,
        message: 'WhatsApp service is not configured'
      });
    }
    
    const { message, userIds } = req.body;
    
    // Get users to send to
    const query = userIds ? { _id: { $in: userIds } } : {};
    const users = await User.find(query).select('phone name');
    
    const sendPromises = users.map(user => {
      const whatsappNumber = `whatsapp:${user.phone.replace(/^\+/, '')}`;
      const personalizedMessage = `Hi ${user.name},\n\n${message}\n\n_CampusNest Team_`;
      
      return twilioClient.messages.create({
        body: personalizedMessage,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: whatsappNumber
      }).catch(err => {
        console.error(`Failed to send to ${user.phone}:`, err.message);
        return null;
      });
    });
    
    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r !== null).length;
    
    res.json({
      success: true,
      message: `Broadcast sent to ${successCount} out of ${users.length} users`,
      totalUsers: users.length,
      successCount
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending broadcast',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/whatsapp/templates
// @desc    Get WhatsApp message templates
// @access  Private
router.get('/templates', protect, async (req, res) => {
  try {
    const templates = {
      inquiry: {
        title: 'Property Inquiry',
        template: 'Hi, I am interested in viewing [PROPERTY_NAME]. Is it still available? My preferred viewing time is [TIME].'
      },
      viewing: {
        title: 'Schedule Viewing',
        template: 'I would like to schedule a viewing for [PROPERTY_NAME] on [DATE] at [TIME]. Will there be someone available?'
      },
      followUp: {
        title: 'Follow Up',
        template: 'Hi, I visited [PROPERTY_NAME] recently and would like to know about [QUESTION].'
      }
    };
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates'
    });
  }
});

module.exports = router;
