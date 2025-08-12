const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./dist/models/User.js').default;

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existingUser = await User.findOne({ email: 'master.admin@system.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password', 10);
      const superAdmin = new User({
        name: 'Master Admin',
        email: 'master.admin@system.com',
        password: hashedPassword,
        role: 'super_admin'
      });
      await superAdmin.save();
      console.log('Super Admin account seeded successfully.');
    } else {
      console.log('Super Admin account already exists.');
    }
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding admin:', error);
    await mongoose.connection.close();
  }
};

seedAdmin();