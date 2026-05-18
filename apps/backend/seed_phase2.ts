import { Database } from "bun:sqlite";
import { users, labOrders, labResults, messages, communications, invoices, prescriptions, medicalRecords, appointments } from "./src/db/schema";
import { db } from "./src/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log('Starting DB Seed...');

  // 0. Clear old data completely to avoid confusion
  console.log('Clearing old data...');
  await db.delete(labResults);
  await db.delete(labOrders);
  await db.delete(messages);
  await db.delete(communications);
  await db.delete(invoices);
  await db.delete(prescriptions);
  await db.delete(medicalRecords);
  await db.delete(appointments);
  await db.delete(users);

  // 1. Generate Doctors
  console.log('Seeding distinct doctors...');
  const doc1 = await db.insert(users).values({
    name: 'Dr. Meredith Grey',
    email: 'grey@hotdoc.com',
    role: 'DOCTOR',
    phone: '555-0101'
  }).returning();

  const doc2 = await db.insert(users).values({
    name: 'Dr. Derek Shepherd',
    email: 'shepherd@hotdoc.com',
    role: 'DOCTOR',
    phone: '555-0102'
  }).returning();

  const primaryDoc = doc1[0];

  // 2. Generate Patients with Demographics
  console.log('Seeding distinct patients...');
  const patientData = [
    { name: 'Thomas Anderson', email: 'neo@example.com', age: 35, gender: 'Male', department: 'Endocrinology', diagnosis: 'Hypothyroidism', inpatientStatus: 'OUTPATIENT', insuranceType: 'Private' },
    { name: 'Bruce Wayne', email: 'batman@example.com', age: 40, gender: 'Male', department: 'Orthopedics', diagnosis: 'Fractured Ribs', inpatientStatus: 'INPATIENT', insuranceType: 'Private' },
    { name: 'Clark Kent', email: 'superman@example.com', age: 33, gender: 'Male', department: 'Optometry', diagnosis: 'Myopia', inpatientStatus: 'OUTPATIENT', insuranceType: 'Private' },
    { name: 'Diana Prince', email: 'wonderwoman@example.com', age: 30, gender: 'Female', department: 'Cardiology', diagnosis: 'Arrhythmia', inpatientStatus: 'OUTPATIENT', insuranceType: 'Medicare' },
    { name: 'Peter Parker', email: 'spiderman@example.com', age: 21, gender: 'Male', department: 'Dermatology', diagnosis: 'Rash', inpatientStatus: 'OUTPATIENT', insuranceType: 'Medicaid' },
    { name: 'Tony Stark', email: 'ironman@example.com', age: 45, gender: 'Male', department: 'Cardiology', diagnosis: 'Shrapnel Removal', inpatientStatus: 'INPATIENT', insuranceType: 'Uninsured' }
  ];

  const insertedPatients = [];
  for (const p of patientData) {
    const np = await db.insert(users).values({
      name: p.name,
      email: p.email,
      role: 'PATIENT',
      phone: '555-0200',
      age: p.age,
      gender: p.gender,
      department: p.department,
      diagnosis: p.diagnosis,
      inpatientStatus: p.inpatientStatus,
      insuranceType: p.insuranceType
    }).returning();
    insertedPatients.push(np[0]);
  }

  // 3. Lab Orders and Results
  console.log('Seeding lab orders and results...');
  const order1 = await db.insert(labOrders).values({
    patientId: insertedPatients[0].id,
    doctorId: primaryDoc.id,
    facility: 'Central City Lab',
    procedures: ['Blood Panel', 'Lipid Test'],
    doctorsNote: 'Routine checkup.',
    status: 'Completed'
  }).returning();

  await db.insert(labResults).values({
    patientId: insertedPatients[0].id,
    orderId: order1[0].id,
    reportType: 'Blood Panel',
    sourceLab: 'Central City Lab',
    status: 'Received'
  });

  const order2 = await db.insert(labOrders).values({
    patientId: insertedPatients[1].id,
    doctorId: primaryDoc.id,
    facility: 'Westside Imaging',
    procedures: ['MRI Scan'],
    doctorsNote: 'Check for anomalies.',
    status: 'Active'
  }).returning();

  await db.insert(labResults).values({
    patientId: insertedPatients[1].id,
    orderId: order2[0].id,
    reportType: 'MRI',
    sourceLab: 'Westside Imaging',
    status: 'Pending'
  });

  const order3 = await db.insert(labOrders).values({
    patientId: insertedPatients[2].id,
    doctorId: doc2[0].id,
    facility: 'Central City Lab',
    procedures: ['Urinalysis'],
    doctorsNote: 'Patient reports pain.',
    status: 'Active'
  }).returning();

  await db.insert(labResults).values({
    patientId: insertedPatients[2].id,
    orderId: order3[0].id,
    reportType: 'Urinalysis',
    sourceLab: 'Central City Lab',
    status: 'Active'
  });

  // 4. Messages
  console.log('Seeding messages...');
  await db.insert(messages).values({
    senderId: insertedPatients[0].id,
    receiverId: primaryDoc.id,
    content: 'Hello Dr. Grey, when will my results be ready?',
    isRead: 1
  });

  await db.insert(messages).values({
    senderId: primaryDoc.id,
    receiverId: insertedPatients[0].id,
    content: 'They should be uploaded by this afternoon. I have sent an Explainer Video in the meantime.',
    isRead: 1,
    attachments: [
      { name: 'Explainer Video.mp4', size: '30.0 MB', type: 'video' }
    ]
  });

  await db.insert(messages).values({
    senderId: insertedPatients[0].id,
    receiverId: primaryDoc.id,
    content: 'Thank you! I will review the video.',
    isRead: 0
  });

  console.log('Seeded Messages with attachments.');

  console.log('Done!');
  process.exit(0);
}

seed();
