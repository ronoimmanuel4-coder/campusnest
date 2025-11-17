# CampusNest Backend API

## 🚀 Features Implemented

### Core Features
- **User Authentication**: JWT-based authentication with role-based access (Student, Landlord, Admin)
- **Property Management**: Full CRUD operations for property listings
- **Payment Integration**: 
  - M-Pesa STK Push for mobile payments
  - Stripe for card payments
  - PayPal integration
- **Review System**: Property reviews and ratings with verification
- **WhatsApp Integration**: Direct messaging to caretakers via WhatsApp
- **Admin Dashboard**: Complete admin panel for platform management

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- Input validation
- Account lockout after failed attempts
- Email verification

## 📋 Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- M-Pesa Developer Account (for sandbox)
- Stripe Account
- PayPal Developer Account
- Twilio Account (for WhatsApp)
- Cloudinary Account (for image uploads)

## 🔧 Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/campusnest

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRE=7d

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=174379
MPESA_ENVIRONMENT=sandbox

# Stripe
STRIPE_SECRET_KEY=sk_test_your-key

# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_MODE=sandbox

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend
CLIENT_URL=http://localhost:3000

# Admin Credentials
ADMIN_EMAIL=admin@campusnest.co.ke
ADMIN_PASSWORD=Admin@123456
```

## 🏃‍♂️ Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## 📁 Project Structure

```
backend/
├── models/
│   ├── User.js           # User model with authentication
│   ├── Property.js       # Property listings model
│   ├── Payment.js        # Payment transactions model
│   └── Review.js         # Reviews and ratings model
├── routes/
│   ├── auth.js           # Authentication endpoints
│   ├── users.js          # User management
│   ├── properties.js     # Property CRUD operations
│   ├── payments.js       # Payment processing
│   ├── reviews.js        # Review system
│   ├── whatsapp.js       # WhatsApp integration
│   └── admin.js          # Admin dashboard endpoints
├── middleware/
│   └── auth.js           # Authentication middleware
├── utils/
│   ├── email.js          # Email service
│   ├── upload.js         # File upload handling
│   └── initAdmin.js      # Admin initialization
├── server.js             # Main server file
└── .env.example          # Environment variables template
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Update password
- `POST /api/auth/forgotpassword` - Request password reset
- `PUT /api/auth/resetpassword/:token` - Reset password
- `GET /api/auth/verify/:token` - Verify email

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property (Auth: Landlord/Admin)
- `PUT /api/properties/:id` - Update property (Auth: Owner/Admin)
- `DELETE /api/properties/:id` - Delete property (Auth: Owner/Admin)
- `POST /api/properties/:id/save` - Save/unsave property (Auth)

### Payments
- `POST /api/payments/unlock/:propertyId` - Unlock property details
- `GET /api/payments/history` - Get payment history (Auth)
- `POST /api/payments/mpesa/callback/:paymentId` - M-Pesa callback
- `POST /api/payments/stripe/webhook` - Stripe webhook
- `POST /api/payments/paypal/execute` - Execute PayPal payment

### Reviews
- `GET /api/reviews/property/:propertyId` - Get property reviews
- `POST /api/reviews` - Create review (Auth)
- `PUT /api/reviews/:id` - Update review (Auth: Owner)
- `DELETE /api/reviews/:id` - Delete review (Auth: Owner/Admin)
- `POST /api/reviews/:id/helpful` - Mark as helpful (Auth)
- `POST /api/reviews/:id/report` - Report review (Auth)

### WhatsApp
- `POST /api/whatsapp/send-inquiry` - Send inquiry to caretaker
- `POST /api/whatsapp/schedule-viewing` - Schedule property viewing
- `POST /api/whatsapp/webhook` - Handle incoming messages
- `GET /api/whatsapp/templates` - Get message templates

### Admin (Auth: Admin only)
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Manage users
- `GET /api/admin/properties` - Manage properties
- `GET /api/admin/payments` - View payments
- `GET /api/admin/reviews` - Moderate reviews
- `GET /api/admin/analytics` - Platform analytics

## 🧪 Testing

### Default Users (Development)
```
Admin:
- Email: admin@campusnest.co.ke
- Password: Admin@123456

Student Demo:
- Email: student@demo.com
- Password: Demo@123

Landlord Demo:
- Email: landlord@demo.com
- Password: Demo@123
```

### Test M-Pesa Payment
Use test phone numbers from Safaricom Daraja sandbox

### Test Stripe Payment
Use test card: 4242 4242 4242 4242

## 🚀 Deployment

### MongoDB Atlas Setup
1. Create cluster on MongoDB Atlas
2. Get connection string
3. Update MONGODB_URI in .env

### Deploy to Heroku/Railway/Render
1. Set environment variables
2. Update CLIENT_URL to frontend domain
3. Configure payment callback URLs
4. Set NODE_ENV to production

## 📝 License

This project is proprietary software for CampusNest.
