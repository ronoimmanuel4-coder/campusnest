const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Production email configuration
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development - use Ethereal Email for testing
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }
};

// Send email function
exports.sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    // Email options
    const mailOptions = {
      from: `CampusNest <${process.env.EMAIL_USER || 'noreply@campusnest.co.ke'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html || options.text
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent:', info.messageId);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Email error:', error);
    
    // In production, fail loudly so we notice email issues
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Failed to send email');
    }

    // In development, do not block registration/login flows because of email
    return null;
  }
};

// Email templates
exports.emailTemplates = {
  welcome: (user) => ({
    subject: 'Welcome to CampusNest - Your Student Housing Solution',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CampusNest!</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name},</h2>
            <p>Thank you for joining CampusNest - your trusted platform for finding the perfect student accommodation near campus.</p>
            
            <h3>What you can do now:</h3>
            <ul>
              <li>Browse verified properties with photos and details</li>
              <li>Unlock premium information for just KSh 200</li>
              <li>Contact caretakers directly</li>
              <li>Save your favorite properties</li>
              <li>Leave reviews after viewing</li>
            </ul>
            
            <p>To get started, verify your email and complete your profile:</p>
            <a href="${process.env.CLIENT_URL}/verify-email/${user.verificationToken}" class="button">Verify Email</a>
            
            <h3>Need Help?</h3>
            <p>Our support team is here to help you find your perfect home:</p>
            <ul>
              <li>Email: info@campusnest.co.ke</li>
              <li>Phone: +254 700 123 456</li>
              <li>WhatsApp: +254 700 123 456</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; 2024 CampusNest. All rights reserved.</p>
            <p>Nairobi, Kenya</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  propertyUnlocked: (user, property) => ({
    subject: 'Property Details Unlocked - CampusNest',
    html: `
      <h2>Property Unlocked Successfully!</h2>
      <p>Hi ${user.name},</p>
      <p>You've successfully unlocked the premium details for:</p>
      <h3>${property.title}</h3>
      <p><strong>Location:</strong> ${property.premiumDetails.exactAddress}</p>
      <p><strong>Caretaker:</strong> ${property.premiumDetails.caretaker.name}</p>
      <p><strong>Phone:</strong> ${property.premiumDetails.caretaker.phone}</p>
      <p>You can now contact the caretaker directly to schedule a viewing.</p>
      <p>Best regards,<br>CampusNest Team</p>
    `
  }),
  
  paymentReceipt: (user, payment) => ({
    subject: 'Payment Receipt - CampusNest',
    html: `
      <h2>Payment Receipt</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for your payment. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Transaction ID:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${payment._id}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">KSh ${payment.amount}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payment Method:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${payment.paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${new Date(payment.createdAt).toLocaleString()}</td>
        </tr>
      </table>
      <p>Thank you for using CampusNest!</p>
    `
  }),
  
  passwordReset: (user, resetUrl) => ({
    subject: 'Password Reset Request - CampusNest',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested to reset your password. Click the button below to create a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 30 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>CampusNest Team</p>
    `
  }),
  
  newPropertyAlert: (user, property) => ({
    subject: 'New Property Matching Your Criteria - CampusNest',
    html: `
      <h2>New Property Alert!</h2>
      <p>Hi ${user.name},</p>
      <p>A new property matching your search criteria has been listed:</p>
      <h3>${property.title}</h3>
      <p><strong>Location:</strong> ${property.location.area}</p>
      <p><strong>Price:</strong> KSh ${property.price.amount}/month</p>
      <p><strong>Bedrooms:</strong> ${property.specifications.bedrooms}</p>
      <a href="${process.env.CLIENT_URL}/property/${property._id}" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">View Property</a>
      <p>Don't miss out on this opportunity!</p>
      <p>Best regards,<br>CampusNest Team</p>
    `
  })
};

// Send bulk emails
exports.sendBulkEmails = async (recipients, template, data) => {
  const transporter = createTransporter();
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const emailContent = typeof template === 'function' ? template(recipient, data) : template;
      
      await transporter.sendMail({
        from: `CampusNest <${process.env.EMAIL_USER || 'noreply@campusnest.co.ke'}>`,
        to: recipient.email,
        subject: emailContent.subject,
        html: emailContent.html
      });
      
      results.push({ email: recipient.email, success: true });
    } catch (error) {
      console.error(`Failed to send email to ${recipient.email}:`, error);
      results.push({ email: recipient.email, success: false, error: error.message });
    }
  }
  
  return results;
};
