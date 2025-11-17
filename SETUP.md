# CampusNest Full-Stack Setup Guide

## 🎯 Quick Start

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Backend Environment
Create `backend/.env` file:
```env
# Essential Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campusnest
JWT_SECRET=change-this-to-random-string
CLIENT_URL=http://localhost:3000

# For full features, add payment and messaging configs
# See backend/.env.example for complete list
```

### 3. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI with your Atlas connection string
```

### 4. Start Backend Server
```bash
cd backend
npm run dev
```

### 5. Install Frontend Dependencies
```bash
# In a new terminal
cd campus-nest
npm install
```

### 6. Start Frontend Application
```bash
npm start
```

### 7. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 🔑 Default Login Credentials

### Admin Account
- Email: admin@campusnest.co.ke
- Password: Admin@123456

### Demo Student
- Email: student@demo.com
- Password: Demo@123

### Demo Landlord
- Email: landlord@demo.com
- Password: Demo@123

## 💳 Payment Testing

### M-Pesa (Sandbox)
1. Get Daraja API credentials from https://developer.safaricom.co.ke
2. Use sandbox test numbers
3. Configure in .env:
```env
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
MPESA_PASSKEY=your-passkey
```

### Stripe (Test Mode)
1. Get test API keys from https://dashboard.stripe.com
2. Use test card: 4242 4242 4242 4242
3. Configure in .env:
```env
STRIPE_SECRET_KEY=sk_test_your-key
```

### PayPal (Sandbox)
1. Get sandbox credentials from https://developer.paypal.com
2. Configure in .env:
```env
PAYPAL_CLIENT_ID=your-id
PAYPAL_CLIENT_SECRET=your-secret
PAYPAL_MODE=sandbox
```

## 📱 WhatsApp Setup (Optional)

1. Get Twilio account: https://www.twilio.com
2. Enable WhatsApp sandbox
3. Configure in .env:
```env
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## 🖼️ Image Upload Setup (Optional)

1. Create Cloudinary account: https://cloudinary.com
2. Get credentials from dashboard
3. Configure in .env:
```env
CLOUDINARY_CLOUD_NAME=your-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

## 📧 Email Setup (Optional)

For Gmail:
1. Enable 2-factor authentication
2. Generate app password
3. Configure in .env:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🚀 Production Deployment

### Backend Deployment (Heroku Example)
```bash
cd backend
heroku create campusnest-api
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-atlas-uri
heroku config:set JWT_SECRET=your-secret
# Set all other environment variables
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)
```bash
cd campus-nest
npm run build
# Deploy build folder to Vercel/Netlify
# Set environment variable:
# REACT_APP_API_URL=https://your-backend-url.com/api
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally
- Check firewall/network settings
- For Atlas, whitelist your IP address

### Payment Integration Issues
- Verify API credentials are correct
- Check callback URLs match your domain
- Ensure you're using sandbox/test mode for development

### WhatsApp Not Working
- Verify Twilio credentials
- Join WhatsApp sandbox (follow Twilio instructions)
- Check phone number format (+254...)

### Images Not Uploading
- Check Cloudinary credentials
- Verify file size limits (5MB default)
- Ensure proper file format (jpeg, png, etc.)

## 📚 API Documentation

Full API documentation available at:
- Development: http://localhost:5000/api-docs
- Production: https://your-api-domain.com/api-docs

## 🤝 Support

For issues or questions:
- Email: support@campusnest.co.ke
- WhatsApp: +254 700 123 456
- GitHub Issues: [Create an issue]

## 📄 License

© 2024 CampusNest. All rights reserved.
