/**
 * Script to fix property landlord assignment
 * Run with: node scripts/fixPropertyLandlord.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('../models/Property');
const User = require('../models/User');

const fixPropertyLandlord = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get landlord email from command line or use default
    const landlordEmail = process.argv[2] || 'landlord@demo.com';
    const propertyTitle = process.argv[3];

    // Find the landlord
    const landlord = await User.findOne({ email: landlordEmail, role: 'landlord' });
    
    if (!landlord) {
      console.error(`❌ Landlord not found with email: ${landlordEmail}`);
      process.exit(1);
    }

    console.log(`\n📋 Landlord Found:`);
    console.log(`   Name: ${landlord.name}`);
    console.log(`   Email: ${landlord.email}`);
    console.log(`   ID: ${landlord._id}`);

    // Find properties
    let query = {};
    if (propertyTitle) {
      query.title = { $regex: propertyTitle, $options: 'i' };
      console.log(`\n🔍 Searching for properties matching: "${propertyTitle}"`);
    } else {
      console.log(`\n🔍 Searching for all properties...`);
    }

    const properties = await Property.find(query);
    
    if (properties.length === 0) {
      console.log('❌ No properties found');
      process.exit(0);
    }

    console.log(`\n📦 Found ${properties.length} property(ies):\n`);

    // Show properties and ask for confirmation
    properties.forEach((prop, index) => {
      const currentLandlordMatch = prop.landlord?.toString() === landlord._id.toString();
      console.log(`${index + 1}. ${prop.title}`);
      console.log(`   ID: ${prop._id}`);
      console.log(`   Current Landlord: ${prop.landlord}`);
      console.log(`   Status: ${prop.status}`);
      console.log(`   Match: ${currentLandlordMatch ? '✅ Already correct' : '❌ Needs update'}`);
      console.log('');
    });

    // Update properties that need fixing
    const propertiesToFix = properties.filter(
      prop => prop.landlord?.toString() !== landlord._id.toString()
    );

    if (propertiesToFix.length === 0) {
      console.log('✅ All properties already have correct landlord!');
      process.exit(0);
    }

    console.log(`\n🔧 Updating ${propertiesToFix.length} property(ies)...`);

    for (const prop of propertiesToFix) {
      await Property.updateOne(
        { _id: prop._id },
        { $set: { landlord: landlord._id } }
      );
      console.log(`   ✅ Updated: ${prop.title}`);
    }

    console.log(`\n✅ Done! Updated ${propertiesToFix.length} property(ies)`);
    console.log(`\n💡 The landlord can now see these properties in their dashboard.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the script
fixPropertyLandlord();
