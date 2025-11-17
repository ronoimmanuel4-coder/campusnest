const User = require('../models/User');

const initAdmin = async () => {
  try {
    // Check if admin exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@campusnest.co.ke';
    const existingAdmin = await User.findOne({ 
      email: adminEmail,
      role: 'admin'
    });
    
    if (!existingAdmin) {
      // Create admin user
      const admin = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        phone: '+254700000000',
        role: 'admin',
        isVerified: true,
        university: 'CampusNest HQ',
        studentId: 'ADMIN001'
      });
      
      console.log('✅ Admin user created successfully');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
      console.log('   ⚠️  Please change the password after first login!');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Create demo users if in development
    if (process.env.NODE_ENV === 'development') {
      await createDemoUsers();
    }
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
  }
};

const createDemoUsers = async () => {
  try {
    const demoUsers = [
      {
        name: 'John Student',
        email: 'student@demo.com',
        password: 'Demo@123',
        phone: '+254712345678',
        role: 'student',
        isVerified: true,
        university: 'University of Nairobi',
        studentId: 'STU2024001'
      },
      {
        name: 'Jane Landlord',
        email: 'landlord@demo.com',
        password: 'Demo@123',
        phone: '+254723456789',
        role: 'landlord',
        isVerified: true,
        university: 'N/A',
        studentId: 'N/A'
      }
    ];
    
    for (const userData of demoUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`✅ Demo user created: ${userData.email}`);
      }
    }
  } catch (error) {
    console.error('Error creating demo users:', error);
  }
};

module.exports = initAdmin;
