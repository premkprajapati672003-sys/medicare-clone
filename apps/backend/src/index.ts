import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { db } from './db';
import { users, appointments, medicalRecords, prescriptions, invoices, communications, messages, labOrders, labResults, documents } from './db/schema';
import { eq, and, gte, or } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = new Elysia()
  .use(cors())
  .onError(({ code, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'NOT_FOUND', message: 'The requested route was not found on this server.' };
    }
  })
  .get('/', () => ({ message: 'HotDoc Clone API - Phase 1', status: 'online' }))
  
  // 1. Get all Doctors (for patient smart search)
  .get('/api/doctors', async () => {
    return await db.query.users.findMany({
      where: eq(users.role, 'DOCTOR')
    });
  })
  
  // 2. Get Doctor's Availability (scheduled appointments)
  .get('/api/doctors/:id/appointments', async ({ params: { id } }) => {
    return await db.query.appointments.findMany({
      where: and(
        eq(appointments.doctorId, id),
        eq(appointments.status, 'SCHEDULED')
      ),
      orderBy: (appointments, { asc }) => [asc(appointments.startTime)]
    });
  })
  
  // 3. Book an appointment
  .post('/api/appointments', async ({ body }) => {
    const { patientId, doctorId, startTime, endTime, appointmentType } = body as any;
    
    const newAppointment = await db.insert(appointments).values({
      patientId,
      doctorId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      appointmentType,
      status: 'SCHEDULED'
    }).returning();
    
    await db.insert(communications).values({
      patientId,
      type: 'SMS',
      message: `Booking Confirmed: Your appointment has been scheduled for ${new Date(startTime).toLocaleString()}.`
    });
    
    return newAppointment[0];
  })
  
  // 4. Mock Login
  .post('/api/auth/login', async ({ body }) => {
    const { email } = body as any;
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    return user;
  })
  
  // 5. Register (For the Professor to add themselves)
  .post('/api/auth/register', async ({ body }) => {
    const { email, name, role } = body as any;
    
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (existing) return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 400 });
    
    const newUser = await db.insert(users).values({
      email,
      name,
      role, // 'DOCTOR' or 'PATIENT'
      phone: ''
    }).returning();
    
    return newUser[0];
  })

  // Google OAuth Login
  .post('/api/auth/google', async ({ body }) => {
    const { token, role } = body as { token: string, role: string };
    try {
      const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) throw new Error("Invalid token payload");
      
      const { email, name } = payload;
      
      let user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user) {
        const newUser = await db.insert(users).values({
          role: role || 'PATIENT',
          name: name || 'Google User',
          email,
        }).returning();
        user = newUser[0];
      } else {
        if (role && user.role !== role) {
           return new Response(JSON.stringify({ error: `Account exists but is registered as a ${user.role}` }), { status: 400 });
        }
      }

      return user;
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 401 });
    }
  })
  
  // Get specific appointment
  .get('/api/appointments/:id', async ({ params: { id } }) => {
    const apt = await db.query.appointments.findFirst({
      where: eq(appointments.id, id)
    });
    return apt || { error: 'Not found' };
  })

  // Complete an appointment
  .put('/api/appointments/:id/complete', async ({ params: { id } }) => {
    const apt = await db.query.appointments.findFirst({
      where: eq(appointments.id, id)
    });
    
    if (!apt) return new Response(JSON.stringify({ error: 'Appointment not found' }), { status: 404 });

    const updated = await db.update(appointments)
      .set({ status: 'COMPLETED' })
      .where(eq(appointments.id, id))
      .returning();

    await db.insert(invoices).values({
      appointmentId: apt.id,
      patientId: apt.patientId,
      amount: 150.00,
      status: 'UNPAID'
    });

    await db.insert(communications).values({
      patientId: apt.patientId,
      type: 'EMAIL',
      message: `Your appointment is complete. A new invoice for $150.00 has been generated in your Billing Portal.`
    });

    return updated[0];
  })

  // Save clinical notes
  .post('/api/records', async ({ body }) => {
    const { appointmentId, patientId, doctorId, clinicalNotes, attachments } = body as any;
    const newRecord = await db.insert(medicalRecords).values({
      appointmentId,
      patientId,
      doctorId,
      clinicalNotes,
      attachments: attachments ? [attachments] : []
    }).returning();
    return newRecord[0];
  })

  // Save prescription
  .post('/api/prescriptions', async ({ body }) => {
    const { patientId, doctorId, medicationName, dosage, repeatsAllowed } = body as any;
    const newPrescription = await db.insert(prescriptions).values({
      patientId,
      doctorId,
      medicationName,
      dosage,
      repeatsAllowed: parseInt(repeatsAllowed) || 0,
      status: 'ACTIVE'
    }).returning();
    return newPrescription[0];
  })

  // Get patient history
  .get('/api/patients/:id/history', async ({ params: { id } }) => {
    const records = await db.query.medicalRecords.findMany({
      where: eq(medicalRecords.patientId, id)
    });
    const scripts = await db.query.prescriptions.findMany({
      where: eq(prescriptions.patientId, id)
    });
    return { records, prescriptions: scripts };
  })
  
  // Get patient invoices
  .get('/api/patients/:id/invoices', async ({ params: { id } }) => {
    return await db.query.invoices.findMany({
      where: eq(invoices.patientId, id),
      orderBy: (invoices, { desc }) => [desc(invoices.id)]
    });
  })

  // Pay invoice
  .post('/api/invoices/:id/pay', async ({ params: { id } }) => {
    const updated = await db.update(invoices)
      .set({ status: 'PAID', paymentMethod: 'MOCK_STRIPE' })
      .where(eq(invoices.id, id))
      .returning();
      
    await db.insert(communications).values({
      patientId: updated[0].patientId,
      type: 'EMAIL',
      message: `Payment Received: Thank you for your payment of $150.00.`
    });

    return updated[0];
  })

  // Phase 4: Notifications
  .get('/api/patients/:id/notifications', async ({ params: { id } }) => {
    return await db.query.communications.findMany({
      where: eq(communications.patientId, id),
      orderBy: (communications, { desc }) => [desc(communications.id)]
    });
  })

  // Generic status update (state machine)
  .put('/api/appointments/:id/status', async ({ params: { id }, body }) => {
    const { status } = body as any;
    const updated = await db.update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    return updated[0];
  })

  // All appointments for a doctor (all statuses)
  .get('/api/doctors/:id/all-appointments', async ({ params: { id } }) => {
    return await db.query.appointments.findMany({
      where: eq(appointments.doctorId, id),
      orderBy: (appointments, { asc }) => [asc(appointments.startTime)]
    });
  })

  // Create a new appointment
  .post('/api/appointments', async ({ body }) => {
    const { patientId, doctorId, startTime, endTime, appointmentType } = body as any;
    const newApt = await db.insert(appointments).values({
      patientId,
      doctorId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: 'SCHEDULED',
      appointmentType: appointmentType || 'IN_PERSON'
    }).returning();
    return newApt[0];
  })

  // Patient Documents
  .get('/api/patients/:id/documents', async ({ params: { id } }) => {
    return await db.query.documents.findMany({
      where: eq(documents.patientId, id),
      orderBy: (docs, { desc }) => [desc(docs.createdAt)]
    });
  })
  .post('/api/patients/:id/documents', async ({ params: { id }, body }) => {
    const { uploaderId, name, url, size, type } = body as any;
    const newDoc = await db.insert(documents).values({
      patientId: id,
      uploaderId,
      name,
      url,
      size,
      type
    }).returning();
    return newDoc[0];
  })

  // All patients
  .get('/api/patients', async () => {
    return await db.query.users.findMany({
      where: eq(users.role, 'PATIENT')
    });
  })

  // Create a new patient
  .post('/api/patients', async ({ body }) => {
    const { name, email, phone, age, gender, department, diagnosis, inpatientStatus, insuranceType } = body as any;
    
    // Check if email already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    if (existing) return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 400 });

    const newUser = await db.insert(users).values({
      role: 'PATIENT',
      name,
      email,
      phone,
      age: age ? parseInt(age) : null,
      gender,
      department,
      diagnosis,
      inpatientStatus,
      insuranceType
    }).returning();
    
    return newUser[0];
  })

  // All invoices (admin billing)
  .get('/api/invoices', async () => {
    return await db.query.invoices.findMany({
      orderBy: (invoices, { desc }) => [desc(invoices.id)]
    });
  })

  // Mark invoice paid (admin)
  .put('/api/invoices/:id/mark-paid', async ({ params: { id } }) => {
    const updated = await db.update(invoices)
      .set({ status: 'PAID', paymentMethod: 'ADMIN_MANUAL' })
      .where(eq(invoices.id, id))
      .returning();
    return updated[0];
  })

  // Messaging routes
  .get('/api/users/:id/conversations', async ({ params: { id } }) => {
    const sent = await db.query.messages.findMany({ where: eq(messages.senderId, id) });
    const received = await db.query.messages.findMany({ where: eq(messages.receiverId, id) });
    const all = [...sent, ...received];
    // Deduplicate partner IDs
    const partnerIds = new Set<string>();
    all.forEach(m => {
      if (m.senderId === id) partnerIds.add(m.receiverId);
      else partnerIds.add(m.senderId);
    });
    // Build conversation summaries
    const convos = [];
    for (const pid of partnerIds) {
      const thread = all.filter(m => m.senderId === pid || m.receiverId === pid).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const partner = await db.query.users.findFirst({ where: eq(users.id, pid) });
      const unreadCount = thread.filter(m => m.receiverId === id && m.isRead === 0).length;
      
      convos.push({
        partnerId: pid,
        partnerName: partner?.name || 'Unknown',
        partnerRole: partner?.role || '',
        lastMessage: thread[0]?.content || '',
        lastTime: thread[0]?.createdAt || '',
        unread: unreadCount,
        isOnline: true // Mocking online status for visuals
      });
    }
    return convos;
  })

  .get('/api/messages/:userId/:partnerId', async ({ params: { userId, partnerId } }) => {
    const all = await db.query.messages.findMany();
    const thread = all.filter(m =>
      (m.senderId === userId && m.receiverId === partnerId) ||
      (m.senderId === partnerId && m.receiverId === userId)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Mark received messages as read
    const unread = thread.filter(m => m.receiverId === userId && m.isRead === 0);
    if (unread.length > 0) {
      for (const msg of unread) {
        await db.update(messages).set({ isRead: 1 }).where(eq(messages.id, msg.id));
      }
    }

    return thread;
  })

  // File Upload Endpoint
  .post('/api/upload', async ({ body }) => {
    const { file } = body as { file: File };
    if (!file) return new Response('No file provided', { status: 400 });
    
    // Generate unique name
    const ext = file.name.split('.').pop()?.toLowerCase();
    const filename = `${crypto.randomUUID()}.${ext}`;
    
    // Create uploads dir if it doesn't exist
    const fs = await import('fs');
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads');
    }
    
    await Bun.write(`./uploads/${filename}`, file);
    
    return { url: `/uploads/${filename}`, name: file.name, type: file.type };
  })

  // Serve Uploaded Files
  .get('/uploads/:filename', ({ params: { filename } }) => {
    return Bun.file(`./uploads/${filename}`);
  })

  .post('/api/messages', async ({ body }) => {
    const { senderId, receiverId, content, attachments } = body as any;
    const msg = await db.insert(messages).values({
      senderId,
      receiverId,
      content,
      attachments: attachments ? attachments : null
    }).returning();
    return msg[0];
  })

  // --- NEW LABCONNECT ENDPOINTS ---

  .post('/api/lab-orders', async ({ body }) => {
    const { patientId, doctorId, facility, procedures, doctorsNote } = body as any;
    const newOrder = await db.insert(labOrders).values({
      patientId,
      doctorId,
      facility,
      procedures,
      doctorsNote,
      status: 'Active'
    }).returning();
    return newOrder[0];
  })

  .get('/api/doctors/:id/lab-orders', async ({ params: { id } }) => {
    const orders = await db.query.labOrders.findMany({
      where: eq(labOrders.doctorId, id),
      orderBy: (orders, { desc }) => [desc(orders.createdAt)]
    });
    
    // Map patient names
    const pats = await db.query.users.findMany({ where: eq(users.role, 'PATIENT') });
    return orders.map(o => ({
      ...o,
      patientName: pats.find(p => p.id === o.patientId)?.name || 'Unknown'
    }));
  })

  .get('/api/doctors/:id/lab-results', async ({ params: { id } }) => {
    const results = await db.query.labResults.findMany({
      orderBy: (results, { desc }) => [desc(results.createdAt)]
    });
    
    // Map patient names
    const pats = await db.query.users.findMany({ where: eq(users.role, 'PATIENT') });
    return results.map(r => ({
      ...r,
      patientName: pats.find(p => p.id === r.patientId)?.name || 'Unknown'
    }));
  })

  // --- NEW PATIENT ANALYTICS ENDPOINT ---

  .get('/api/doctors/:id/patients-analytics', async ({ params: { id } }) => {
    const pats = await db.query.users.findMany({ where: eq(users.role, 'PATIENT') });
    const total = pats.length || 1; // avoid div by 0 for mocks
    
    // Default to OUTPATIENT if null
    const inpatientCount = pats.filter(p => p.inpatientStatus === 'INPATIENT').length;
    const outpatientCount = total - inpatientCount;

    const privateIns = pats.filter(p => p.insuranceType === 'Private').length;
    const medicareIns = pats.filter(p => p.insuranceType === 'Medicare').length;
    const medicaidIns = pats.filter(p => p.insuranceType === 'Medicaid').length;
    const uninsuredIns = pats.filter(p => p.insuranceType === 'Uninsured').length;

    return {
      enrollment: total,
      visits: Math.floor(total * 2.5),
      activeCases: inpatientCount,
      inactiveCases: outpatientCount,
      insurance: {
        private: privateIns || Math.floor(total * 0.4),
        medicare: medicareIns || Math.floor(total * 0.2),
        medicaid: medicaidIns || Math.floor(total * 0.2),
        uninsured: uninsuredIns || Math.floor(total * 0.2),
      }
    };
  })

  // Dashboard stats for doctor dashboard KPIs
  .get('/api/doctors/:id/dashboard-stats', async ({ params: { id } }) => {
    const allAppointments = await db.query.appointments.findMany({
      where: eq(appointments.doctorId, id),
      orderBy: (appointments, { desc }) => [desc(appointments.startTime)]
    });
    const pats = await db.query.users.findMany({ where: eq(users.role, 'PATIENT') });
    const results = await db.query.labResults.findMany();
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    const todayApts = allAppointments.filter(a => {
      const d = new Date(a.startTime);
      return d >= today && d <= todayEnd;
    });

    const recentApts = allAppointments.slice(0, 5);
    // Attach patient names to recent appointments
    const recentWithNames = recentApts.map(a => ({
      ...a,
      patientName: pats.find(p => p.id === a.patientId)?.name || 'Unknown'
    }));

    return {
      totalPatients: pats.length,
      todayAppointments: todayApts.length,
      pendingLabs: results.filter(r => r.status === 'Pending').length,
      totalAppointments: allAppointments.length,
      completedAppointments: allAppointments.filter(a => a.status === 'COMPLETED').length,
      scheduledAppointments: allAppointments.filter(a => a.status === 'SCHEDULED').length,
      recentAppointments: recentWithNames
    };
  })

  // All users (for contacts in messaging)
  .get('/api/users', async () => {
    return await db.query.users.findMany();
  })

  // --- NEW AI ASSISTANT ENDPOINT ---
  .post('/api/ai/chat', async ({ body }) => {
    const { message, history } = body as any;
    try {
      const { GoogleGenAI } = require('@google/genai');
      // This will automatically pick up GEMINI_API_KEY from process.env
      const ai = new GoogleGenAI({});
      
      const systemInstruction = "You are a highly capable Clinical AI Assistant embedded in the HotDoc clinic portal. You are talking to a Doctor. Keep your responses concise, professional, and medically sound. Use markdown formatting to make your responses easy to read.";
      
      let formattedHistory = "Previous Conversation:\n";
      for (const msg of history) {
        formattedHistory += `${msg.role === 'user' ? 'Doctor' : 'AI'}: ${msg.content}\n`;
      }
      
      const prompt = `${systemInstruction}\n\n${formattedHistory}\nDoctor: ${message}\nAI:`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return { response: response.text };
    } catch (e: any) {
      console.error('Gemini API Error:', e);
      return new Response(JSON.stringify({ error: e.message || 'Failed to call Gemini API' }), { status: 500 });
    }
  })

  .listen(3002);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
