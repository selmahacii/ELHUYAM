const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

async function run() {
  try {
    console.log("Fetching users from database...");
    const users = await db.user.findMany();

    console.log(`Found ${users.length} users:`);
    for (const u of users) {
      console.log(`\nUser ID: ${u.id}`);
      console.log(`Name: ${u.name}`);
      console.log(`Email: ${u.email}`);
      console.log(`Role: ${u.role}`);
      console.log(`Banned: ${u.isBanned}`);
      console.log(`Has Password: ${!!u.password}`);
      
      if (u.password) {
        const isPassword123 = await bcrypt.compare('Password123!', u.password);
        const isElhuyam2026 = await bcrypt.compare('elhuyam2026', u.password);
        
        console.log(`Matches 'Password123!': ${isPassword123}`);
        console.log(`Matches 'elhuyam2026': ${isElhuyam2026}`);
      }
    }
  } catch (err) {
    console.error("Error executing script:", err);
  } finally {
    await db.$disconnect();
  }
}

run();
