import { db } from './index';
import { users } from './schema';

async function seed() {
  console.log("Seeding HotDoc database...");
  
  // Create Doctors
  await db.insert(users).values({
    name: "Dr. Sarah Jenkins (Cardiology)",
    role: "DOCTOR",
    email: "sarah.jenkins@hotdoc.local",
    phone: "555-0101"
  });

  await db.insert(users).values({
    name: "Dr. Mark Sloan (General Practice)",
    role: "DOCTOR",
    email: "mark.sloan@hotdoc.local",
    phone: "555-0102"
  });

  // Create Patient
  await db.insert(users).values({
    name: "Alice Patient",
    role: "PATIENT",
    email: "alice@example.com",
    phone: "555-0999"
  });

  console.log("Database seeded successfully with Doctors and Patient.");
}

seed().catch(console.error);
