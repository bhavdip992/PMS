import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparkpm';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@esparkpm.com';
const ADMIN_PASS  = process.env.SEED_ADMIN_PASS  || 'Admin@123456';
const ADMIN_NAME  = process.env.SEED_ADMIN_NAME  || 'Super Admin';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Dynamically import User and Role models
  const { default: User } = await import('../src/models/user.js');
  const { default: Role } = await import('../src/models/role.js');

  const defaultRoles = [
    { name: 'Super Admin', slug: 'super_admin', permissions: ['*'], isSystem: true },
    { name: 'Admin', slug: 'admin', permissions: ['create:projects', 'edit:projects', 'delete:projects', 'create:users', 'edit:users', 'delete:users'], isSystem: true },
    { name: 'Project Manager', slug: 'project_manager', permissions: ['create:projects', 'edit:projects', 'create:tasks', 'edit:tasks', 'delete:tasks'], isSystem: true },
    { name: 'Developer', slug: 'developer', permissions: ['view:projects', 'edit:tasks'], isSystem: true },
    { name: 'Designer', slug: 'designer', permissions: ['view:projects', 'edit:tasks'], isSystem: true },
    { name: 'QA', slug: 'qa', permissions: ['view:projects', 'edit:tasks'], isSystem: true },
    { name: 'Client', slug: 'client', permissions: ['view:projects'], isSystem: true }
  ];

  for (const r of defaultRoles) {
    await Role.findOneAndUpdate({ slug: r.slug }, r, { upsert: true, new: true });
  }
  console.log('✅ Default roles seeded/updated');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Super Admin already exists: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  // Set the password directly; the pre-save hook in user.ts will hash it
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    role: 'Super Admin',
    department: 'Management',
    isActive: true,
  });

  console.log(`✅ Super Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASS}`);
  console.log('⚠️  Change the password immediately after first login!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
