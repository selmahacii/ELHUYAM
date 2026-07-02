const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

async function authorize(email, password) {
  console.log(`Attempting authorize for: ${email}`);
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.log("User not found in DB.");
    return null;
  }
  if (!user.password) {
    console.log("User has no password set.");
    return null;
  }
  if (user.isBanned) {
    console.log("User is banned.");
    return null;
  }
  const valid = await bcrypt.compare(password, user.password);
  console.log("Password compare result:", valid);
  if (!valid) {
    return null;
  }
  console.log("Authorization successful! User role:", user.role);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

async function test() {
  await authorize("admin@elhuyaam.com", "Password123!");
  console.log("-----------------------");
  await authorize("confirmatrice1@elhuyaam.com", "Password123!");
  await db.$disconnect();
}

test();
