// Script untuk meng-hash password volunteer yang sudah ada
// Jalankan dengan: node scripts/hash-volunteer-passwords.js

const bcrypt = require('bcryptjs');

// Daftar password default untuk volunteer yang sudah ada
const volunteerPasswords = {
  'budi.s@example.com': 'password123',
  'citra.l@example.com': 'password123',
  'doni.f@example.com': 'password123',
  'eka.p@example.com': 'password123',
  'fajar.n@example.com': 'password123',
  'irvan@cnt.id': 'password123',
  'asep@cnt.id': 'password123',
  'imanhost08@gmail.com': 'password123',
};

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function generateHashedPasswords() {
  console.log('Generating hashed passwords for volunteers...\n');
  
  for (const [email, password] of Object.entries(volunteerPasswords)) {
    const hashedPassword = await hashPassword(password);
    console.log(`-- Volunteer: ${email}`);
    console.log(`UPDATE volunteers SET password_hash = '${hashedPassword}' WHERE email = '${email}';`);
    console.log('');
  }
  
  console.log('-- Atau gunakan script SQL berikut untuk update semua sekaligus:');
  console.log('');
  
  const updates = [];
  for (const [email, password] of Object.entries(volunteerPasswords)) {
    const hashedPassword = await hashPassword(password);
    updates.push(`WHEN '${email}' THEN '${hashedPassword}'`);
  }
  
  console.log(`UPDATE volunteers SET password_hash = CASE email`);
  console.log(updates.join('\n'));
  console.log(`END WHERE email IN (${Object.keys(volunteerPasswords).map(email => `'${email}'`).join(', ')});`);
}

// Jalankan script
generateHashedPasswords().catch(console.error);
