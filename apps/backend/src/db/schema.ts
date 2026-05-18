import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable('users', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  role: text('role').notNull(), // 'DOCTOR' or 'PATIENT'
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  age: integer('age'),
  gender: text('gender'),
  department: text('department'),
  diagnosis: text('diagnosis'),
  inpatientStatus: text('inpatient_status'), // 'INPATIENT' | 'OUTPATIENT'
  insuranceType: text('insurance_type'),
});

export const appointments = sqliteTable('appointments', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  patientId: text('patient_id').references(() => users.id).notNull(),
  doctorId: text('doctor_id').references(() => users.id).notNull(),
  status: text('status').notNull(), // SCHEDULED, COMPLETED, CANCELLED
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  appointmentType: text('appointment_type').notNull(), // IN_PERSON, TELEHEALTH
  telehealthUrl: text('telehealth_url'),
});

export const medicalRecords = sqliteTable('medical_records', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  appointmentId: text('appointment_id').references(() => appointments.id),
  patientId: text('patient_id').references(() => users.id).notNull(),
  doctorId: text('doctor_id').references(() => users.id).notNull(),
  clinicalNotes: text('clinical_notes').notNull(),
  attachments: text('attachments', { mode: 'json' }).$type<string[]>(), 
});

export const documents = sqliteTable('documents', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  patientId: text('patient_id').references(() => users.id).notNull(),
  uploaderId: text('uploader_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  size: text('size').notNull(),
  type: text('type').notNull(),
  category: text('category'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const prescriptions = sqliteTable('prescriptions', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  patientId: text('patient_id').references(() => users.id).notNull(),
  doctorId: text('doctor_id').references(() => users.id).notNull(),
  medicationName: text('medication_name').notNull(),
  dosage: text('dosage').notNull(),
  repeatsAllowed: integer('repeats_allowed').default(0).notNull(),
  status: text('status').notNull(), // ACTIVE, EXPIRED
});

export const invoices = sqliteTable('invoices', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  appointmentId: text('appointment_id').references(() => appointments.id).notNull(),
  patientId: text('patient_id').references(() => users.id).notNull(),
  amount: real('amount').notNull(),
  status: text('status').notNull(), // UNPAID, PAID, PROCESSING
  paymentMethod: text('payment_method'),
});

export const communications = sqliteTable('communications', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  patientId: text('patient_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // SMS, EMAIL
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const messages = sqliteTable('messages', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  senderId: text('sender_id').references(() => users.id).notNull(),
  receiverId: text('receiver_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  isRead: integer('is_read').default(0), // 0 = false, 1 = true
  attachments: text('attachments', { mode: 'json' }).$type<any[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const labOrders = sqliteTable('lab_orders', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  patientId: text('patient_id').references(() => users.id).notNull(),
  doctorId: text('doctor_id').references(() => users.id).notNull(),
  facility: text('facility').notNull(),
  procedures: text('procedures', { mode: 'json' }).$type<string[]>(),
  doctorsNote: text('doctors_note'),
  status: text('status').notNull(), // Active, Completed
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const labResults = sqliteTable('lab_results', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  patientId: text('patient_id').references(() => users.id).notNull(),
  orderId: text('order_id').references(() => labOrders.id),
  reportType: text('report_type').notNull(),
  sourceLab: text('source_lab').notNull(),
  status: text('status').notNull(), // Pending, Active, Received
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
